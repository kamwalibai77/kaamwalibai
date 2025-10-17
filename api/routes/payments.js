import axios from "axios";
import dotenv from "dotenv";
import express from "express";
import Razorpay from "razorpay";
import { authMiddleware } from "../middleware/auth.js";
import db from "../models/index.js";

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

    // Best-effort: persist subscription info when validate returns a payload
    try {
      const models = await import("../models/index.js");
      const Subscription = models.default.Subscription;
      const User = models.default.User;

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
          payload.payment_id || payload.id || payload.reference_id || null;
        const notes =
          payload.notes || parsed.payload?.payment_link?.entity?.notes || {};
        const planId = notes.plan_id || notes.plan || "basic";
        const userId = notes.user_id || notes.user || null;
        const amount = Number(payload.amount || payload.amount_paid || 0) || 0;
        const currency = payload.currency || "INR";

        if (!paymentId) {
          console.warn(
            "/validate: no identifier found in payload, skipping persist",
            { payload }
          );
        } else {
          // Derive numberOfContacts from Plan if available (robust lookup)
          let numberOfContacts = null;
          try {
            const Plan = models.default.Plan;
            let planRecord = null;
            if (planId) {
              const maybeNum = Number(planId);
              if (!Number.isNaN(maybeNum))
                planRecord = await Plan.findByPk(maybeNum);
              if (!planRecord)
                planRecord = await Plan.findOne({ where: { id: planId } });
              if (!planRecord)
                planRecord = await Plan.findOne({ where: { name: planId } });
              if (!planRecord)
                planRecord = await Plan.findOne({
                  where: { duration: planId },
                });
            }
            if (planRecord && typeof planRecord.contacts !== "undefined") {
              numberOfContacts = planRecord.contacts;
            }
          } catch (e) {
            console.warn("[validate] failed to lookup Plan for contacts:", e);
          }

          const values = {
            user_id: userId ? String(userId) : String(userId || "guest"),
            plan_id: String(planId),
            payment_id: String(paymentId),
            amount: Number(amount),
            currency: String(currency),
            numberOfContacts: numberOfContacts,
            start_date: new Date(),
            status: "active",
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          };

          console.log("[payments.validate] subscription values preview:", {
            paymentId,
            userId,
            planId,
            numberOfContacts,
          });

          try {
            const [record, created] = await Subscription.findOrCreate({
              where: { payment_id: String(paymentId) },
              defaults: values,
            });
            if (!created) await record.update(values);

            console.log("[payments.validate] subscription saved:", {
              id: record.id,
              payment_id: record.payment_id,
              plan_id: record.plan_id,
              numberOfContacts: record.numberOfContacts,
              created,
            });

            if (userId) {
              try {
                const user = await User.findByPk(String(userId));
                if (user) {
                  user.isSubscribed = true;
                  await user.save({ fields: ["isSubscribed"] });
                  console.log("[validate] marked user as subscribed", {
                    userId,
                  });
                }
              } catch (e) {
                console.warn("[validate] failed to mark user subscribed", e);
              }
            }
          } catch (dbErr) {
            console.error(
              "/validate DB upsert error:",
              dbErr && dbErr.stack ? dbErr.stack : dbErr
            );
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
    const Subscription = db.Subscription;
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

// POST /api/payments/consume
// Body: { provider_id: string|number, action: 'call'|'message'|'view' }
// Atomically decrement the user's subscription numberOfContacts (if not null)
// and record a ContactLog entry. Returns { remaining: number|null }
router.post("/consume", authMiddleware, async (req, res) => {
  try {
    const { provider_id: providerId, action } = req.body || {};
    if (!providerId)
      return res.status(400).json({ error: "provider_id is required" });
    const userId = String(req.user.id);

    // If the user is trying to consume a contact on their own post, skip consumption.
    // This prevents providers from consuming their own subscription contacts.
    try {
      const ProviderUser = await db.User.findByPk(String(providerId));
      // providerId may be userService id or provider user id; if providerId equals current user id
      // treat as owner. If ProviderUser exists and its id equals userId, skip consumption.
      if (ProviderUser && String(ProviderUser.id) === String(userId)) {
        return res.json({ remaining: null, message: "Own post - no subscription consumed" });
      }
    } catch (e) {
      // ignore lookup errors and continue with normal consumption logic
    }

    const Subscription = db.Subscription;
    const ContactLog = db.ContactLog;

    // Find latest active subscription
    const sub = await Subscription.findOne({
      where: { user_id: userId, status: "active" },
      order: [["start_date", "DESC"]],
    });

    if (!sub) {
      return res.status(403).json({ error: "No active subscription" });
    }

    // If numberOfContacts is null -> unlimited
    if (
      sub.numberOfContacts === null ||
      typeof sub.numberOfContacts === "undefined"
    ) {
      // Log contact but do not decrement
      if (ContactLog) {
        try {
          await ContactLog.create({
            user_id: userId,
            subscription_id: sub.id,
            provider_id: String(providerId),
            action: String(action || "view"),
          });
        } catch (e) {
          console.warn("[consume] failed to persist ContactLog:", e);
        }
      }
      return res.json({ remaining: null, subscription: sub });
    }

    // Otherwise decrement atomically using a single UPDATE to avoid lock issues
    const sequelize = db.sequelize;
    const Op = db.Sequelize.Op;
    let remaining = sub.numberOfContacts;
    await sequelize.transaction(async (t) => {
      // decrement only when numberOfContacts > 0
      const [affectedCount, affectedRows] = await Subscription.update(
        { numberOfContacts: sequelize.literal('"numberOfContacts" - 1') },
        {
          where: { id: sub.id, numberOfContacts: { [Op.gt]: 0 } },
          transaction: t,
          returning: true,
        }
      );

      if (!affectedCount || affectedCount === 0) {
        throw new Error("limit_exceeded");
      }

      const updated =
        Array.isArray(affectedRows) && affectedRows[0] ? affectedRows[0] : null;
      if (updated) remaining = updated.numberOfContacts;

      // record contact log if model exists
      if (ContactLog) {
        try {
          await ContactLog.create(
            {
              user_id: userId,
              subscription_id: sub.id,
              provider_id: String(providerId),
              action: String(action || "view"),
            },
            { transaction: t }
          );
        } catch (e) {
          console.warn("[consume] failed to persist ContactLog in tx:", e);
        }
      }
    });

    return res.json({ remaining, subscription: sub });
  } catch (err) {
    if (err && err.message === "limit_exceeded") {
      return res
        .status(403)
        .json({ error: "Subscription contact limit reached" });
    }
    console.error("/consume error:", err && err.stack ? err.stack : err);
    return res.status(500).json({ error: "Failed to consume contact" });
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
      user: req.user.id,
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
    if (err && err.error && err.error.description) {
      console.error("Razorpay create link (user) error (razorpay):", err.error);
    } else {
      console.error(
        "Razorpay create link (user) error:",
        err && err.stack ? err.stack : err
      );
    }
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
    const Subscription = db.Subscription;

    if (!payment_id && !reference_id) {
      return res
        .status(400)
        .json({ error: "payment_id or reference_id is required" });
    }

    let record = null;
    if (payment_id) {
      record = await Subscription.findOne({
        where: { payment_id: String(payment_id) },
      });
    } else {
      // The subscription table doesn't currently have a separate `reference_id`
      // column in many setups. Many flows store the payment link/reference id
      // into `payment_id` on first persist. Look for a matching payment_id
      // using the provided reference_id value.
      record = await Subscription.findOne({
        where: { payment_id: String(reference_id) },
      });
    }
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
