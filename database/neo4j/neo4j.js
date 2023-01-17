const neo4j = require('neo4j-driver');
const { session } = require('neo4j-driver');
const utils = require('../../utils');

class DB {
    constructor(config) {
        this.dbConfig = config.db;
        const { host, port, username, password } = this.dbConfig;
        this.driver = neo4j.driver(
            `${host}:${port}`, 
            neo4j.auth.basic(username, password),{encrypted:false});
    }

    disconnect() {
        this.driver.close();
    }

    connect() {
        return new Promise((resolve, reject) => {
            // resolve();
            this.driver.verifyConnectivity()
                .then(() => {
                    const session = this.createWriteSession();
                    const tx = session.beginTransaction();
                    const labels = ['Entity', 'Identifier', 'Data'];

                    const constraintPromises = labels.map(label => {
                        tx.run(`
                            CREATE CONSTRAINT ${label}_node_id IF NOT EXISTS ON (n:${label}) ASSERT n.id IS UNIQUE
                        `)
                    })

                        Promise.all(constraintPromises).then(() => {
                            tx.commit().then(() => {
                                session.close();
                                resolve();
                            }).catch(err => {console.log(err); reject(err)})
                    })
                })
                .catch((err) => reject(err))
        })
    }

    createWriteSession() {
        return this.driver.session({
            defaultAccessMode: session.WRITE,
            database: this.dbConfig.database,
        })
    }

    createReadSession() {
        return this.driver.session({
            defaultAccessMode: session.READ,
            database: this.dbConfig.database,
        })
    }

    async createNode(tx, { label, data }) {
        const query = `CREATE (n:${label}${data.entityType ? `:${data.entityType}` : ''} { ${utils.prepareFields(data)} }) RETURN 0`
        const params = { ...data};
        await tx.run(query, params);
        // return res.records[0].get('id').toNumber();
    }

    async createEdge(tx, { label, fromNode, fromLabel, toNode, toLabel, data }) {
        const query = `
            MATCH (a:${fromLabel}), (b:${toLabel}) 
            WHERE a.id = $fromNode AND b.id = $toNode 
            CREATE (a)-[r:${label} { ${utils.prepareFields(data)} }]->(b) RETURN 0`
        const params = { fromNode, toNode, ...data};
        await tx.run(query, params);
        // return res.records[0].get('id').toNumber();
    }
}

module.exports = DB;