import {
  popRealtime,
  popOther,
  popScheduledRetries,
  pushDLQ,
  scheduleRetry,
} from './queue';
import { providers } from './providers';
import { Job } from 'src/types';
import { loadSecrets } from './auth/secrets';

const MAX_RETRIES = 5;

async function processJob(job: Job) {
  const provider = providers[job.channel];
  job.attempt = (job.attempt ?? 0) + 1;

  const templateId = provider.templates[job.template_id];

  console.log(`Processing ${job.job_id} (attempt ${job.attempt})`);

  const res = await provider.send({
    to: job.to,
    template_id: templateId,
    variables: job.variables,
  });

  if (!res.ok) {
    if (job.attempt >= MAX_RETRIES) {
      console.log('Max retries reached → DLQ:', job.job_id);
      return pushDLQ(job);
    }

    const delay = 5 * Math.pow(2, job.attempt - 1);
    console.log(`Retry scheduled in ${delay}s:`, job.job_id);

    return scheduleRetry(job, delay);
  }

  console.log('Delivered:', job.job_id);
}

async function mainLoop() {
  while (true) {
    // 1) Try realtime queue (priority)
    const realtime = await popRealtime();
    if (realtime) {
      const job = JSON.parse(realtime[1]);
      await processJob(job);
      continue;
    }

    // 2) Try retry queue
    const retries = await popScheduledRetries();
    if (retries.length > 0) {
      for (const job of retries) {
        await processJob(job);
      }
      continue;
    }

    // 3) Try other queue (low priority)
    const other = await popOther();
    if (other) {
      const job = JSON.parse(other[1]);
      await processJob(job);
      continue;
    }

    // 4) idle for 200ms
    await new Promise((r) => setTimeout(r, 200));
  }
}

if (process.argv.includes('worker')) {
  loadSecrets();
  console.log('Worker started:', process.pid);
  mainLoop();
}

export function spawnWorker() {
  const { fork } = require('child_process');
  fork(__filename, ['worker']);
}
