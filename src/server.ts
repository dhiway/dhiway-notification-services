import app from './app.js';
import { loadSecrets } from './lib/auth/secrets.js';
import { spawnWorker } from './lib/worker.js';

const PORT = process.env.SERVER_PORT || `3000`;

loadSecrets();

app.listen({ port: parseInt(PORT) || 3000, host: '0.0.0.0' }).then(() => {
  spawnWorker();
  console.log(`API running on worker ${process.pid}`);
});
