"use strict";
import bcrypt from "bcryptjs";

export default {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash("admin@123", 10);

    await queryInterface.bulkInsert("Users", [
      {
        name: "Super Admin",
        phoneNumber: "9999999999",
        password: hashedPassword,
        role: "superadmin",
        address: "Admin Office",
        gender: "other",
        kycStatus: "verified",
        isSubscribed: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Customer Success Manager",
        phoneNumber: "8888888888",
        password: hashedPassword,
        role: "customerSuccess",
        address: "CS Department",
        gender: "other",
        kycStatus: "verified",
        isSubscribed: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Support & Maintenance",
        phoneNumber: "7777777777",
        password: hashedPassword,
        role: "supportMaintenance",
        address: "Support Department",
        gender: "other",
        kycStatus: "verified",
        isSubscribed: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Users", {
      phoneNumber: ["9999999999", "8888888888", "7777777777"],
    });
  },
};
