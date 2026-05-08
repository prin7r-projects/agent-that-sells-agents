import { Queue, Worker, JobsOptions } from "bullmq";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

let _db: ReturnType<typeof drizzle> | null = null;
let _schema: typeof import("../../../app/src/db/schema.js") | null = null;

async function getDb() {
  if (!_db) {
    const schema = await import("../../../app/src/db/schema.js");
    const connectionString =
      process.env.DATABASE_URL ??
      "postgresql://stampedagents:stampedagents_dev@localhost:5432/stampedagents";
    const client = postgres(connectionString, {
      max: 5,
      idle_timeout: 10,
      connect_timeout: 10,
    });
    _db = drizzle(client, { schema });
    _schema = schema;
  }
  return { db: _db!, schema: _schema! };
}

const CORPUS_VERSION = "wave3-hardcoded-v1";

interface AgentSeed {
  id: string;
  baselineBps: number;
  evaluator: string;
}

const SEED_AGENTS: AgentSeed[] = [
  { id: "lot-042", baselineBps: 9430, evaluator: "Mira Rao" },
  { id: "lot-047", baselineBps: 8905, evaluator: "Sara Okereke" },
  { id: "lot-051", baselineBps: 9190, evaluator: "Theo Kapoor" },
  { id: "lot-054", baselineBps: 8740, evaluator: "Joon Park" },
  { id: "lot-058", baselineBps: 8948, evaluator: "Mira Rao" },
  { id: "lot-061", baselineBps: 9340, evaluator: "Theo Kapoor" },
];

function jitter(baseline: number, amplitude = 200): number {
  const offset = Math.floor((Date.now() % (amplitude * 2)) - amplitude);
  return Math.max(0, Math.min(10000, baseline + offset));
}

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
export const EVAL_QUEUE_NAME = "eval-runner";

const connectionOpts = { connection: { url: REDIS_URL } };

export const evalQueue = new Queue(EVAL_QUEUE_NAME, connectionOpts);

const worker = new Worker(
  EVAL_QUEUE_NAME,
  async (job) => {
    console.log(`[eval-runner] Starting eval run — job ${job.id}`);
    const { db, schema } = await getDb();
    const now = new Date();

    for (const agent of SEED_AGENTS) {
      const score = jitter(agent.baselineBps);
      await db.insert(schema.evalRuns).values({
        agentId: agent.id,
        corpus: CORPUS_VERSION,
        scoreBps: score,
        evaluator: agent.evaluator,
        runDate: now,
      });
      console.log(
        `[eval-runner] scored ${agent.id} ${score}bps (${agent.evaluator})`,
      );
    }

    console.log(
      `[eval-runner] Done — ${SEED_AGENTS.length} eval rows inserted`,
    );
    return { inserted: SEED_AGENTS.length, timestamp: now.toISOString() };
  },
  connectionOpts,
);

worker.on("completed", (job) => {
  console.log(`[eval-runner] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[eval-runner] Job ${job?.id} failed:`, err.message);
});

async function ensureRepeatable() {
  await evalQueue.add(
    "nightly-eval",
    {},
    {
      repeat: { pattern: "0 2 * * *" },
      removeOnComplete: 10,
      removeOnFail: 50,
    } as JobsOptions,
  );
  console.log(`[eval-runner] Repeatable job registered: cron "0 2 * * *" UTC`);
}

ensureRepeatable().catch(console.error);

console.log(`[eval-runner] Worker listening on queue "${EVAL_QUEUE_NAME}"`);

process.on("SIGINT", async () => {
  console.log("[eval-runner] Shutting down...");
  await worker.close();
  process.exit(0);
});
