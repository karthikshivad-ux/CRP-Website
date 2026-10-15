import { methodNotAllowed, requireAdmin } from "../../lib/growth-admin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const { paymentId, action, transactionReference, paidAt, receiptUrl } = req.body || {};
  if (!paymentId) return res.status(400).json({ success: false, message: "Payment ID is required." });
  if (action === "failed") {
    const { data, error } = await auth.client.from("growth_payments")
      .update({ status: "failed" }).eq("id", paymentId).eq("status", "pending")
      .select("id").maybeSingle();
    if (error) {
      console.error("Growth payment status update error:", error.message);
      return res.status(500).json({ success: false, message: "Unable to update payment status." });
    }
    if (!data) return res.status(409).json({ success: false, message: "Only pending payments can be marked failed." });
    return res.status(200).json({ success: true });
  }
  if (action !== "verify") return res.status(400).json({ success: false, message: "Choose verify or failed." });
  if (typeof transactionReference !== "string" || !transactionReference.trim()) {
    return res.status(400).json({ success: false, message: "Enter the verified transaction reference." });
  }
  if (receiptUrl && !/^https:\/\//i.test(receiptUrl)) {
    return res.status(400).json({ success: false, message: "Receipt links must use HTTPS." });
  }

  const { data, error } = await auth.client.rpc("growth_admin_verify_payment", {
    p_payment_id: paymentId,
    p_transaction_reference: transactionReference.trim(),
    p_paid_at: paidAt ? `${paidAt}T12:00:00+05:30` : null,
    p_receipt_url: receiptUrl || null
  });
  if (error) {
    console.error("Growth payment verification error:", error.message);
    return res.status(409).json({ success: false, message: error.message || "Unable to verify payment." });
  }
  return res.status(200).json({ success: true, period: data });
}
