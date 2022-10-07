const sqlite = require('better-sqlite3');
const loadScripts = require('./scripts/scripts');

class Logs {
    constructor() {
        this.db = sqlite('indexers/logs/logs.db');
        this.scripts = loadScripts(this.db);
    }
    
    async init() {
        await this.scripts.initDatabase();
        console.log('Logs initialized');
    }

    async beginTransaction() {
        await this.scripts.beginTransaction();
        console.log('Indexing transaction created');
    }

    async commitTransaction() {
        await this.scripts.commitTransaction();
        console.log('Indexing transaction commited');
    }

    async rollbackTransaction() {
        await this.scripts.rollbackTransaction();
        console.log('Indexing transaction rolled back');
    }
}

module.exports = Logs;