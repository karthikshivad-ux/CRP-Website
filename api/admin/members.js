import { indiaToday, methodNotAllowed, requireAdmin } from "../../lib/growth-admin.js";

const columns = "id,member_code,name,business_name,place,phone,whatsapp,membership_plan,membership_start_date,membership_end_date,membership_status,payment_status,created_at";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const term = String(req.query.search || "").trim().replace(/[%_,()]/g, "").slice(0, 80);
    let query = auth.client.from("growth_memberships").select(columns, { count: "exact" });

    if (/^[0-9a-f-]{36}$/i.test(term)) {
      query = query.eq("id", term);
    } else if (term) {
      query = query.or(`name.ilike.%${term}%,member_code.ilike.%${term}%,business_name.ilike.%${term}%,phone.ilike.%${term}%`);
    }
    if (req.query.status === "active") {
      const today = indiaToday();
      const through = new Date(`${today}T00:00:00Z`);
      through.setUTCDate(through.getUTCDate() + 5);
      query = query.eq("membership_status", "active")
        .gt("membership_end_date", through.toISOString().slice(0, 10));
    } else if (req.query.status === "expiring") {
      const today = indiaToday();
      const through = new Date(`${today}T00:00:00Z`);
      through.setUTCDate(through.getUTCDate() + 5);
      query = query.eq("membership_status", "active")
        .gte("membership_end_date", today)
        .lte("membership_end_date", through.toISOString().slice(0, 10));
    } else if (req.query.status === "expired") {
      const today = indiaToday();
      query = query.or(`membership_status.eq.expired,and(membership_status.eq.active,membership_end_date.lt.${today})`);
    } else if (req.query.status === "pending") {
      query = query.eq("membership_status", req.query.status);
    }
    if (["monthly", "yearly"].includes(req.query.plan)) {
      query = query.eq("membership_plan", req.query.plan);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw error;
    return res.status(200).json({ success: true, members: data || [], total: count || 0, page, pageSize: limit });
  } catch (error) {
    console.error("Growth admin members error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load members." });
  }
}
