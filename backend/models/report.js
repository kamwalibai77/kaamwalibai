export default (sequelize, DataTypes) => {
  const Report = sequelize.define("Report", {
    reporterId: { type: DataTypes.INTEGER, allowNull: false },
    targetId: { type: DataTypes.INTEGER, allowNull: false },
    targetType: { type: DataTypes.STRING, allowNull: true },
    reason: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM("open", "in-progress", "closed"),
      allowNull: false,
      defaultValue: "open",
    },
    assignedTo: { type: DataTypes.INTEGER, allowNull: true },
    resolution: { type: DataTypes.TEXT, allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
  });

  Report.associate = (models) => {
    Report.belongsTo(models.User, {
      foreignKey: "reporterId",
      as: "reporter",
    });
    Report.belongsTo(models.User, {
      foreignKey: "assignedTo",
      as: "assignedUser",
    });
  };

  return Report;
};
