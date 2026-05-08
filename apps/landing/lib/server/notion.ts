// Notion sync service — Phase 3 (docs/13 Phase 3 Task 5)
// Syncs paid orders to a Notion data source.

const NOTION_TOKEN = process.env.NOTION_TOKEN?.trim();
const NOTION_ORDERS_DSID = process.env.NOTION_ORDERS_DSID?.trim();
const NOTION_API_VERSION = "2025-09-03";

interface NotionOrderRow {
  orderId: string;
  customerEmail: string;
  agentId: string;
  tier: string;
  priceAmountUsd: number;
  referralCode?: string;
  paidAt: string;
}

/**
 * Append a row to the Notion "StampedAgents Orders" data source.
 * Uses Notion API version 2025-09-03 per docs/13.
 */
export async function syncOrderToNotion(order: NotionOrderRow): Promise<{ ok: boolean; error?: string }> {
  if (!NOTION_TOKEN) {
    console.warn("[NOTION] NOTION_TOKEN not configured — skipping sync");
    return { ok: false, error: "Not configured" };
  }

  if (!NOTION_ORDERS_DSID) {
    console.warn("[NOTION] NOTION_ORDERS_DSID not configured — skipping sync");
    return { ok: false, error: "Data source ID not configured" };
  }

  try {
    // Create a page in the Notion database
    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": NOTION_API_VERSION,
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_ORDERS_DSID },
        properties: {
          "Order ID": {
            title: [{ text: { content: order.orderId } }],
          },
          "Customer Email": {
            rich_text: [{ text: { content: order.customerEmail } }],
          },
          "Agent": {
            rich_text: [{ text: { content: order.agentId } }],
          },
          "Tier": {
            select: { name: order.tier },
          },
          "Amount (USD)": {
            number: order.priceAmountUsd,
          },
          "Referral Code": {
            rich_text: [{ text: { content: order.referralCode ?? "—" } }],
          },
          "Paid At": {
            date: { start: order.paidAt },
          },
        },
      }),
    });

    if (response.ok) {
      const data = await response.json() as { id: string };
      console.log(`[NOTION] Synced order=${order.orderId} pageId=${data.id}`);
      return { ok: true };
    }

    const error = await response.text();
    console.error(`[NOTION] Failed to sync order=${order.orderId}: ${response.status} ${error}`);
    return { ok: false, error: `${response.status}: ${error}` };
  } catch (err) {
    console.error("[NOTION] Request failed:", err);
    return { ok: false, error: String(err) };
  }
}
