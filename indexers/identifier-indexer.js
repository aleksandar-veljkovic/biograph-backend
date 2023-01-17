class IdentifierIndexer {
    constructor(logs) {
        this.logs = logs;
        console.log('Identifier indexer loaded');
        this.currentIdentifiers = [];
        this.currentIdentifierLinks = [];
    }

    async write() {
        const { createIdentifier, createIdentifierLink, recreateIdentifierIndex } = this.logs.scripts.identifier;

        const identifierPromises = this.currentIdentifiers.map(({ entryId, identifierType, value, isPrimary }) => {
                try {
                    return createIdentifier(entryId, identifierType, value, isPrimary ? 1 : 0);
                } catch (err) {
                    console.log(entryId, value, isPrimary ? 1 : 0);
                    console.log(err);
                    console.log();
                    throw err;
                }
            }
        );
        
        const identifierLinkPromises = this.currentIdentifierLinks.map(({ entryId, entityId }) => {
            try {
                return createIdentifierLink(entryId, entityId);
            } catch (err) {
                console.log(entryId, entityId);
                console.log(err);
                console.log();
                throw err;
            }
        }
    );

        await Promise.all(identifierPromises);
        await Promise.all(identifierLinkPromises);
        await recreateIdentifierIndex();
        console.log('Identifier index updated');
    }

    async createIdentifier(entryId, identifierType, value, isPrimary) {
        this.currentIdentifiers.push({
            entryId,
            identifierType, 
            value, 
            isPrimary,
        });

        return false;
    }

    async createIdentifierLink(entryId, entityId) {
        this.currentIdentifierLinks.push({
            entryId,
            entityId,
        });

        return false;
    }

    async getEntitiesByIdentifier(identifierId, entityType) {
        const { findEntitiesById } = this.logs.scripts.identifier;
        return findEntitiesById(identifierId, entityType);
    }

    async getEntityIdentifiers(identifierIds) {
        const { findId } = this.logs.scripts.identifier;
        return findId(identifierIds);
    }
}

module.exports = IdentifierIndexer;