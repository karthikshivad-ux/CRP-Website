import { randomUUID } from "node:crypto";
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
      whatsapp,
      membershipPlan,
      membershipAmount
    } = req.body || {};
    const plans = {
      monthly: { amount: 300 },
      yearly: { amount: 3000 }
    };
    const selectedPlan = plans[membershipPlan];

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

    if (!selectedPlan || Number(membershipAmount) !== selectedPlan.amount) {
      return res.status(400).json({
        success: false,
        message: "Choose a valid GROWTH membership plan."
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
        membership_plan: membershipPlan,
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

    const paymentReference = `CRPG-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const { error: paymentError } = await supabase.from("growth_payments").insert({
      membership_id: data.id,
      amount: selectedPlan.amount,
      currency: "INR",
      membership_plan: membershipPlan,
      payment_method: "UPI",
      payment_reference: paymentReference,
      status: "pending"
    });
    if (paymentError) {
      await supabase.from("growth_memberships").delete().eq("id", data.id);
      console.error("Supabase payment record error:", paymentError.message);
      return res.status(500).json({
        success: false,
        message: "Unable to create a payment record. Please contact CRP before retrying."
      });
    }

    return res.status(201).json({
      success: true,
      membershipId: data.id,
      paymentReference
    });
  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong on the server."
    });
  }
}
