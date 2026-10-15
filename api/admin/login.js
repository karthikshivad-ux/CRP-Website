import {
  allowedAdminEmails,
  createAdminClient,
  methodNotAllowed,
  setAdminSessionCookies
} from "../../lib/growth-admin.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const admins = allowedAdminEmails();
  if (!admins.has(normalizedEmail)) {
    return res.status(401).json({ success: false, message: "Email or password is incorrect." });
  }
  if (typeof password !== "string" || !password) {
    return res.status(400).json({ success: false, message: "Enter your password." });
  }

  try {
    const client = createAdminClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });
    if (error || !data.session || !data.user) {
      return res.status(401).json({ success: false, message: "Email or password is incorrect." });
    }
    if (!admins.has(String(data.user.email || "").toLowerCase())) {
      await client.auth.signOut({ scope: "local" });
      return res.status(403).json({ success: false, message: "This account is not authorized for admin access." });
    }
    setAdminSessionCookies(res, req, data.session);
    return res.status(200).json({ success: true, admin: { email: data.user.email } });
  } catch (error) {
    console.error("Growth admin login error:", error.message);
    return res.status(503).json({ success: false, message: "Admin sign-in is not available right now." });
  }
}
