export default (sequelize, DataTypes) => {
  const Report = sequelize.define("Report", {
    reporterId: { type: DataTypes.INTEGER, allowNull: false },
    targetId: { type: DataTypes.INTEGER, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: true },
  });
  return Report;
};
