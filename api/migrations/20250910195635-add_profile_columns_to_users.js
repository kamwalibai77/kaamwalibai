"use strict";

export default {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("Users");

    // Add mobile
    if (!table.mobile) {
      await queryInterface.addColumn("Users", "mobile", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Add address
    if (!table.address) {
      await queryInterface.addColumn("Users", "address", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Add gender
    if (!table.gender) {
      await queryInterface.addColumn("Users", "gender", {
        type: Sequelize.ENUM("male", "female", "other"),
        allowNull: true,
      });
    }

    // Add age
    if (!table.age) {
      await queryInterface.addColumn("Users", "age", {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    // Add adhar (URL)
    if (!table.adhar) {
      await queryInterface.addColumn("Users", "adhar", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Add pan (URL)
    if (!table.pan) {
      await queryInterface.addColumn("Users", "pan", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("Users");

    if (table.mobile) await queryInterface.removeColumn("Users", "mobile");
    if (table.address) await queryInterface.removeColumn("Users", "address");
    if (table.gender) await queryInterface.removeColumn("Users", "gender");
    if (table.age) await queryInterface.removeColumn("Users", "age");
    if (table.adhar) await queryInterface.removeColumn("Users", "adhar");
    if (table.pan) await queryInterface.removeColumn("Users", "pan");
  },
};
