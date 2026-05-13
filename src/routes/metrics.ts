import { FastifyInstance } from 'fastify';
import * as queue from '../lib/queue';
import { requestAuth } from '../plugins/request-auth';

export async function metricsRoutes(app: FastifyInstance) {
  app.get('/metrics/queue', { preHandler: requestAuth }, async (req, reply) => {
    try {
      const metrics = await queue.getQueueMetrics();

      return reply.send({
        status: 'ok',
        timestamp: Date.now(),
        queues: metrics,
      });
    } catch (err: any) {
      req.log.error('Failed to fetch queue metrics:', err?.message || 'Unknown');
      return reply.code(500).send({ error: 'Failed to fetch metrics' });
    }
  });
}
