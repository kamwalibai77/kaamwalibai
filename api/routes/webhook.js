import express from "express";
import crypto from "crypto";
import db from "../models/index.js";

const Subscription = db.Subscription;
const User = db.User;
const router = express.Router();

const RAZORPAY_WEBHOOK_SECRET =
  process.env.RAZORPAY_WEBHOOK_SECRET || "your_webhook_secret";

router.post(
  "/razorpay",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const webhookSignature = req.headers["x-razorpay-signature"];
      const body = req.body; // Buffer
      const bodyString = body.toString("utf8"); // convert to string for signature verification

      const expectedSignature = crypto
        .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
        .update(bodyString)
        .digest("hex");

      if (expectedSignature !== webhookSignature) {
        console.warn("[webhook] invalid signature", {
          expectedSignature,
          webhookSignature,
        });
        return res.status(400).send("Invalid signature");
      }

      const parsed = JSON.parse(bodyString);
      const event = parsed.event;

      // Extract payload
      const payloadCandidates = [
        parsed.payload?.payment?.entity,
        parsed.payload?.payment_link?.entity,
        parsed.payload?.subscription?.entity,
        parsed.payload?.order?.entity,
      ];
      const payload = payloadCandidates.find((p) => p && typeof p === "object");

      if (!payload) {
        console.warn("[webhook] no payload entity found", { event });
        return res.status(200).send("No payload to process");
      }

      const paymentId =
        payload.id || payload.payment_id || payload.reference_id || null;
      const notes =
        payload.notes || parsed.payload?.payment_link?.entity?.notes || {};
      const planId = notes.plan || "basic";
      const userId = notes.user_id || "guest";
      const amount = payload.amount || payload.amount_paid || 0;
      const currency = payload.currency || "INR";

      const values = {
        user_id: String(userId),
        plan_id: String(planId),
        payment_id: String(paymentId),
        amount: Number(amount) / 100, // convert paise to INR
        currency: String(currency),
        start_date: new Date(),
        status:
          event === "payment_link.paid" || event === "payment.captured"
            ? "active"
            : "failed",
        end_date:
          event === "payment_link.paid" || event === "payment.captured"
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            : null,
      };

      const [record, created] = await Subscription.findOrCreate({
        where: { payment_id: String(paymentId) },
        defaults: values,
      });

      if (!created) {
        await record.update(values);
      }

      // Update user subscription
      if (userId !== "guest" && values.status === "active") {
        const user = await User.findByPk(userId);
        if (user) {
          user.isSubscribed = true;
          await user.save({ fields: ["isSubscribed"] });
          console.log("[webhook] user marked as subscribed", { userId });
        }
      }

      console.log("[webhook] processed", { event, paymentId, created });
      return res.status(200).send("Webhook processed");
    } catch (err) {
      console.error("[webhook] error:", err && err.stack ? err.stack : err);
      return res.status(500).send("Server error");
    }
  }
);

export default router;
