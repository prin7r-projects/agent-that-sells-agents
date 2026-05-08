import { agents } from "@/lib/agents";

const trainingMeta: Record<
  string,
  { corpus: string; modelFamily: string; eval: string }
> = {
  "042": {
    corpus: "1.2M B2B emails (consented), 38k call transcripts",
    modelFamily: "Claude Sonnet · BYO endpoint optional",
    eval: "Weekly held-out reply-rate / blocklist regression",
  },
  "047": {
    corpus: "120k support tickets, 9k macros, 4k escalations",
    modelFamily: "Claude Haiku · GPT 4-class fallback",
    eval: "Daily CSAT, false-resolution sampling 1%",
  },
  "051": {
    corpus: "Curated public sources + 2k buyer briefs",
    modelFamily: "Claude Sonnet + retrieval (hosted)",
    eval: "Citation-resolves rate, peer audit weekly",
  },
  "054": {
    corpus: "1y of internal-tool change events (5 anchor accounts)",
    modelFamily: "Claude Haiku · long-context",
    eval: "Anomaly precision @ 7-day, false-positive trace",
  },
  "058": {
    corpus: "Inbound chat + form transcripts, 60k qualified",
    modelFamily: "Claude Sonnet · streaming",
    eval: "Booking conversion vs. baseline form, weekly",
  },
  "061": {
    corpus: "Public competitor docs, pricing pages, hiring boards",
    modelFamily: "Claude Sonnet + retrieval",
    eval: "Read-through rate + cited-claim audit",
  },
};

export function ProvenanceTable() {
  return (
    <div className="overflow-x-auto rounded-[10px] border border-graphite">
      <table className="w-full text-[14px]">
        <thead className="text-paper/60">
          <tr className="border-b-2 border-graphite">
            <th className="text-left p-4 font-medium">Agent</th>
            <th className="text-left p-4 font-medium">Training corpus</th>
            <th className="text-left p-4 font-medium">Model family</th>
            <th className="text-left p-4 font-medium">Evaluation method</th>
            <th className="text-left p-4 font-medium font-mono text-[12px]">Last audit</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((a) => {
            const meta = trainingMeta[a.lot];
            return (
              <tr key={a.lot} className="border-b border-graphite/60">
                <td className="p-4 align-top">
                  <div className="lot-label text-brass-2">LOT {a.lot}</div>
                  <div className="font-semibold">{a.name}</div>
                  <div className="text-[12px] text-paper/60">{a.role}</div>
                </td>
                <td className="p-4 align-top text-paper/85">{meta?.corpus}</td>
                <td className="p-4 align-top text-paper/85">{meta?.modelFamily}</td>
                <td className="p-4 align-top text-paper/85">{meta?.eval}</td>
                <td className="p-4 align-top font-mono text-[12px] text-paper/85">
                  {a.lastAudit}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
