import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const {
      name,
      businessName,
      place,
      phone,
      whatsapp
    } = req.body || {};

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required."
      });
    }

    if (!place?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Place is required."
      });
    }

    if (!/^\d{10}$/.test(phone || "")) {
      return res.status(400).json({
        success: false,
        message: "Phone number must contain exactly 10 digits."
      });
    }

    if (!/^\d{10}$/.test(whatsapp || "")) {
      return res.status(400).json({
        success: false,
        message: "WhatsApp number must contain exactly 10 digits."
      });
    }

    const { data, error } = await supabase
      .from("growth_memberships")
      .insert({
        name: name.trim(),
        business_name: businessName?.trim() || null,
        place: place.trim(),
        phone,
        whatsapp,
        payment_status: "pending",
        membership_status: "pending"
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to save membership details."
      });
    }

    return res.status(201).json({
      success: true,
      membershipId: data.id
    });
  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong on the server."
    });
  }
}