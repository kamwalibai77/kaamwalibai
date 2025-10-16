"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("BlockedUsers", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: Sequelize.INTEGER, allowNull: false },
    targetId: { type: Sequelize.INTEGER, allowNull: false },
    createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal("NOW()") },
    updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal("NOW()") },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("BlockedUsers");
}
