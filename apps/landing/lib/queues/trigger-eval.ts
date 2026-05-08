// apps/landing/lib/queues/trigger-eval.ts — One-off eval trigger
// Usage: pnpm -F landing queue:eval:trigger
//
// Starts a temporary worker, enqueues a single eval job, waits for it to
// complete, then exits. Use this for smoke testing and ad-hoc eval runs.

import { Queue, Worker, QueueEvents } from "bullmq";
import { sql } from "./db.js";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const connection = { url: redisUrl };

const QUEUE_NAME = "eval-runner";
const JOB_NAME = "nightly-eval";

async function main() {
  console.log(`[eval-trigger] Starting temporary worker…`);

  // Import the process function dynamically from eval-runner
  const { runEval } = await import("./eval-runner.js");

  // Start a temporary worker
  const worker = new Worker(
    QUEUE_NAME,
    async (_job) => {
      console.log(`[eval-trigger] Worker picked up job ${_job.id}`);
      return runEval();
    },
    { connection, concurrency: 1 }
  );

  // Enqueue the job
  const queue = new Queue(QUEUE_NAME, { connection });
  const queueEvents = new QueueEvents(QUEUE_NAME, { connection });
  const job = await queue.add(JOB_NAME, { source: "manual-trigger" });
  console.log(`[eval-trigger] Enqueued one-off job: ${job.id}`);

  // Wait for completion
  const result = await job.waitUntilFinished(queueEvents, 120_000);
  console.log(`\n[eval-trigger] One-off job completed:`);
  console.log(`  Rows inserted: ${result.rowsInserted}`);
  if (result.errors.length > 0) {
    console.log(`  Errors: ${result.errors.length}`);
    result.errors.forEach((e: string) => console.log(`    - ${e}`));
  }

  // Cleanup
  await queueEvents.close();
  await queue.close();
  await worker.close();
  await sql.end();

  if (result.errors.length > 0) {
    process.exit(1);
  }
  console.log(`\n[eval-trigger] Done.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[eval-trigger] Failed:", err.message);
  process.exit(1);
});
