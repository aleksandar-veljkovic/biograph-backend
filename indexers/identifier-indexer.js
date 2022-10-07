class IdentifierIndexer {
    constructor(logs) {
        this.logs = logs;
        console.log('Identifier indexer loaded');
        this.currentIdentifiers = [];
    }

    async write() {
        const { createIdentifier } = this.logs.scripts.identifier;

        const promises = this.currentIdentifiers.map(({ entryId, entityId, value, isPrimary }) => {
                try {
                    return createIdentifier(entryId, entityId, value, isPrimary ? 1 : 0)
                } catch (err) {
                    console.log(entryId, entityId, value, isPrimary ? 1 : 0);
                    console.log(err);
                    console.log();
                    throw err;
                }
            }
        )

        await Promise.all(promises);
        console.log('Identifier index updated');
    }

    async createIdentifier(entryId, entityId, value, isPrimary) {
        this.currentIdentifiers.push({
            entryId,
            entityId, 
            value, 
            isPrimary,
        });

        return false;
    }
}

module.exports = IdentifierIndexer;