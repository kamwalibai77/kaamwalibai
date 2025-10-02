import express from "express";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import { authMiddleware } from "../middleware/auth.js";
import db from "../models/index.js";
import axios from "axios";

dotenv.config();

const router = express.Router();

// POST /api/payments/validate
// body: { session_token: string } or query ?session_token=...
// Proxies to Razorpay's standard checkout validate endpoint using server credentials
router.post("/validate", async (req, res) => {
  try {
    const session_token = req.body?.session_token || req.query?.session_token;
    if (!session_token)
      return res.status(400).json({ error: "session_token is required" });

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res
        .status(500)
        .json({ error: "Razorpay credentials not configured on server" });
    }

    const url = `https://api.razorpay.com/v1/standard_checkout/payments/validate/account?key_id=${encodeURIComponent(
      process.env.RAZORPAY_KEY_ID
    )}&session_token=${encodeURIComponent(session_token)}`;

    const auth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
    ).toString("base64");

    const rpResp = await axios.post(url, null, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    });

    const respData = rpResp.data || {};

    // Try to persist a subscription record when validation returns a payment/payment_link
    try {
      const models = await import("../models/index.js");
      const Subscription = models.default.Subscription;
      const User = models.default.User;

      // Try multiple payload shapes similar to webhook handler
      const parsed = respData;
      const payloadCandidates = [
        parsed.payload?.payment?.entity,
        parsed.payload?.payment_link?.entity,
        parsed.payload?.subscription?.entity,
        parsed.payload?.order?.entity,
        parsed.payment,
        parsed.payment_link,
      ];
      const payload = payloadCandidates.find((p) => p && typeof p === "object");

      if (payload) {
        const paymentId =
          payload.id || payload.payment_id || payload.reference_id || null;
        const notes =
          payload.notes || parsed.payload?.payment_link?.entity?.notes || {};
        const planId = notes.plan_id || notes.plan || "basic";
        const userId = notes.user_id || notes.user || null;
        const amount = payload.amount || payload.amount_paid || 0;
        const currency = payload.currency || "INR";

        // Only persist when we have some identifier
        if (paymentId) {
          const values = {
            user_id: userId ? String(userId) : String(userId || "guest"),
            plan_id: String(planId),
            payment_id: String(paymentId),
            amount: Number(amount),
            currency: String(currency),
            start_date: new Date(),
            status: "active",
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          };

          const [record, created] = await Subscription.findOrCreate({
            where: { payment_id: String(paymentId) },
            defaults: values,
          });
          if (!created) {
            await record.update(values);
          }

          // Mark user as subscribed if user id present
          if (userId) {
            try {
              const user = await User.findByPk(String(userId));
              if (user) {
                user.isSubscribed = true;
                await user.save({ fields: ["isSubscribed"] });
                console.log("[validate] marked user as subscribed", { userId });
              }
            } catch (e) {
              console.warn("[validate] failed to mark user subscribed", e);
            }
          }
        }
      }
    } catch (e) {
      console.warn(
        "/validate: failed to persist subscription info:",
        e && e.stack ? e.stack : e
      );
    }

    return res.json(respData);
  } catch (err) {
    console.error(
      "/validate error:",
      err && err.response
        ? err.response.data
        : err && err.stack
        ? err.stack
        : err
    );
    const status =
      err && err.response && err.response.status ? err.response.status : 500;
    const data =
      err && err.response && err.response.data
        ? err.response.data
        : { error: "Validation failed" };
    return res.status(status).json(data);
  }
});

// GET /api/payments/me
// Returns the most recent active subscription for the authenticated user
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const Subscription = db.default.Subscription;
    const userId = String(req.user.id);
    const record = await Subscription.findOne({
      where: { user_id: userId },
      order: [["start_date", "DESC"]],
    });
    if (!record) return res.json({ subscription: null });
    return res.json({ subscription: record });
  } catch (err) {
    console.error(
      "/me subscription lookup error:",
      err && err.stack ? err.stack : err
    );
    return res.status(500).json({ error: "Failed to lookup subscription" });
  }
});

