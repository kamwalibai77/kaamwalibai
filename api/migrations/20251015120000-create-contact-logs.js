// Migration: create ContactLogs table
"use strict";

export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("ContactLogs", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: { type: Sequelize.STRING, allowNull: false },
      subscription_id: { type: Sequelize.UUID, allowNull: true },
      provider_id: { type: Sequelize.STRING, allowNull: false },
      action: { type: Sequelize.STRING, allowNull: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("ContactLogs");
  },
};
