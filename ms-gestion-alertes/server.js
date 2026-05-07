const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { initDB } = require('./database');

// Chemin vers ton fichier proto
const PROTO_PATH = path.resolve(__dirname, '../proto/incident.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const incidentProto = grpc.loadPackageDefinition(packageDefinition).incident;

async function startServer() {
    const db = await initDB(); // Initialisation RxDB

    const server = new grpc.Server();

    // Implémentation des fonctions gRPC
    server.addService(incidentProto.IncidentService.service, {
        // Fonction pour récupérer toutes les alertes
        GetAllIncidents: async (call, callback) => {
            const allIncidents = await db.incidents.find().exec();
            // On transforme les documents RxDB en format JSON pour gRPC
            const results = allIncidents.map(doc => ({
                type: doc.type,
                description: doc.description,
                severity: doc.severity
            }));
            callback(null, { incidents: results });
        },
        
        // Fonction pour ajouter une alerte (sera appelée par le service d'analyse)
        ReportIncident: async (call, callback) => {
            const newIncident = call.request;
            await db.incidents.insert({
                id: Date.now().toString(),
                ...newIncident,
                timestamp: new Date().toISOString()
            });
            callback(null, { message: "Alerte enregistrée dans RxDB avec succès !" });
        }
    });

    server.bindAsync('0.0.0.0:50053', grpc.ServerCredentials.createInsecure(), (err, port) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(`Microservice Gestion d'Alertes tournant sur le port : ${port}`);
        server.start();
    });
}

startServer();
