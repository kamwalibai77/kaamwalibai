"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Reports", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    reporterId: { type: Sequelize.INTEGER, allowNull: false },
    targetId: { type: Sequelize.INTEGER, allowNull: false },
    reason: { type: Sequelize.TEXT, allowNull: true },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("NOW()"),
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("NOW()"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("Reports");
}
