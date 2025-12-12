"use strict";

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Users", "kycStatus", {
      type: Sequelize.ENUM("none", "pending", "verified", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Users", "kycStatus", {
      type: Sequelize.ENUM("none", "pending", "verified", "rejected"),
      allowNull: false,
      defaultValue: "none",
    });
  },
};
