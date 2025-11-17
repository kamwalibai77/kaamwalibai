"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("Users", "profilePhoto", {
    type: Sequelize.STRING,
    allowNull: true,
  });

  await queryInterface.addColumn("Users", "isSubscribed", {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn("Users", "profilePhoto");
  await queryInterface.removeColumn("Users", "isSubscribed");
}
