import { methodNotAllowed, requireAdmin } from "../../lib/growth-admin.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  const id = String(req.query.id || "");
  if (!id || id.length > 80) {
    return res.status(400).json({ success: false, message: "A valid member ID is required." });
  }

  try {
    const [member, payments, periods] = await Promise.all([
      auth.client.from("growth_memberships").select("*").eq("id", id).maybeSingle(),
      auth.client.from("growth_payments").select("*").eq("membership_id", id).order("created_at", { ascending: false }),
      auth.client.from("growth_membership_periods").select("*").eq("membership_id", id).order("starts_on", { ascending: false })
    ]);
    const failure = [member, payments, periods].find((result) => result.error);
    if (failure) throw failure.error;
    if (!member.data) return res.status(404).json({ success: false, message: "Member not found." });
    return res.status(200).json({
      success: true,
      member: member.data,
      payments: payments.data || [],
      membershipPeriods: periods.data || []
    });
  } catch (error) {
    console.error("Growth admin member detail error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load member details." });
  }
}
