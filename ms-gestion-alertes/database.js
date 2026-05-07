const { createRxDatabase } = require('rxdb');
const { getRxStoragePouch, addPouchPlugin } = require('rxdb/plugins/pouchdb');

// On utilise un adaptateur 'memory' pour le développement, 
// ou 'leveldb' pour que les données restent après un redémarrage.
addPouchPlugin(require('pouchdb-adapter-memory')); 

// Définition du schéma de l'incident (NoSQL)
const incidentSchema = {
    title: 'incident schema',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        type: { type: 'string' },
        description: { type: 'string' },
        severity: { type: 'string' },
        timestamp: { type: 'string' }
    },
    required: ['id', 'type', 'severity']
};

async function initDB() {
    const db = await createRxDatabase({
        name: 'incidentdb',
        storage: getRxStoragePouch('memory')
    });

    await db.addCollections({
        incidents: { schema: incidentSchema }
    });

    return db;
}

module.exports = { initDB };
