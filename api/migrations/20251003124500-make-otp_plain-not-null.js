"use strict";

export async function up(queryInterface, Sequelize) {
  // set any existing null otp_plain to empty string and then change column to NOT NULL
  await queryInterface.sequelize.transaction(async (t) => {
    await queryInterface.sequelize.query(
      "UPDATE \"Otps\" SET otp_plain = '' WHERE otp_plain IS NULL",
      { transaction: t }
    );
    await queryInterface.changeColumn(
      "Otps",
      "otp_plain",
      {
        type: Sequelize.STRING,
        allowNull: false,
      },
      { transaction: t }
    );
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.changeColumn("Otps", "otp_plain", {
    type: Sequelize.STRING,
    allowNull: true,
  });
}
