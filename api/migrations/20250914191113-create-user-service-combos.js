"use strict";
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("UserServiceCombos", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.STRING, allowNull: false },
    description: { type: Sequelize.TEXT },
    userServiceIds: { type: Sequelize.JSON }, // array of service type IDs
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
  await queryInterface.dropTable("UserServiceCombos");
}
