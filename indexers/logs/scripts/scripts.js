const fs = require('fs');

const initDatabase = fs.readFileSync('./indexers/logs/scripts/init-database.sql', 'utf8');
const createImport = fs.readFileSync('./indexers/logs/scripts/create-import.sql', 'utf8');
const findEntry = fs.readFileSync('./indexers/logs/scripts/find-entry.sql', 'utf8');
const createEntry = fs.readFileSync('./indexers/logs/scripts/create-entry.sql', 'utf8');
const createEntryImport = fs.readFileSync('./indexers/logs/scripts/create-entry-import.sql', 'utf8');
const createIdentifier = fs.readFileSync('./indexers/logs/scripts/create-identifier.sql', 'utf8');
const createDescription = fs.readFileSync('./indexers/logs/scripts/create-description.sql', 'utf8');
const recreateDescriptionIndex = fs.readFileSync('./indexers/logs/scripts/recreate-description-index.sql', 'utf8');

// Import indexer methods

module.exports = (db) => ({
    initDatabase: async () => db.exec(initDatabase),
    beginTransaction: async () => db.exec('BEGIN TRANSACTION;'),
    commitTransaction: async () => db.exec('COMMIT;'),
    rollbackTransaction: async () => db.exec('ROLLBACK;'),
    
    import: {
        createImport: async (id, importer, importerVersion, importDate, dataSource) => 
            db.prepare(createImport).run(id, importer, importerVersion, importDate, dataSource),
    },
    
    entry: {
        createEntry: (id, entryType, primaryId, isEdge) => 
            db.prepare(createEntry).run(id, entryType, primaryId, isEdge),
        createEntryImport: (importId, entryId) => 
            db.prepare(createEntryImport).run(importId, entryId),
        findEntry: async (id) => db.prepare(findEntry).get(id),
    },

    identifier: {
        createIdentifier: (entryId, entityId, value, isPrimary) =>
            db.prepare(createIdentifier).run(entryId, entityId, value, isPrimary),
    },

    description: {
        createDescription: (entryId, entityId, descriptionText) =>
            db.prepare(createDescription).run(entryId, entityId, descriptionText),
        recreateDescriptionIndex: () => 
            db.exec(recreateDescriptionIndex),
    }
});