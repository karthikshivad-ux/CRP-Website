import { indiaToday, methodNotAllowed, requireAdmin } from "../../../lib/growth-admin.js";

const columns = "id,member_code,name,business_name,place,phone,whatsapp,membership_plan,membership_start_date,membership_end_date,membership_status,payment_status,created_at";

function dayAfterFiveDays(today) {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 5);
  return date.toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const status = String(req.query.status || "");
  if (!["active", "expiring", "expired"].includes(status)) {
    return res.status(400).json({ success: false, message: "Choose active, expiring, or expired members to export." });
  }

  try {
    const today = indiaToday();
    const through = dayAfterFiveDays(today);
    const members = [];
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      let query = auth.client.from("growth_memberships").select(columns);
      if (status === "active") {
        query = query.eq("membership_status", "active").gt("membership_end_date", through);
      } else if (status === "expiring") {
        query = query.eq("membership_status", "active").gte("membership_end_date", today).lte("membership_end_date", through);
      } else {
        query = query.or(`membership_status.eq.expired,and(membership_status.eq.active,membership_end_date.lt.${today})`);
      }
      const { data, error } = await query.order("membership_end_date", { ascending: true }).range(from, from + pageSize - 1);
      if (error) throw error;
      members.push(...(data || []));
      if (!data || data.length < pageSize) break;
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ success: true, status, generatedAt: new Date().toISOString(), members });
  } catch (error) {
    console.error("Growth admin member export error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to prepare the member export." });
  }
}
