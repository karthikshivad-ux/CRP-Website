import {
  allowedAdminEmails,
  createAdminClient,
  methodNotAllowed
} from "../../lib/growth-admin.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  const email = String(req.body?.email || "").trim().toLowerCase();
  const admins = allowedAdminEmails();
  if (admins.size === 0) {
    return res.status(503).json({ success: false, message: "Admin access is not configured." });
  }
  if (admins.has(email)) {
    try {
      const client = createAdminClient();
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${(process.env.PUBLIC_SITE_URL || "https://crp-website-chi.vercel.app").replace(/\/$/, "")}/growth-admin?recovery=1`
      });
      if (error) console.error("Growth admin password reset error:", error.message);
    } catch (error) {
      console.error("Growth admin password reset error:", error.message);
      return res.status(503).json({ success: false, message: "Password reset is not available right now." });
    }
  }
  return res.status(200).json({
    success: true,
    message: "If this email is authorized, a password reset link will be sent."
  });
}
