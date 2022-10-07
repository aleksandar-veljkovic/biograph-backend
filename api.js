const restify = require('restify');
const corsMiddleware = require('restify-cors-middleware');
const Neo4J = require('./database/neo4j/neo4j');
const config = require('./config');
const utils = require('./utils');

const db = new Neo4J(config);
db.connect();

const cors = corsMiddleware({
    origins: ['*'],
    allowHeaders: ['*'],
    exposeHeaders: ['*'],
});

const server = restify.createServer({
    name: config.api.appName,
});

server.pre(cors.preflight);
server.use(cors.actual);
server.use(restify.plugins.queryParser({ mapParams: false }));
server.use(restify.plugins.bodyParser());

// Routes
// =================================

// Heartbeat 
server.get('/', (req, res, next) => {
    res.send({ message: `${config.api.appName} is running`, timestamp: new Date().getTime() });
    return next();
});

server.post('/query', (req, res, next) => {
    if (req.body == null) {
        res.status(400);
        res.send({ message: 'Empty request' });
        return next();
    }

    const { query } = req.body;
    if (query == null) {
        res.status(400);
        res.send({ message: 'Empty query' });
        return next();
    }

    const { match, params } = query;

    const preparedQuery = utils.prepareQuery(match, params);
    
    const startTime = new Date();

    const session = db.createReadSession();
    console.log(preparedQuery);

    session.run(preparedQuery).then((results) => {
        console.log(`Query finished in ${new Date().getTime() - startTime} ms`);
        res.send(utils.formatQueryResults(results));
        session.close()
    })
});

server.get('/node', (req, res, next) => {
    const { primaryId } = req.query;

    const session = db.createReadSession();
    const query = `MATCH p = (n:Entity)-[r]-(m) WHERE n.primaryId = $primaryId RETURN n, r, m`;

    session.run(query, { primaryId }).then((results) => {
        res.send(utils.formatSingleNodeResults(results));
        session.close()
    })
})

server.listen(
    config.api.port,
    config.api.host || 'localhost',
    () => console.log(`${config.api.appName} API listening at ${
      server.address().address
    }:${
      config.api.port
    }`),
  );
