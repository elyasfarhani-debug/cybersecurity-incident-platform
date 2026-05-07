const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const db = require('./database');
const { Kafka } = require('kafkajs');

// 1. Configuration de Kafka
const kafka = new Kafka({ clientId: 'log-service', brokers: ['localhost:9092'] });
const producer = kafka.producer();

// 2. Configuration gRPC
const PROTO_PATH = path.resolve(__dirname, '../proto/incident.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const incidentProto = grpc.loadPackageDefinition(packageDefinition).incident;

async function startServer() {
    await producer.connect(); // Connexion à Kafka
    console.log("Connecté à Kafka en tant que Producteur");

    const server = new grpc.Server();

    server.addService(incidentProto.IncidentService.service, {
        // Cette méthode reçoit le log de la Gateway
        ReportIncident: (call, callback) => {
            const { type, description, severity } = call.request;

            // A. Sauvegarde dans SQLite3 (Exigence SQL du cahier des charges)
            const query = `INSERT INTO logs (source_ip, event_type, severity) VALUES (?, ?, ?)`;
            db.run(query, [description, type, severity], async function(err) {
                if (err) return callback(err);

                // B. Envoi vers Kafka pour le Microservice 2 (Analyse)
                await producer.send({
                    topic: 'raw-logs',
                    messages: [{ value: JSON.stringify(call.request) }],
                });

                console.log(`Log reçu et envoyé à Kafka: ${type}`);
                callback(null, { message: "Log collecté et archivé dans SQLite3" });
            });
        }
    });

    server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
        console.log('Microservice Collecte de Logs tournant sur le port 50051');
        server.start();
    });
}

startServer().catch(console.error);
