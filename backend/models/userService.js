export default (sequelize, DataTypes) => {
  const UserService = sequelize.define("UserService", {
    providerId: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    rateType: DataTypes.ENUM("hourly", "daily", "weekly", "monthly"), // ✅ role column
    currency: { type: DataTypes.STRING, defaultValue: "INR" },
    contactNumber: { type: DataTypes.STRING },
    availabilitySlots: { type: DataTypes.JSON, allowNull: true },
  });

  UserService.associate = (models) => {
    UserService.belongsTo(models.User, {
      foreignKey: "providerId",
      as: "provider",
    });
    UserService.belongsToMany(models.ServiceType, {
      through: models.ServiceTypeUserServiceMap,
      foreignKey: "userServiceId",
      otherKey: "serviceTypeId",
      as: "serviceTypes",
    });
  };

  return UserService;
};
