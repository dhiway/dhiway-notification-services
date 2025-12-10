import Fastify from 'fastify';
import { v4 as uuid } from 'uuid';
import { dedupe } from './lib/dedupe';
import * as queue from './lib/queue';
import { NotifyRequest, Job } from './types';
import { providers } from './lib/providers';

const app = Fastify({ logger: true });

app.post('/notify', async (req, reply) => {
  const body = req.body as NotifyRequest;

  if (!providers[body.channel]) {
    return reply.code(400).send({ error: 'Unknown provider channel' });
  }

  const job_id = uuid();
  const priority = body.priority || 'other';

  // Dedupe
  const key =
    body.dedupe_id || `${body.channel}:${body.to}:${body.template_id}`;
  const isNew = await dedupe(key);
  if (!isNew) return reply.send({ job_id, enqueued: false });

  const job: Job = {
    job_id,
    channel: body.channel,
    priority,
    to: body.to,
    template_id: body.template_id,
    variables: body.variables,
  };

  console.log('JOB ENTRY: ', job);

  if (priority === 'realtime') {
    await queue.pushRealtime(job);
  } else {
    await queue.pushOther(job);
  }

  return reply.send({ job_id, enqueued: true });
});

export default app;
