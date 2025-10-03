"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Otps", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal("gen_random_uuid()"),
      primaryKey: true,
    },
    phone: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    otp_hash: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    expires_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    attempts: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    used: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    purpose: {
      type: Sequelize.STRING,
      allowNull: true,
    },
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

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("Otps");
}
