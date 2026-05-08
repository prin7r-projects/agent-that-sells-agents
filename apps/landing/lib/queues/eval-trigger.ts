import { evalQueue } from "./eval-runner.js";

async function main() {
  const job = await evalQueue.add(
    "manual-eval",
    {},
    {
      jobId: `manual-${Date.now()}`,
      removeOnComplete: true,
    },
  );
  console.log(`[eval-trigger] Enqueued job ${job.id}`);
  await evalQueue.close();
}

main().catch((err) => {
  console.error("[eval-trigger] Failed:", err.message);
  process.exit(1);
});
