import express from "express";
import crypto from "crypto";
import { Subscription } from "../models/index.js"; // import your Sequelize model

const router = express.Router();

const RAZORPAY_WEBHOOK_SECRET =
  process.env.RAZORPAY_WEBHOOK_SECRET || "your_webhook_secret";

// Razorpay webhook listener
router.post("/razorpay", express.json({ type: "*/*" }), async (req, res) => {
  try {
    const webhookSignature = req.headers["x-razorpay-signature"];
    const body = JSON.stringify(req.body);

    // ✅ Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== webhookSignature) {
      return res.status(400).send("Invalid signature");
    }

    const event = req.body.event;
    const payload =
      req.body.payload.payment?.entity || req.body.payload.subscription?.entity;

    if (!payload) {
      return res.status(200).send("No payload to process");
    }

    if (event === "payment.captured") {
      await Subscription.create({
        user_id: payload.notes?.user_id || "guest", // You can pass user_id in Razorpay notes while creating order
        plan_id: payload.notes?.plan_id || "basic",
        payment_id: payload.id,
        amount: payload.amount,
        currency: payload.currency,
        status: "active",
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // example: 30 days plan
      });
    }

    if (event === "payment.failed") {
      await Subscription.create({
        user_id: payload.notes?.user_id || "guest",
        plan_id: payload.notes?.plan_id || "basic",
        payment_id: payload.id,
        amount: payload.amount,
        currency: payload.currency,
        status: "failed",
        start_date: new Date(),
        end_date: null,
      });
    }

    return res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).send("Server error");
  }
});

export default router;
