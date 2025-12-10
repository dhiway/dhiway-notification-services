import Fastify from 'fastify';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { providers } from './lib/providers';
import * as queue from './lib/queue';
import { dedupe } from './lib/dedupe';

const app = Fastify({ logger: true });

const NotifySchema = z.object({
  channel: z.string(),
  to: z.string(),
  template_id: z.string(),
  priority: z.enum(['realtime', 'other']).optional(),
  variables: z.record(z.string(), z.any()),
  dedupe_id: z.string().optional(),
});

app.post('/notify', async (req, reply) => {
  const parsed = NotifySchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send(z.formatError(parsed.error));

  const body = parsed.data;
  const provider = providers[body.channel];
  if (!provider)
    return reply.code(400).send({ error: 'Unknown provider channel' });

  if (!provider.templates[body.template_id])
    return reply.code(400).send({ error: 'Unknown template for provider' });

  const v = provider.schema.safeParse(body.variables);
  if (!v.success)
    return reply.code(400).send({ error: z.formatError(v.error) });

  const job_id = uuid();
  const priority = body.priority ?? 'other';

  const dedupeKey =
    body.dedupe_id ?? `${body.channel}:${body.to}:${body.template_id}`;
  const isNew = await dedupe(dedupeKey);
  if (!isNew) return reply.send({ job_id, enqueued: false });

  const job = { job_id, ...body, priority };

  if (priority === 'realtime') await queue.pushRealtime(job);
  else await queue.pushOther(job);

  reply.send({ job_id, enqueued: true });
});

app.get('/providers', async () => {
  return Object.entries(providers).map(([_, provider]) => ({
    name: provider.name,
    templates: provider.templates,
    schema: z.toJSONSchema(provider.schema),
  }));
});

export default app;
