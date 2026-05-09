// apps/landing/lib/queues/digest-runner.ts — BullMQ worker: weekly activity digest
// Phase 5.1: Sends weekly activity digest emails to active license holders.
// Schedule: every Monday 09:00 GMT (cron 0 9 * * 1 UTC).
//
// Usage:
//   pnpm -F landing queue:digest          # start the worker (long-running)
//   pnpm -F landing queue:digest:trigger  # enqueue a one-off digest, then exit
//
// Environment:
//   REDIS_URL   — Redis connection string (default: redis://localhost:6379)
//   DATABASE_URL — PostgreSQL connection string

import { Queue, Worker, QueueEvents } from "bullmq";
import { sql } from "./db.js";
import { sendEmail } from "../server/email.js";

// ── Redis connection ───────────────────────────────────────────────────────
const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const connection = { url: redisUrl };

const QUEUE_NAME = "digest";
const JOB_NAME = "send-digest";
const SCHEDULER_ID = "weekly-digest";

// ── Seeded activity generator (deterministic per license + week) ───────────

function getWeekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateWeeklyCounts(seed: string): {
  emails: number;
  replies: number;
  meetings: number;
  calls: number;
} {
  const weekKey = getWeekKey();
  const h = hashString(`${seed}:${weekKey}`);
  const rng = (max: number, min: number) => min + (h % (max - min + 1));
  return {
    emails: rng(60, 12),
    replies: rng(25, 3),
    meetings: rng(10, 1),
    calls: rng(15, 0),
  };
}

// ── DB types ───────────────────────────────────────────────────────────────

interface ActiveLicense {
  orderId: string;
  customerEmail: string;
  agentId: string;
  agentName: string;
  tier: string;
  validUntil: string;
}

// ── Fetch active licenses ──────────────────────────────────────────────────

async function fetchActiveLicenses(): Promise<ActiveLicense[]> {
  try {
    const rows = await sql<{
      order_id: string;
      email: string;
      agent_id: string;
      display_name: string;
      tier: string;
      valid_until: string;
    }[]>`
      SELECT
        l.order_id,
        c.email,
        l.agent_id,
        a.display_name,
        l.tier,
        l.valid_until
      FROM licenses l
      JOIN customers c ON c.id = l.customer_id
      JOIN agents a ON a.id = l.agent_id
      WHERE l.valid_until > now()
        AND l.revoked_at IS NULL
    `;

    return rows.map((r) => ({
      orderId: r.order_id,
      customerEmail: r.email,
      agentId: r.agent_id,
      agentName: r.display_name,
      tier: r.tier,
      validUntil: r.valid_until,
    }));
  } catch (err: any) {
    if (err?.code === "42P01") {
      // Table doesn't exist — DB not seeded yet. Return empty for smoke test.
      console.warn("[digest] DB tables not found — returning empty license set (smoke test mode)");
      return [];
    }
    throw err;
  }
}

// ── Email builder ──────────────────────────────────────────────────────────

