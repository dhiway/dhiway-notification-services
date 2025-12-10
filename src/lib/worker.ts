import { popRealtime, popOther } from './queue';
import { providers } from './providers/index';
import { providerConfig } from './config';
/* import { rateLimit } from './rate_limit'; */
import { fork } from 'child_process';
import { Job } from 'src/types';
import path from 'path';

async function processJob(job: Job) {
  const provider = providers[job.channel];
  const { rate, burst } = providerConfig[job.channel];
  console.log('provider:', provider, rate, burst);
  // Rate limit
  /* const allowed = await rateLimit(job.channel, rate, burst);
  if (!allowed) {
    console.log('Rate limited, requeue:', job.channel);
    return;
  } */
  console.log('body: ', { ...job.variables, to: job.to });
  const res = await provider.send({ ...job.variables, to: job.to });

  if (!res.ok) {
    console.log('Failed → retrying (simple):', job.job_id);
    await popOther();
  } else {
    console.log('Delivered:', job.job_id);
  }
}

async function workerLoop(popFn: any) {
  while (true) {
    console.log('waiting for job...');
    try {
      const res = await popFn();
      console.log('brpop returned:', res);
      if (!res) continue;

      const rawJob = res[1];
      const job = JSON.parse(rawJob);
      await processJob(job);
    } catch (err) {
      console.error('BRPOP ERROR:', err);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

export function spawnWorker() {
  const workerPath = path.join(__dirname, 'worker.js');

  const child = fork(workerPath, ['worker'], {
    env: {
      ...process.env, // VERY IMPORTANT
      WORKER_PROCESS: 'true',
    },
  });

  console.log('Spawned worker', child.pid);
}

// If started as worker:
if (process.argv.includes('worker')) {
  console.log('process: ', process.argv);
  console.log('Worker started:', process.pid);
  workerLoop(popRealtime);
  workerLoop(popOther);
}
