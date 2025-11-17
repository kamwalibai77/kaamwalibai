"use strict";

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Users", "aaadharNumber", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Users", "panCardNumber", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Users", "aaadharNumber");
    await queryInterface.removeColumn("Users", "panCardNumber");
  },
};
