"use strict";

/**
 * Add KYC related columns to Users table
 */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Users", "kycStatus", {
      type: Sequelize.ENUM("none", "pending", "verified", "rejected"),
      allowNull: false,
      defaultValue: "none",
    });

    await queryInterface.addColumn("Users", "kycFrontUrl", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("Users", "kycBackUrl", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("Users", "kycConsent", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn("Users", "kycSubmittedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("Users", "kycVerifiedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Users", "kycVerifiedAt");
    await queryInterface.removeColumn("Users", "kycSubmittedAt");
    await queryInterface.removeColumn("Users", "kycConsent");
    await queryInterface.removeColumn("Users", "kycBackUrl");
    await queryInterface.removeColumn("Users", "kycFrontUrl");
    await queryInterface.removeColumn("Users", "kycStatus");

    // Drop the enum type (Postgres)
    if (queryInterface.sequelize.getDialect() === "postgres") {
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_Users_kycStatus";'
      );
    }
  },
};
