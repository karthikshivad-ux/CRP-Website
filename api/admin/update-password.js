import {
  allowedAdminEmails,
  clearAdminSessionCookies,
  createAdminClient,
  methodNotAllowed
} from "../../lib/growth-admin.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  const { accessToken, refreshToken, password } = req.body || {};
  if (typeof password !== "string" || password.length < 10) {
    return res.status(400).json({ success: false, message: "Use a password with at least 10 characters." });
  }
  if (!accessToken || !refreshToken) {
    return res.status(401).json({ success: false, message: "This reset link is invalid or has expired." });
  }

  try {
    const client = createAdminClient();
    const { data: userData, error: userError } = await client.auth.getUser(accessToken);
    const admins = allowedAdminEmails();
    if (userError || !userData.user || !admins.has(String(userData.user.email || "").toLowerCase())) {
      return res.status(401).json({ success: false, message: "This reset link is invalid or has expired." });
    }
    const { error: sessionError } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    if (sessionError) {
      return res.status(401).json({ success: false, message: "This reset link is invalid or has expired." });
    }
    const { error } = await client.auth.updateUser({ password });
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    clearAdminSessionCookies(res, req);
    return res.status(200).json({ success: true, message: "Password updated. Sign in with your new password." });
  } catch (error) {
    console.error("Growth admin password update error:", error.message);
    return res.status(503).json({ success: false, message: "Password update is not available right now." });
  }
}
