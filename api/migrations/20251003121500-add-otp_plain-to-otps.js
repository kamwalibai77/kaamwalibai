"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("Otps", "otp_plain", {
    type: Sequelize.STRING,
    allowNull: true,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn("Otps", "otp_plain");
}
