import { methodNotAllowed, requireAdmin } from "../../lib/growth-admin.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  return res.status(200).json({ success: true, admin: { email: auth.user.email } });
}
