'use strict';
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('Areas', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    providerId: { type: Sequelize.INTEGER, allowNull: false },
    city: { type: Sequelize.STRING, allowNull: false },
    pincode: { type: Sequelize.STRING, allowNull: false },
    radiusKm: { type: Sequelize.INTEGER, defaultValue: 5 },
    createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') }
  });
}
export async function down(queryInterface) {
  await queryInterface.dropTable('Areas');
}