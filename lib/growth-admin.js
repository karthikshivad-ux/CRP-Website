import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase server credentials are not configured.");
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}

export function allowedAdminEmails() {
  return new Set(
    (process.env.GROWTH_ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function indiaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function indiaCurrentMonthRange() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit"
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const year = Number(values.year);
  const month = Number(values.month);
  const dateAtIndiaMidnight = (date) => `${date.toISOString().slice(0, 10)}T00:00:00+05:30`;
  return {
    start: dateAtIndiaMidnight(new Date(Date.UTC(year, month - 1, 1))),
    end: dateAtIndiaMidnight(new Date(Date.UTC(year, month, 1)))
  };
}

function cookies(req) {
  return Object.fromEntries(
    String(req.headers.cookie || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        return separator < 0
          ? [part, ""]
          : [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
      })
  );
}

function secureCookie(req) {
  return process.env.VERCEL || req.headers["x-forwarded-proto"] === "https" ? "; Secure" : "";
}

export function setAdminSessionCookies(res, req, session) {
  const secure = secureCookie(req);
  res.setHeader("Set-Cookie", [
    `growth_admin_access=${encodeURIComponent(session.access_token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${session.expires_in || 3600}${secure}`,
    `growth_admin_refresh=${encodeURIComponent(session.refresh_token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${secure}`
  ]);
}

export function clearAdminSessionCookies(res, req) {
  const secure = secureCookie(req);
  res.setHeader("Set-Cookie", [
    `growth_admin_access=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`,
    `growth_admin_refresh=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`
  ]);
}

export async function requireAdmin(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const emails = allowedAdminEmails();
  if (emails.size === 0) {
    res.status(503).json({ success: false, message: "Admin access is not configured." });
    return null;
  }

  let sessionCookies;
  try {
    sessionCookies = cookies(req);
  } catch {
    res.status(401).json({ success: false, message: "Please sign in again." });
    return null;
  }

  const client = createAdminClient();
  let accessToken = sessionCookies.growth_admin_access;
  const refreshToken = sessionCookies.growth_admin_refresh;
  if (!accessToken) {
    res.status(401).json({ success: false, message: "Please sign in." });
    return null;
  }

  let { data, error } = await client.auth.getUser(accessToken);
  if (error && refreshToken) {
    const refreshed = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    if (!refreshed.error && refreshed.data.session) {
      setAdminSessionCookies(res, req, refreshed.data.session);
      accessToken = refreshed.data.session.access_token;
      ({ data, error } = await client.auth.getUser(accessToken));
    }
  }

  if (error || !data.user) {
    clearAdminSessionCookies(res, req);
    res.status(401).json({ success: false, message: "Please sign in again." });
    return null;
  }

  if (!emails.has(String(data.user.email || "").toLowerCase())) {
    clearAdminSessionCookies(res, req);
    res.status(403).json({ success: false, message: "This account is not authorized for admin access." });
    return null;
  }

  return { client, user: data.user };
}

export function methodNotAllowed(res, methods) {
  res.setHeader("Allow", methods.join(", "));
  return res.status(405).json({ success: false, message: "Method not allowed." });
}
