import { methodNotAllowed, requireAdmin } from "../../lib/growth-admin.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  try {
    const { data: payments, error, count } = await auth.client
      .from("growth_payments")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(0, 49);
    if (error) throw error;
    const ids = [...new Set((payments || []).map((payment) => payment.membership_id))];
    let members = [];
    if (ids.length) {
      const result = await auth.client.from("growth_memberships")
        .select("id,name,phone").in("id", ids);
      if (result.error) throw result.error;
      members = result.data || [];
    }
    const membersById = new Map(members.map((member) => [member.id, member]));
    return res.status(200).json({
      success: true,
      total: count || 0,
      payments: (payments || []).map((payment) => ({
        ...payment,
        member: membersById.get(payment.membership_id) || null
      }))
    });
  } catch (error) {
    console.error("Growth admin payments error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load payment history." });
  }
}
