import { randomUUID } from "node:crypto";
import { methodNotAllowed, requireAdmin } from "../../lib/growth-admin.js";

const plans = { monthly: 300, yearly: 3000 };

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const { name, businessName, place, phone, whatsapp, membershipPlan } = req.body || {};
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanPhone = typeof phone === "string" ? phone.trim() : "";
  const cleanWhatsapp = typeof whatsapp === "string" && whatsapp.trim() ? whatsapp.trim() : cleanPhone;
  const cleanPlan = String(membershipPlan || "");
  if (!cleanName || cleanName.length > 120) return res.status(400).json({ success: false, message: "Enter the member's name (up to 120 characters)." });
  if (!/^\d{10}$/.test(cleanPhone)) return res.status(400).json({ success: false, message: "Phone number must contain exactly 10 digits." });
  if (!/^\d{10}$/.test(cleanWhatsapp)) return res.status(400).json({ success: false, message: "WhatsApp number must contain exactly 10 digits." });
  if (!Object.hasOwn(plans, cleanPlan)) return res.status(400).json({ success: false, message: "Choose a valid membership plan." });

  try {
    const now = new Date().toISOString();
    const { data: member, error: memberError } = await auth.client.from("growth_memberships").insert({
      name: cleanName,
      business_name: typeof businessName === "string" ? businessName.trim().slice(0, 160) || null : null,
      place: typeof place === "string" ? place.trim().slice(0, 160) || null : null,
      phone: cleanPhone,
      whatsapp: cleanWhatsapp,
      membership_plan: cleanPlan,
      membership_status: "pending",
      payment_status: "pending",
      created_at: now
    }).select("id").single();
    if (memberError) throw memberError;

    const paymentReference = `CRPA-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const { error: paymentError } = await auth.client.from("growth_payments").insert({
      membership_id: member.id,
      amount: plans[cleanPlan],
      currency: "INR",
      membership_plan: cleanPlan,
      payment_method: "UPI",
      payment_reference: paymentReference,
      status: "pending"
    });
    if (paymentError) {
      await auth.client.from("growth_memberships").delete().eq("id", member.id);
      throw paymentError;
    }

    return res.status(201).json({ success: true, memberId: member.id, paymentReference });
  } catch (error) {
    console.error("Growth admin add member error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to add the member. Check the details and try again." });
  }
}
