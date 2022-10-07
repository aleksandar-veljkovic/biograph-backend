class DescriptionIndexer {
    constructor(logs) {
        this.logs = logs;
        console.log('Description indexer loaded');

        this.currentDescriptions = [];
    }

    async write() {
        const { createDescription, recreateDescriptionIndex } = this.logs.scripts.description;

        const promises = this.currentDescriptions.map(({ entryId, entityId, descriptionText }) => 
            createDescription(entryId, entityId, descriptionText)
        )

        await Promise.all(promises);
        await recreateDescriptionIndex();
        console.log('Description index updated');
    }

    async createDescription(entryId, entityId, descriptionText) {
        this.currentDescriptions.push({
            entryId, 
            entityId, 
            descriptionText,
        });

        return false;
    }
}

module.exports = DescriptionIndexer;