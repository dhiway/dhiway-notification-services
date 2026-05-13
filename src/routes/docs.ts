import { FastifyInstance } from 'fastify';
import { openApiDocument } from '../lib/utils/openapi';

export async function docsRoutes(app: FastifyInstance) {
  app.get('/', async (_, reply) => {
    return reply.type('text/html').send(`<!doctype html>
<html>
  <head>
    <title>Notification Service API</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
    <script>
      Scalar.createApiReference('#app', {
        url: '/openapi.json',
        title: 'Notification Service API'
      })
    </script>
  </body>
</html>`);
  });

  app.get('/openapi.json', async () => openApiDocument());
}
