// migrations/20250927111059-create-subscriptions.js

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Subscriptions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4, // ✅ Let Sequelize generate UUID
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      plan_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      payment_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING,
        defaultValue: "INR",
      },
      status: {
        type: Sequelize.ENUM("active", "expired", "failed"),
        defaultValue: "active",
      },
      start_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Subscriptions");
  },
};
