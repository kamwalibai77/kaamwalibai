#!/usr/bin/env node
// One-off backfill script: populate Subscription.numberOfContacts from Plan.contacts
// Usage: node api/scripts/backfill-numberOfContacts.js

import db from "../models/index.js";

async function main() {
  try {
    const Subscription = db.Subscription;
    const Plan = db.Plan;

    const subs = await Subscription.findAll({
      where: { numberOfContacts: null },
    });
    console.log(
      `Found ${subs.length} subscriptions with NULL numberOfContacts`
    );

    let updated = 0;

    for (const s of subs) {
      const planId = s.plan_id;
      let planRecord = null;
      if (planId) {
        const maybeNum = Number(planId);
        if (!Number.isNaN(maybeNum)) planRecord = await Plan.findByPk(maybeNum);
        if (!planRecord)
          planRecord = await Plan.findOne({ where: { id: planId } });
        if (!planRecord)
          planRecord = await Plan.findOne({ where: { name: planId } });
        if (!planRecord)
          planRecord = await Plan.findOne({ where: { duration: planId } });
      }

      if (
        planRecord &&
        typeof planRecord.contacts !== "undefined" &&
        planRecord.contacts !== null
      ) {
        s.numberOfContacts = planRecord.contacts;
        await s.save({ fields: ["numberOfContacts"] });
        updated++;
        console.log(
          `Updated subscription ${s.id} (plan_id=${s.plan_id}) -> ${s.numberOfContacts}`
        );
      }
    }

    console.log(`Backfill complete. Updated ${updated} subscriptions.`);
    process.exit(0);
  } catch (err) {
    console.error("Backfill failed:", err);
    process.exit(1);
  }
}

main();
