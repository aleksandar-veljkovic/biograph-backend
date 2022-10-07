const fs = require('fs');

class EntryIndexer {
    constructor(logs) {
        this.logs = logs;
        console.log('Entry indexer loaded'); 
        this.historicalIds = [];
        this.currentEntries = {};
    }

    async write() {
        // fs.writeFileSync('output.json', JSON.stringify(this.currentEntries, null, 2));
        const { createEntry, createEntryImport } = this.logs.scripts.entry;
        const entryPromises = [];
        const entryImportPromises = [];
        
        for (const { id, entryType, primaryId, isEdge, importId, isNew } of Object.values(this.currentEntries)) {
            try {
                if (isNew) {
                    entryPromises.push(createEntry(id, entryType, primaryId, isEdge ? 1 : 0));
                }

                entryImportPromises.push(createEntryImport(importId, id));
            } catch (err) {
                console.log({ id, entryType, primaryId, isEdge, importId, isNew });
                console.log(err);
                throw err;
            }
        }

        await Promise.all(entryPromises);
        await Promise.all(entryImportPromises);

        // Clean entries
        this.currentEntries = {};
        console.log('Entry index updated');
    }

    async createEntry(entryType, id, primaryId, isEdge, importId) {
        const { findEntry } = this.logs.scripts.entry;
        const dbEntry = await findEntry(id);
        const existingEntry = this.historicalIds[id] || dbEntry;

        if (!existingEntry) {
            this.historicalIds[id] = true;
            this.currentEntries[id] = {
                id,
                entryType,
                primaryId,
                isEdge,
                importId,
                isNew: !existingEntry,
            };
            return true;
        }

        return false;
    }

    updateEntry(id, updateObj) {
        if (this.currentEntries[id] == null) {
            throw new Error('Unknown entity',id);
        }

        this.currentEntries[id] = { ...this.currentEntries[id], ...updateObj };
    }
}

module.exports = EntryIndexer;