// POST /api/payments/create-link
// body: { amount: number, currency?: string, receipt?: string, notes?: object }
router.post("/create-link", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt, notes } = req.body || {};

    console.log("[payments] create-link called with:", {
      amount,
      currency,
      receipt,
      notes,
    });

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("[payments] missing RAZORPAY_KEY_ID/SECRET");
      return res
        .status(500)
        .json({ error: "Razorpay credentials not configured on server" });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // validate amount
    const numeric = Number(amount);
    if (Number.isNaN(numeric) || numeric <= 0) {
      console.warn("[payments] invalid amount provided:", amount);
      return res.status(400).json({ error: "Invalid amount" });
    }

    // amount in paise
    const options = {
      amount: Math.round(numeric * 100),
      currency,
      accept_partial: false,
      reference_id: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
      description: "Maid Service subscription",
    };

    // Create an order first (recommended) and then create a payment link using that order
    const order = await razorpay.orders.create({
      amount: options.amount,
      currency: options.currency,
      receipt: options.reference_id,
      payment_capture: 1,
    });

    // Only pass a callback_url to Razorpay if it's an HTTPS URL.
    // Razorpay rejects plain IPs or non-HTTPS hosts — use ngrok or a public HTTPS URL for callbacks.
    const rawCallback = process.env.RAZORPAY_CALLBACK_URL || "";
    const callbackUrl =
      typeof rawCallback === "string" && rawCallback.startsWith("https://")
        ? rawCallback
        : undefined;
    if (rawCallback && !callbackUrl) {
      console.warn(
        "[payments] RAZORPAY_CALLBACK_URL is set but not a valid HTTPS URL. Ignoring callback_url to avoid Razorpay errors.",
        rawCallback
      );
    }

    const paymentLink = await razorpay.paymentLink.create({
      amount: options.amount,
      currency: options.currency,
      reference_id: options.reference_id,
      description: options.description,
      notes: options.notes,
      notify: {
        sms: false,
        email: false,
      },
      callback_url: callbackUrl,
      callback_method: "get",
    });

    console.log(
      "[payments] created link",
      paymentLink && paymentLink.short_url
    );
    return res.json({ link: paymentLink.short_url, payload: paymentLink });
  } catch (err) {
    console.error(
      "Razorpay create link error:",
      err && err.stack ? err.stack : err
    );
    // Include error message in response for easier debugging (safe in dev).
    return res.status(500).json({
      error: "Failed to create payment link",
      details: err && err.message ? err.message : err,
    });
  }
});

// POST /api/payments/create-link/user
// Authenticated endpoint: creates a payment link and attaches the authenticated user id in notes
router.post("/create-link/user", authMiddleware, async (req, res) => {
  try {
    const { amount, currency = "INR", receipt, notes } = req.body || {};

    console.log("[payments:user] create-link called with:", {
      amount,
      currency,
      receipt,
      notes,
      user: req.user && req.user.id,
    });

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("[payments:user] missing RAZORPAY_KEY_ID/SECRET");
      return res
        .status(500)
        .json({ error: "Razorpay credentials not configured on server" });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // validate amount
    const numeric = Number(amount);
    if (Number.isNaN(numeric) || numeric <= 0) {
      console.warn("[payments:user] invalid amount provided:", amount);
      return res.status(400).json({ error: "Invalid amount" });
    }

    const options = {
      amount: Math.round(numeric * 100),
      currency,
      accept_partial: false,
      reference_id: receipt || `rcpt_${Date.now()}`,
      notes: Object.assign({}, notes || {}, { user_id: String(req.user.id) }),
      description: "Maid Service subscription",
    };

    const order = await razorpay.orders.create({
      amount: options.amount,
      currency: options.currency,
      receipt: options.reference_id,
      payment_capture: 1,
    });

    const rawCallback = process.env.RAZORPAY_CALLBACK_URL || "";
    const callbackUrl =
      typeof rawCallback === "string" && rawCallback.startsWith("https://")
        ? rawCallback
        : undefined;
    if (rawCallback && !callbackUrl) {
      console.warn(
        "[payments:user] RAZORPAY_CALLBACK_URL is set but not a valid HTTPS URL. Ignoring callback_url to avoid Razorpay errors.",
        rawCallback
      );
    }

    const paymentLink = await razorpay.paymentLink.create({
      amount: options.amount,
      currency: options.currency,
      reference_id: options.reference_id,
      description: options.description,
      notes: options.notes,
      notify: { sms: false, email: false },
      callback_url: callbackUrl,
      callback_method: "get",
    });

    console.log(
      "[payments:user] created link",
      paymentLink && paymentLink.short_url
    );
    return res.json({ link: paymentLink.short_url, payload: paymentLink });
  } catch (err) {
    console.error(
      "Razorpay create link (user) error:",
      err && err.stack ? err.stack : err
    );
    return res.status(500).json({
      error: "Failed to create payment link",
      details: err && err.message ? err.message : err,
    });
  }
});

// GET /api/payments/status?payment_id=... or ?reference_id=...
router.get("/status", async (req, res) => {
  try {
    const { payment_id, reference_id } = req.query || {};
    const db = await import("../models/index.js");
    const Subscription = db.default.Subscription;

    if (!payment_id && !reference_id) {
      return res
        .status(400)
        .json({ error: "payment_id or reference_id is required" });
    }

    const where = payment_id
      ? { payment_id: String(payment_id) }
      : { reference_id: String(reference_id) };
    const record = await Subscription.findOne({ where });
    if (!record) return res.status(404).json({ found: false });
    return res.json({ found: true, subscription: record });
  } catch (err) {
    console.error("status lookup error:", err && err.stack ? err.stack : err);
    return res.status(500).json({
      error: "status lookup failed",
      details: err && err.message ? err.message : err,
    });
  }
});

export default router;
