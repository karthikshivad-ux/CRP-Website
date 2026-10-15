import { clearAdminSessionCookies, methodNotAllowed } from "../../lib/growth-admin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  clearAdminSessionCookies(res, req);
  return res.status(200).json({ success: true });
}
