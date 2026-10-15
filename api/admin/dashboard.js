import { indiaCurrentMonthRange, indiaToday, methodNotAllowed, requireAdmin } from "../../lib/growth-admin.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  try {
    const dateOnly = indiaToday();
    const nextFiveDays = new Date(`${dateOnly}T00:00:00Z`);
    nextFiveDays.setUTCDate(nextFiveDays.getUTCDate() + 5);
    const monthRange = indiaCurrentMonthRange();
    const db = auth.client;

    const [total, active, expiring, revenue, recent] = await Promise.all([
      db.from("growth_memberships").select("id", { count: "exact", head: true }),
      db.from("growth_memberships").select("id", { count: "exact", head: true })
        .eq("membership_status", "active").gte("membership_end_date", dateOnly),
      db.from("growth_memberships").select("id", { count: "exact", head: true })
        .eq("membership_status", "active").gte("membership_end_date", dateOnly)
        .lte("membership_end_date", nextFiveDays.toISOString().slice(0, 10)),
      db.from("growth_payments").select("amount")
        .eq("status", "verified").gte("paid_at", monthRange.start)
        .lt("paid_at", monthRange.end),
      db.from("growth_memberships")
        .select("id,name,business_name,phone,membership_plan,membership_start_date,membership_end_date,membership_status,payment_status,created_at")
        .order("created_at", { ascending: false }).limit(6)
    ]);
    const failed = [total, active, expiring, revenue, recent].find((result) => result.error);
    if (failed) throw failed.error;

    const totalRevenue = (revenue.data || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    return res.status(200).json({
      success: true,
      stats: {
        totalMembers: total.count || 0,
        currentlyValid: active.count || 0,
        expiringNextFiveDays: expiring.count || 0,
        revenueThisMonth: totalRevenue
      },
      recentMembers: recent.data || []
    });
  } catch (error) {
    console.error("Growth admin dashboard error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load dashboard data." });
  }
}
