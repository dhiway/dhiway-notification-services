import { popRealtime, popOther } from './queue';
import { providers } from './providers';

async function processJob(job: any) {
  const provider = providers[job.channel];
  const templateId = provider.templates[job.template_id];

  const res = await provider.send({
    to: job.to,
    template_id: templateId,
    variables: job.variables,
  });

  if (!res.ok) {
    console.log('Retrying:', job.job_id);
    return popOther();
  }

  console.log('Delivered:', job.job_id);
}

async function workerLoop(popFn: any) {
  while (true) {
    const res = await popFn();
    if (!res) continue;

    const job = JSON.parse(res[1]);
    await processJob(job);
  }
}

if (process.argv.includes('worker')) {
  workerLoop(popRealtime);
  workerLoop(popOther);
}

export function spawnWorker() {
  const { fork } = require('child_process');
  fork(__filename, ['worker']);
}
