"use strict";

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Users", "kycRejectionReason", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Users", "kycRejectionReason");
  },
};
