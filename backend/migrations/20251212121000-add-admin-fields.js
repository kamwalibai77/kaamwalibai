"use strict";

export default {
  async up(queryInterface, Sequelize) {
    // Add status and assignment fields to Reports table
    await queryInterface.addColumn("Reports", "status", {
      type: Sequelize.ENUM("open", "in-progress", "closed"),
      allowNull: false,
      defaultValue: "open",
    });

    await queryInterface.addColumn("Reports", "assignedTo", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addColumn("Reports", "resolution", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn("Reports", "resolvedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("Reports", "targetType", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Add isHidden field to Ratings table
    await queryInterface.addColumn("Ratings", "isHidden", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Reports", "status");
    await queryInterface.removeColumn("Reports", "assignedTo");
    await queryInterface.removeColumn("Reports", "resolution");
    await queryInterface.removeColumn("Reports", "resolvedAt");
    await queryInterface.removeColumn("Reports", "targetType");
    await queryInterface.removeColumn("Ratings", "isHidden");
  },
};
