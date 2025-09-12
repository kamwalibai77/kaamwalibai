"use strict";
const bcrypt = require("bcrypt");

export default {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash("superadmin123", 10);

    return queryInterface.bulkInsert("Users", [
      {
        name: "Super Admin",
        email: "superadmin@example.com",
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete(
      "Users",
      { email: "superadmin@example.com" },
      {}
    );
  },
};
