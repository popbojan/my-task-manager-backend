import Fastify from 'fastify';
import { authRoutes } from './adapters/driving/web/auth.route';

const fastify = Fastify({
  logger: true
});

fastify.register(authRoutes, { prefix: '/auth' });

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log("Server is running on http://localhost:3001");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
