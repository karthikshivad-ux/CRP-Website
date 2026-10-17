import { randomUUID } from "node:crypto";
import { indiaToday, methodNotAllowed, requireAdmin } from "../../lib/growth-admin.js";

const columns = "id,member_code,name,business_name,place,phone,whatsapp,membership_plan,membership_start_date,membership_end_date,membership_status,payment_status,created_at";
const plans = { monthly: 300, yearly: 3000 };

function dayAfterFiveDays(today) {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 5);
  return date.toISOString().slice(0, 10);
}

async function addMember(req, res, client) {
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
    const { data: member, error: memberError } = await client.from("growth_memberships").insert({
      name: cleanName,
      business_name: typeof businessName === "string" ? businessName.trim().slice(0, 160) || null : null,
      place: typeof place === "string" ? place.trim().slice(0, 160) || null : null,
      phone: cleanPhone,
      whatsapp: cleanWhatsapp,
      membership_plan: cleanPlan,
      membership_status: "pending",
      payment_status: "pending",
      created_at: new Date().toISOString()
    }).select("id").single();
    if (memberError) throw memberError;

    const paymentReference = `CRPA-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const { error: paymentError } = await client.from("growth_payments").insert({
      membership_id: member.id,
      amount: plans[cleanPlan],
      currency: "INR",
      membership_plan: cleanPlan,
      payment_method: "UPI",
      payment_reference: paymentReference,
      status: "pending"
    });
    if (paymentError) {
      await client.from("growth_memberships").delete().eq("id", member.id);
      throw paymentError;
    }

    return res.status(201).json({ success: true, memberId: member.id, paymentReference });
  } catch (error) {
    console.error("Growth admin add member error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to add the member. Check the details and try again." });
  }
}

async function exportMembers(req, res, client) {
  const status = String(req.query.status || "");
  if (!["active", "expiring", "expired"].includes(status)) {
    return res.status(400).json({ success: false, message: "Choose active, expiring, or expired members to export." });
  }

  try {
    const today = indiaToday();
    const through = dayAfterFiveDays(today);
    const members = [];
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      let query = client.from("growth_memberships").select(columns);
      if (status === "active") {
        query = query.eq("membership_status", "active").gt("membership_end_date", through);
      } else if (status === "expiring") {
        query = query.eq("membership_status", "active").gte("membership_end_date", today).lte("membership_end_date", through);
      } else {
        query = query.or(`membership_status.eq.expired,and(membership_status.eq.active,membership_end_date.lt.${today})`);
      }
      const { data, error } = await query.order("membership_end_date", { ascending: true }).range(from, from + pageSize - 1);
      if (error) throw error;
      members.push(...(data || []));
      if (!data || data.length < pageSize) break;
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ success: true, status, generatedAt: new Date().toISOString(), members });
  } catch (error) {
    console.error("Growth admin member export error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to prepare the member export." });
  }
}

export default async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) return methodNotAllowed(res, ["GET", "POST"]);
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  if (req.method === "POST") return addMember(req, res, auth.client);
  if (req.query.export === "pdf") return exportMembers(req, res, auth.client);

  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const term = String(req.query.search || "").trim().replace(/[%_,()]/g, "").slice(0, 80);
    let query = auth.client.from("growth_memberships").select(columns, { count: "exact" });

    if (/^[0-9a-f-]{36}$/i.test(term)) {
      query = query.eq("id", term);
    } else if (term) {
      query = query.or(`name.ilike.%${term}%,member_code.ilike.%${term}%,business_name.ilike.%${term}%,phone.ilike.%${term}%`);
    }
    if (req.query.status === "active") {
      const today = indiaToday();
      const through = new Date(`${today}T00:00:00Z`);
      through.setUTCDate(through.getUTCDate() + 5);
      query = query.eq("membership_status", "active")
        .gt("membership_end_date", through.toISOString().slice(0, 10));
    } else if (req.query.status === "expiring") {
      const today = indiaToday();
      const through = new Date(`${today}T00:00:00Z`);
      through.setUTCDate(through.getUTCDate() + 5);
      query = query.eq("membership_status", "active")
        .gte("membership_end_date", today)
        .lte("membership_end_date", through.toISOString().slice(0, 10));
    } else if (req.query.status === "expired") {
      const today = indiaToday();
      query = query.or(`membership_status.eq.expired,and(membership_status.eq.active,membership_end_date.lt.${today})`);
    } else if (req.query.status === "pending") {
      query = query.eq("membership_status", req.query.status);
    }
    if (["monthly", "yearly"].includes(req.query.plan)) {
      query = query.eq("membership_plan", req.query.plan);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw error;
    return res.status(200).json({ success: true, members: data || [], total: count || 0, page, pageSize: limit });
  } catch (error) {
    console.error("Growth admin members error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load members." });
  }
}
