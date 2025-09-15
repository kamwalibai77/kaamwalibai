'use strict';
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('ServiceTypes', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.STRING, allowNull: false, unique: true },
    description: { type: Sequelize.TEXT },
    createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') }
  });
}
export async function down(queryInterface) {
  await queryInterface.dropTable('ServiceTypes');
}