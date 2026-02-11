import Fastify from 'fastify';

const fastify = Fastify({
  logger: true // Sehr hilfreich beim Entwickeln!
});

// Eine Test-Route
fastify.get('/ping', async (request, reply) => {
  return { pong: 'it works!' };
});

// Server starten
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log("Server läuft auf http://localhost:3001");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
