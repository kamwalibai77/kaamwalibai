"use strict";
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("UserServices", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    providerId: { type: Sequelize.INTEGER, allowNull: false },
    serviceTypeId: { type: Sequelize.INTEGER },
    amount: { type: Sequelize.FLOAT, allowNull: false },
    currency: { type: Sequelize.STRING, defaultValue: "INR" },
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
  await queryInterface.dropTable("UserServices");
}
