'use strict';
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('AvailabilityTimes', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    providerId: { type: Sequelize.INTEGER, allowNull: false },
    dayOfWeek: { type: Sequelize.STRING, allowNull: false },
    startTime: { type: Sequelize.TIME, allowNull: false },
    endTime: { type: Sequelize.TIME, allowNull: false },
    createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') }
  });
}
export async function down(queryInterface) {
  await queryInterface.dropTable('AvailabilityTimes');
}