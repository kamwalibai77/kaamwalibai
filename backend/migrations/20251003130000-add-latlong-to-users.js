"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("Users", "latitude", {
    type: Sequelize.DOUBLE,
    allowNull: true,
  });
  await queryInterface.addColumn("Users", "longitude", {
    type: Sequelize.DOUBLE,
    allowNull: true,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn("Users", "latitude");
  await queryInterface.removeColumn("Users", "longitude");
}
