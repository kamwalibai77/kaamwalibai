"use strict";
import bcrypt from "bcrypt";

export default {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash("superadmin123", 10);

    // Make this seeder idempotent: only insert if a user with the phone doesn't exist
    const phone = "9876543210";
    const now = new Date();
    const existing = await queryInterface.sequelize.query(
      'SELECT id FROM "Users" WHERE "phoneNumber" = :phone',
      {
        replacements: { phone },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (existing && existing.length > 0) {
      console.log("[seed] superadmin already exists, skipping insert");
      return Promise.resolve();
    }

    return queryInterface.bulkInsert("Users", [
      {
        name: "Super Admin",
        phoneNumber: phone,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete(
      "Users",
      { phoneNumber: "9876543210" },
      {}
    );
  },
};
