"use strict";

export default {
  async up(queryInterface, Sequelize) {
    // Make role nullable and remove default value so new users are not auto-assigned 'user'
    await queryInterface.changeColumn("Users", "role", {
      type: Sequelize.ENUM("user", "serviceprovider", "admin"),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert back to not-null with default 'user'
    await queryInterface.changeColumn("Users", "role", {
      type: Sequelize.ENUM("user", "serviceprovider", "admin"),
      allowNull: false,
      defaultValue: "user",
    });
  },
};
