"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Ratings", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    raterId: { type: Sequelize.INTEGER, allowNull: false },
    ratedId: { type: Sequelize.INTEGER, allowNull: false },
    score: { type: Sequelize.INTEGER, allowNull: false },
    comment: { type: Sequelize.TEXT, allowNull: true },
    createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal("NOW()") },
    updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal("NOW()") },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("Ratings");
}
