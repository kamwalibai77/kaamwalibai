"use strict";

export default {
  async up(queryInterface, Sequelize) {
    // Update all service providers with null kycStatus to 'pending'
    await queryInterface.sequelize.query(`
      UPDATE "Users" 
      SET "kycStatus" = 'pending' 
      WHERE "role" = 'ServiceProvider' 
      AND ("kycStatus" IS NULL OR "kycStatus" = 'none');
    `);
  },

  async down(queryInterface, Sequelize) {
    // Optionally revert back to 'none'
    await queryInterface.sequelize.query(`
      UPDATE "Users" 
      SET "kycStatus" = 'none' 
      WHERE "role" = 'ServiceProvider' 
      AND "kycStatus" = 'pending';
    `);
  },
};
