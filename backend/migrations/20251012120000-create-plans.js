"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Plans", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: { type: Sequelize.STRING, allowNull: true },
    price: { type: Sequelize.INTEGER, allowNull: false },
    currency: { type: Sequelize.STRING, allowNull: false, defaultValue: "INR" },
    contacts: { type: Sequelize.INTEGER, allowNull: true },
    duration: { type: Sequelize.STRING, allowNull: false },
    type: { type: Sequelize.ENUM("user", "provider"), allowNull: false },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("Plans");
}
