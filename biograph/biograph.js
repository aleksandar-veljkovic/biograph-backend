const CustomEdge = require("./edges/custom-edge");
const FromImportEdge = require("./edges/from-import-edge");
const HasDataEdge = require("./edges/has-data-edge");
const HasIdEdge = require("./edges/has-id-edge");
const DataNode = require("./nodes/data-node");
const EntityNode = require("./nodes/entity-node");
const IdentifierNode = require("./nodes/identifier-node");
const ImportNode = require("./nodes/import-node");

class BioGraph {
    constructor(db, indexers) {
        this.db = db;
        this.session = null;
        this.tx = null;
        this.indexers = indexers; 

        this.currentImport = null;
        this._initImport();
    }

    _initImport() {
        this.currentImport = { id: null, nodes: [], edges: [] };
    }

    async beginImport(importer, importerVersion, dataSource) {
        this._initImport();
        this.currentImport.id = this.indexers.importIndexer.createImport(importer, importerVersion, dataSource);
        this.session = this.db.createWriteSession();
        
        // Begin graph database transaction
        this.tx = this.session.beginTransaction();

        // Begin indexer transaction
        await this.indexers.beginTransaction();
    }

    async write() {
        // console.log(JSON.stringify(this.currentImport.nodes, null, 2));
        // process.exit();

        console.log('Importing vertices');
        // console.log(this.tx);
        for (const node of this.currentImport.nodes) {
            await this.db.createNode(this.tx, node);
        }

        console.log('Importing edges');
        for (const edge of this.currentImport.edges) {
            await this.db.createEdge(this.tx, edge);
        }
    }

    async finishImport() {
        try {
            await this.write();

            console.log('Importing data');

            // Commit indexers
            await this.indexers.importIndexer.write();
            await this.indexers.entryIndexer.write();
            await this.indexers.identifierIndexer.write();
            await this.indexers.descriptionIndexer.write();
            
            await this.tx.commit();
            await this.indexers.commitTransaction();
                
        } catch(err) {
            console.log(err);
            // this.rollbackImport();
            throw new Error('Import failed');
        } finally {
            await this.session.close();
            this.importId = null;
            this.session = null;
            this.tx = null;
        }
    }

    async rollbackImport() {
        await this.indexers.rollbackTransaction();
        await this.tx.rollback();
        this.tx = null;

        await this.session.close();
        this.session = null;
    }

    async createEntityNode(entityType, primaryId) {
        const { id: importId } = this.currentImport;
        const entityNode = new EntityNode(primaryId, entityType);

        const isNodeAdded = await this.indexers.entryIndexer.createEntry(entityType, entityNode.getKey(), primaryId, false, importId);

        if (isNodeAdded) {
            await this.createIdentifierNode(entityNode.getKey(), 'id', 'Primary ID', primaryId, true);
            this.currentImport.nodes.push(entityNode.getObj());
        }

        return entityNode.getKey();
    }

    async createIdentifierNode(entityId, identifierType, identifierTitle, identifierValue, isPrimary=false) {
        const { id: importId } = this.currentImport;
        const identifierNode = new IdentifierNode(identifierType, identifierTitle, identifierValue);
        const hasIdEdge = new HasIdEdge(entityId, identifierNode.getKey());

        const isNodeAdded = await this.indexers.entryIndexer.createEntry(identifierNode.type, identifierNode.getKey(), null, false, importId);
        const isIdentifierEdgeAdded = await this.indexers.entryIndexer.createEntry(hasIdEdge.type, hasIdEdge.getKey(), null, true, importId);

        if (isNodeAdded) {
            this.currentImport.nodes.push(identifierNode.getObj());
            await this.indexers.identifierIndexer.createIdentifier(identifierNode.getKey(), identifierType, identifierValue, isPrimary);
        }

        if (isIdentifierEdgeAdded) {
            await this.indexers.identifierIndexer.createIdentifierLink(identifierNode.getKey(), entityId);
        }

        if (isIdentifierEdgeAdded) {
            this.currentImport.edges.push(hasIdEdge.getObj());
        }

        return identifierNode.getKey();
    }

    async createDataNode(entityId, source, content, descriptionKey=null) {
        const { id: importId } = this.currentImport;
        const dataNode = new DataNode(source, content);
        const hasDataEdge = new HasDataEdge(entityId, dataNode.getKey());

        const isNodeAdded = await this.indexers.entryIndexer.createEntry('DATA', dataNode.getKey(), null, false, importId);
        const isDataEdgeAdded = await this.indexers.entryIndexer.createEntry(hasDataEdge.type, hasDataEdge.getKey(), null, true, importId);

        if (isNodeAdded) {
            this.currentImport.nodes.push(dataNode.getObj());

            if (descriptionKey != null) {
                const descriptionText = content[descriptionKey];
                this.indexers.descriptionIndexer.createDescription(dataNode.getKey(), entityId, descriptionText);
            }
        }

        if (isDataEdgeAdded) {
            this.currentImport.edges.push(hasDataEdge.getObj());
        }

        return dataNode.getKey();
    }

    async createEntityEdge(fromEntityId, toEntityId, edgeType, content) {
        const { id: importId } = this.currentImport;
        const customEdge = new CustomEdge(edgeType, fromEntityId, toEntityId, 'Entity', 'Entity', content);

        const isEdgeAdded = await this.indexers.entryIndexer.createEntry(customEdge.type, customEdge.getKey(), null, true, importId);

        if (isEdgeAdded) {
            this.currentImport.edges.push(customEdge.getObj());
        }

        return customEdge.getKey();
    }
}

module.exports = BioGraph;