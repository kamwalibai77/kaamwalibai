"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("Subscriptions", "numberOfContacts", {
    type: Sequelize.INTEGER,
    allowNull: true,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn("Subscriptions", "numberOfContacts");
}
