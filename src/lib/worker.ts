import {
  popRealtime,
  popOther,
  pushDLQ,
  scheduleRetry,
  popScheduledRetries,
} from './queue';
import { providers } from './providers';
import { Job } from 'src/types';

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
      console.log('Max retries reached → moving to DLQ:', job.job_id);
      return await pushDLQ(job);
    }

    const delay = 5 * Math.pow(2, job.attempt - 1); // exponential backoff
    console.log(`Retry scheduled in ${delay}s:`, job.job_id);

    await scheduleRetry(job, delay);
    return;
  }

  console.log('Delivered:', job.job_id);
}

export function spawnWorker() {
  const { fork } = require('child_process');
  fork(__filename, ['worker'], {
    env: { ...process.env, WORKER: 'true' },
  });
}

async function workerLoop(popFn: any) {
  async function loop() {
    const res = await popFn();
    if (res) {
      const job = JSON.parse(res[1]);
      await processJob(job);
    }
    setImmediate(loop);
  }
  loop();
}

async function retryLoop() {
  async function loop() {
    try {
      const jobs = await popScheduledRetries();
      if (jobs.length) {
        console.log('Retry loop found jobs:', jobs.length);
        for (const j of jobs) {
          try {
            console.log('Retrying scheduled job:', j.job_id);
            await processJob(j);
          } catch (err) {
            console.error('Error processing scheduled job:', j.job_id, err);
            // if processJob re-schedules it again, that's fine
          }
        }
      }
    } catch (err) {
      console.error('Retry loop error:', err);
    } finally {
      // check again after 1s
      setTimeout(loop, 1000);
    }
  }
  loop();
}

if (process.argv.includes('worker')) {
  workerLoop(popRealtime);
  workerLoop(popOther);
  retryLoop();
}
