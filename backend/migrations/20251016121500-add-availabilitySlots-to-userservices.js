"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("UserServices", "availabilitySlots", {
    type: Sequelize.JSON,
    allowNull: true,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn("UserServices", "availabilitySlots");
}
