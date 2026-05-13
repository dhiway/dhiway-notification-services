import Fastify from 'fastify';
import { docsRoutes } from './routes/docs';
import { metricsRoutes } from './routes/metrics';
import { notifyRoutes } from './routes/notify';
import { providerRoutes } from './routes/providers';
import { retryRoutes } from './routes/retry';

const app = Fastify({ logger: true });

app.register(docsRoutes);
app.register(notifyRoutes);
app.register(providerRoutes);
app.register(metricsRoutes);
app.register(retryRoutes);

export default app;