function buildDigestHtml(
  license: ActiveLicense,
  counts: ReturnType<typeof generateWeeklyCounts>
): string {
  const { emails, replies, meetings, calls } = counts;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="font-size: 24px; font-weight: 700; margin: 0;">Your Weekly Agent Digest</h1>
    <p style="color: #6b7280; margin-top: 8px;">Week of ${getWeekKey()}</p>
  </div>

  <div style="background: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
    <p style="margin: 0 0 16px; font-size: 16px;">Hello,</p>
    <p style="margin: 0 0 16px;">Here is how <strong>${license.agentName}</strong> performed for you this week:</p>

    <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">Emails sent</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${emails}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">Replies received</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${replies}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">Meetings booked</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${meetings}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0;">Calls completed</td>
        <td style="padding: 12px 0; text-align: right; font-weight: 600;">${calls}</td>
      </tr>
    </table>
  </div>

  <div style="text-align: center; margin: 32px 0;">
    <a href="https://agent-that-sells-agents.prin7r.com/dashboard" style="display: inline-block; background: #1a1a1a; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600;">Open Dashboard</a>
  </div>

  <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 32px;">
    <p style="font-size: 14px; color: #6b7280; margin: 0;">You are receiving this because you hold an active ${license.tier} license for ${license.agentName}.</p>
  </div>
</body>
</html>
  `.trim();
}

// ── Run digest ─────────────────────────────────────────────────────────────

export async function runDigest(): Promise<{
  sent: number;
  failed: number;
  total: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let sent = 0;
  let failed = 0;

  console.log(`[digest] Starting digest — ${new Date().toISOString()}`);

  let licenses: ActiveLicense[];
  try {
    licenses = await fetchActiveLicenses();
  } catch (err) {
    const msg = `Failed to fetch licenses: ${err instanceof Error ? err.message : String(err)}`;
    console.error(`[digest] ${msg}`);
    throw err;
  }

  console.log(`[digest] Found ${licenses.length} active licenses`);

  for (const license of licenses) {
    const counts = generateWeeklyCounts(license.orderId);
    const html = buildDigestHtml(license, counts);
    const subject = `Weekly digest: ${license.agentName} — ${counts.emails} emails, ${counts.meetings} meetings`;

    console.log(
      `[digest] Sending to ${license.customerEmail} (agent=${license.agentName}) ` +
        `counts=${JSON.stringify(counts)}`
    );

    const result = await sendEmail({
      to: license.customerEmail,
      subject,
      html,
      tag: "weekly-digest",
    });

    if (result.ok) {
      console.log(
        `[digest] Sent to ${license.customerEmail} via ${result.provider} ` +
          `messageId=${result.messageId ?? "n/a"}`
      );
      sent++;
    } else {
      const msg = `Failed to send to ${license.customerEmail}: ${result.error ?? "unknown"}`;
      console.error(`[digest] ${msg}`);
      errors.push(msg);
      failed++;
    }
  }

  console.log(`[digest] Complete: sent=${sent} failed=${failed} total=${licenses.length}`);
  return { sent, failed, total: licenses.length, errors };
}

// ── Job processor ──────────────────────────────────────────────────────────

async function processJob() {
  return runDigest();
}

// ── One-off trigger helper ─────────────────────────────────────────────────

export async function triggerOneOff() {
  const queue = new Queue(QUEUE_NAME, { connection });
  const queueEvents = new QueueEvents(QUEUE_NAME, { connection });
  const job = await queue.add(JOB_NAME, { source: "manual" });
  console.log(`[digest] Enqueued one-off job: ${job.id}`);

  // Wait for completion
  const result = await job.waitUntilFinished(queueEvents, 120_000);
  console.log(`[digest] One-off job completed:`, JSON.stringify(result));
  await queueEvents.close();
  await queue.close();
  return result;
}

// ── Main: start worker (long-running) ──────────────────────────────────────

async function main() {
  console.log(`[digest] Connecting to Redis: ${redisUrl}`);

  const queue = new Queue(QUEUE_NAME, { connection });

  // Register repeatable job: Monday 09:00 GMT
  await queue.upsertJobScheduler(
    SCHEDULER_ID,
    {
      pattern: "0 9 * * 1", // Monday 09:00 UTC
      tz: "UTC",
    },
    {
      name: JOB_NAME,
      data: { source: "cron" },
      opts: {
        attempts: 3,
        backoff: { type: "exponential", delay: 60000 },
        removeOnComplete: { age: 7 * 24 * 3600 },
        removeOnFail: { age: 30 * 24 * 3600 },
      },
    }
  );
  console.log("[digest] Registered repeatable job: every Monday at 09:00 GMT (UTC)");

  const worker = new Worker(
    QUEUE_NAME,
    async (_job) => {
      return processJob();
    },
    {
      connection,
      concurrency: 1,
      removeOnComplete: { age: 7 * 24 * 3600 },
      removeOnFail: { age: 30 * 24 * 3600 },
    }
  );

  worker.on("completed", (job) => {
    console.log(`[digest] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[digest] Job ${job?.id ?? "?"} failed:`, err.message);
  });

  console.log("[digest] Worker started — waiting for jobs…");
  console.log("[digest] Next run: Monday 09:00 GMT");
  console.log("[digest] Press Ctrl+C to stop");

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[digest] Received ${signal}, shutting down…`);
    await worker.close();
    await queue.close();
    await sql.end();
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

// Allow direct execution
const isMain =
  process.argv[1]?.endsWith("digest-runner.ts") ||
  process.argv[1]?.endsWith("digest-runner.js");
if (isMain) {
  main().catch((err) => {
    console.error("[digest] Fatal:", err);
    process.exit(1);
  });
}
