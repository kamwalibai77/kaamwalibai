"use strict";
import bcrypt from "bcrypt";

export default {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash("superadmin123", 10);

    return queryInterface.bulkInsert("Users", [
      {
        name: "Super Admin",
        phoneNumber: "9876543210",
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
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
