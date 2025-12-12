"use strict";

export default {
  async up(queryInterface, Sequelize) {
    // Drop the existing enum and recreate with new values
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Users_role" RENAME TO "enum_Users_role_old";
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_Users_role" AS ENUM('user', 'ServiceProvider', 'superadmin', 'customerSuccess', 'supportMaintenance');
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" 
      ALTER COLUMN "role" TYPE "enum_Users_role" 
      USING "role"::text::"enum_Users_role";
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE "enum_Users_role_old";
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Users_role" RENAME TO "enum_Users_role_old";
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_Users_role" AS ENUM('user', 'ServiceProvider', 'superadmin');
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" 
      ALTER COLUMN "role" TYPE "enum_Users_role" 
      USING "role"::text::"enum_Users_role";
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE "enum_Users_role_old";
    `);
  },
};
