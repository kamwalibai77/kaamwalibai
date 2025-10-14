"use strict";

// Backfill existing Subscriptions.numberOfContacts from Plans.contacts
// Strategy:
// 1) If subscription.plan_id is numeric, match Plan.id
// 2) Else try matching Plan.name
// 3) Else try matching Plan.duration

export async function up(queryInterface, Sequelize) {
  // Preview-safe: update only where numberOfContacts IS NULL and plan matches
  await queryInterface.sequelize.query(`
    UPDATE "Subscriptions" AS s
    SET "numberOfContacts" = p.contacts
    FROM "Plans" p
    WHERE s."numberOfContacts" IS NULL
      AND s."plan_id" ~ '^[0-9]+'
      AND p.id = CAST(s."plan_id" AS INTEGER)
      AND p.contacts IS NOT NULL;
  `);

  await queryInterface.sequelize.query(`
    UPDATE "Subscriptions" AS s
    SET "numberOfContacts" = p.contacts
    FROM "Plans" p
    WHERE s."numberOfContacts" IS NULL
      AND p.name = s."plan_id"
      AND p.contacts IS NOT NULL;
  `);

  await queryInterface.sequelize.query(`
    UPDATE "Subscriptions" AS s
    SET "numberOfContacts" = p.contacts
    FROM "Plans" p
    WHERE s."numberOfContacts" IS NULL
      AND p.duration = s."plan_id"
      AND p.contacts IS NOT NULL;
  `);
}

export async function down(queryInterface, Sequelize) {
  // Revert: set numberOfContacts back to NULL for all subscriptions
  await queryInterface.sequelize.query(`
    UPDATE "Subscriptions"
    SET "numberOfContacts" = NULL
    WHERE "numberOfContacts" IS NOT NULL;
  `);
}
