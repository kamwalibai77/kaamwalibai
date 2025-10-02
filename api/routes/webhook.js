import express from "express";
import crypto from "crypto";
import db from "../models/index.js";

const Subscription = db.Subscription;
const User = db.User;
const router = express.Router();

const RAZORPAY_WEBHOOK_SECRET =
  process.env.RAZORPAY_WEBHOOK_SECRET || "your_webhook_secret";

// Use raw body so signature verification is correct
router.post(
  "/razorpay",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const webhookSignature = req.headers["x-razorpay-signature"];
      const body = req.body; // raw Buffer

      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest("hex");

      if (expectedSignature !== webhookSignature) {
        console.warn("[webhook] invalid signature", {
          expectedSignature,
          webhookSignature,
        });
        return res.status(400).send("Invalid signature");
      }

      const parsed = JSON.parse(body.toString());
      const event = parsed.event;
      const payload =
        parsed.payload.payment?.entity || parsed.payload.subscription?.entity;

      if (!payload) {
        return res.status(200).send("No payload to process");
      }

      const paymentId = payload.id;
      const notes = payload.notes || {};
      const planId = notes.plan_id || notes.plan || "basic";

      // FIX: user_id now comes from notes
      const userId = notes.user_id || notes.user || "guest";

      // FIX: amount divided by 100 to save actual UI amount
      const amount = payload.amount ? payload.amount / 100 : 0;
      const currency = payload.currency || "INR";

      // Upsert subscription record by payment_id
      const values = {
        user_id: String(userId),
        plan_id: String(planId),
        payment_id: String(paymentId),
        amount: Number(amount),
        currency: String(currency),
        start_date: new Date(),
      };

      if (event === "payment.captured" || event === "payment_link.paid") {
        values.status = "active";
        values.end_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      } else if (event === "payment.failed") {
        values.status = "failed";
        values.end_date = null;
      }

      // Try update first, otherwise create
      const [record, created] = await Subscription.findOrCreate({
        where: { payment_id: String(paymentId) },
        defaults: values,
      });

      if (!created) {
        // update existing
        await record.update(values);
      }

      // Update user's subscription status if payment is successful
      try {
        const uid = notes.user_id || notes.user || null;
        if (
          (event === "payment.captured" || event === "payment_link.paid") &&
          uid &&
          uid !== "guest"
        ) {
          const user = await User.findByPk(String(uid));
          if (user) {
            user.isSubscribed = true;
            await user.save({ fields: ["isSubscribed"] });
            console.log("[webhook] marked user as subscribed", { userId: uid });
          } else {
            console.warn("[webhook] user not found for subscription webhook", {
              userId: uid,
            });
          }
        }
      } catch (e) {
        console.error(
          "[webhook] failed to update user subscription status:",
          e && e.stack ? e.stack : e
        );
      }

      console.log("[webhook] processed", { event, paymentId, created });
      return res.status(200).send("Webhook processed");
    } catch (error) {
      console.error(
        "Webhook error:",
        error && error.stack ? error.stack : error
      );
      return res.status(500).send("Server error");
    }
  }
);

export default router;
