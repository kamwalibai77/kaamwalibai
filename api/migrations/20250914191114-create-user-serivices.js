"use strict";
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("UserServices", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    providerId: { type: Sequelize.INTEGER, allowNull: false },
    serviceTypeIds: { type: Sequelize.JSON }, // array of service type IDs
    amount: { type: Sequelize.FLOAT, allowNull: false },
    rateType: Sequelize.ENUM("hourly", "daily", "weekly", "monthly"),
    currency: { type: Sequelize.STRING, defaultValue: "INR" },
    contactNumber: { type: Sequelize.STRING },
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
