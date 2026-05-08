// apps/landing/lib/queues/trigger-eval.ts — One-off eval trigger
// Usage: pnpm -F landing queue:eval:trigger
//
// Enqueues a single eval job and waits for it to complete.
// Prints the result and exits.

import { triggerOneOff } from "./eval-runner";

triggerOneOff()
  .then((result) => {
    console.log("\n[eval-trigger] Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("[eval-trigger] Failed:", err);
    process.exit(1);
  });
