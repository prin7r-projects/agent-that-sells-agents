// apps/landing/lib/queues/trigger-digest.ts — One-off digest trigger
// Usage: pnpm -F landing queue:digest:trigger
//
// Starts a temporary worker, enqueues a single digest job, waits for it to
// complete, then exits. Use this for smoke testing and ad-hoc digest runs.

import { Queue, Worker, QueueEvents } from "bullmq";
import { sql } from "./db.js";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const connection = { url: redisUrl };

const QUEUE_NAME = "digest";
const JOB_NAME = "send-digest";

async function main() {
  console.log(`[digest-trigger] Starting temporary worker…`);

  // Import the process function dynamically from digest-runner
  const { runDigest } = await import("./digest-runner.js");

  // Start a temporary worker
  const worker = new Worker(
    QUEUE_NAME,
    async (_job) => {
      console.log(`[digest-trigger] Worker picked up job ${_job.id}`);
      return runDigest();
    },
    { connection, concurrency: 1 }
  );

  // Enqueue the job
  const queue = new Queue(QUEUE_NAME, { connection });
  const queueEvents = new QueueEvents(QUEUE_NAME, { connection });
  const job = await queue.add(JOB_NAME, { source: "manual-trigger" });
  console.log(`[digest-trigger] Enqueued one-off job: ${job.id}`);

  // Wait for completion
  const result = await job.waitUntilFinished(queueEvents, 120_000);
  console.log(`\n[digest-trigger] One-off job completed:`);
  console.log(`  Sent: ${result.sent}`);
  console.log(`  Failed: ${result.failed}`);
  console.log(`  Total licenses: ${result.total}`);
  if (result.errors.length > 0) {
    console.log(`  Errors: ${result.errors.length}`);
    result.errors.forEach((e: string) => console.log(`    - ${e}`));
  }

  // Cleanup
  await queueEvents.close();
  await queue.close();
  await worker.close();
  await sql.end();

  if (result.errors.length > 0 && result.sent === 0) {
    process.exit(1);
  }
  console.log(`\n[digest-trigger] Done.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[digest-trigger] Failed:", err.message);
  process.exit(1);
});
