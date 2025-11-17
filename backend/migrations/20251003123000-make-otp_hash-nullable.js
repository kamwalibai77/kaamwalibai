"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.changeColumn("Otps", "otp_hash", {
    type: Sequelize.STRING,
    allowNull: true,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.changeColumn("Otps", "otp_hash", {
    type: Sequelize.STRING,
    allowNull: false,
  });
}
