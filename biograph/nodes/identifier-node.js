const BioGraphNode = require("./biograph-node");

class IdentifierNode extends BioGraphNode{
    constructor(identifierType, identifierTitle, identifierValue) {
        const data = { 
            title: identifierTitle, 
            type: identifierType,
            value: `${identifierValue}`,
        };

        super('Identifier', [identifierType, identifierValue], data);
    }
}

module.exports = IdentifierNode;