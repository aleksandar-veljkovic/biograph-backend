const config = require('./config');
const utils = require('./utils');

// const query = {
//     "match": [
//       "(node_n0ffe:Protein)-[E9e97756def2a4c7fb1c0acfbace83a06:FROM_GENE]-(node_n2f32:Gene)"
//     ],
//     "returns": [
//       "node_n2f32",
//       "node_n0ffe"
//     ],
//     "params": {
//       "E9e97756def2a4c7fb1c0acfbace83a06": {
//         "identifiers": [],
//         "data": []
//       },
//       "node_n2f32": {
//         "identifiers": [
//             {
//                 value: "BRCA2"
//             }
//         ],
//         "data": [{
//             field: 'polje',
//             op: 'EQ',
//             value: 'vrednost'
//         }]
//       },
//       "node_n0ffe": {
//         "identifiers": [{
//             value: "AB123"
//         },
//         {
//             value: "BCD345"
//         }],
//         "data": []
//       }
//     },
//     "labels": {
//       "node_n0ffe": null,
//       "node_n2f32": null
//     }
//   };

const query = {
    "match": [
      "(node_nc868:Protein)-[E64086b323220465f8b5d6b52a9791b91:FROM_GENE]-(node_n8d7c:Gene)",
      "(node_nc868:Protein)-[Ea26368a27d8d4e88a5aac263334c690c:IS_ANTIGEN]-(node_n02aa:Antigen)"
    ],
    "params": {
      "E64086b323220465f8b5d6b52a9791b91": {
        "identifiers": [],
        "data": []
      },
      "Ea26368a27d8d4e88a5aac263334c690c": {
        "identifiers": [],
        "data": []
      },
      "node_n8d7c": {
        "identifiers": [],
        "data": []
      },
      "node_nc868": {
        "identifiers": [],
        "data": [
          {
            "field": "disorder_content",
            "op": "GT",
            "value": 0.9,
            "isNumber": true
          }
        ]
      },
      "node_n02aa": {
        "identifiers": [],
        "data": []
      }
    }
  }
  

const prepared = utils.prepareQuery(query.match, query.params);

const Neo4J = require('./database/neo4j/neo4j');
const db = new Neo4J(config);
db.connect().then(() => {
    const session = db.createReadSession();
    session.run(prepared).then((res) => {
        console.log(JSON.stringify(utils.formatQueryResults(res)[0], null, 2));
        // utils.formatQueryResults(res)
    })
})

// console.log(prepared);