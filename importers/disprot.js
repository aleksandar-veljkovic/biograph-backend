const axios = require('axios');

class DisprotImporter {
    constructor(bg) {
        this.bg = bg;
        this.importer = 'disprot';
        this.importerVersion = '1.0';
        this.dataSource = 'DisProt';
        console.log('Disprot importer loaded');
    }

    async run() {
        const { bg } = this;
        
        // Start new import
        await bg.beginImport(this.importer, this.importerVersion, this.dataSource);

        console.log('Importing data from DisProt...');

        // DisProt URL
        const url = 'https://disprot.org/api/search?release=current&show_ambiguous=false&show_obsolete=false&format=json'
		
        // Acc list of all imported proteins from disprot
		const proteinAcc = [];

		console.log('Downloading DisProt data...');
		const { data, size } = (await axios.get(url)).data;
		console.log('Download complete, preparing data...');

        let i = 0;

        console.log('Parsing import data');
        for (const protein of data) {
			i += 1;

            // Logging progres
			if (i > 0 && i % 100 == 0) {
				console.log(`DisProt: ${i}/${data.length}`);
			}

            const {
				acc,
				disprot_id,
				name,
				genes,
			} = protein;

            proteinAcc.push(acc);
        
            let uniref50 = null;
			if (protein.uniref50 != null) {
				uniref50 = protein.uniref50;
			}

			let uniref90 = null;
			if (protein.uniref90 != null) {
				uniref90 = protein.uniref90;
			}

			let uniref100 = null;
			if (protein.uniref100 != null) {
				uniref100 = protein.uniref100;
			}

            const proteinEntityId = await bg.createEntityNode('Protein', acc);
            await bg.createIdentifierNode(proteinEntityId, 'id', 'DisProt ID', disprot_id);

            if (uniref50 != null) {
				await bg.createIdentifierNode(proteinEntityId, 'id', 'UniRef 50', uniref50);
			}

			if (uniref90 != null) {
				await bg.createIdentifierNode(proteinEntityId, 'id', 'UniRef 90', uniref90);
			}

			if (uniref100 != null) {
				await bg.createIdentifierNode(proteinEntityId, 'id', 'UniRef 100', uniref100);
			}

            await bg.createIdentifierNode(proteinEntityId, 'url', 'Disprot URL', `https://disprot.org/${disprot_id}`);
			await bg.createIdentifierNode(proteinEntityId, 'name', 'Protein Name', name);

			// Gene
			// =========================

			if (genes != null) {
				for (const gene of genes) {
					let geneEntityId = null
					if (gene.name != null) {
						const geneSymbol = gene.name.value;
						geneEntityId = await bg.createEntityNode('Gene', geneSymbol);
					}

					if (geneEntityId != null && gene.synonyms != null) {
						const geneSynonyms = gene.synonyms.map(el => el.value);
						for (const synonym of geneSynonyms) {
							await bg.createIdentifierNode(geneEntityId, 'id', 'Synonym', synonym);
						}
					}
				}
			}
			

            // Taxonomy
			// ==========================

			const taxonId = `${protein.ncbi_taxon_id}`;

			const organismName = protein.organism;

			const organismEntityId = await bg.createEntityNode('Organism', taxonId);
			const taxonEntityId = await bg.createEntityNode('Taxon', taxonId);

			await bg.createIdentifierNode(organismEntityId, 'id', 'Taxon ID', taxonId);
            await bg.createIdentifierNode(organismEntityId, 'id', 'Taxon Name', organismName);

            await bg.createIdentifierNode(taxonEntityId, 'id', 'Taxon ID', taxonId);
            await bg.createIdentifierNode(taxonEntityId, 'id', 'Taxon Name', organismName);


            await bg.createDataNode(organismEntityId, 'disprot', { species: taxonId });

			await bg.createEntityEdge(proteinEntityId, organismEntityId, 'FROM_ORGANISM', {});

            // Protein data
			// ==========================

			const disorderContent = parseFloat(protein.disorder_content);
			const regionsCounter = parseInt(protein.regions_counter);

            await bg.createDataNode(proteinEntityId, 'DisProt', {
				disorder_content: disorderContent,
				regions_counter: regionsCounter,
			});
        }

        console.log(`DisProt: ${size}/${size}`)

        // Finish and commit the import
        await bg.finishImport();
        console.log('Disprot import complete');
    }
}

module.exports = DisprotImporter;