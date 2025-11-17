export default (sequelize, DataTypes) => {
  const ServiceTypeUserServiceMap = sequelize.define(
    "ServiceTypeUserServiceMap",
    {
      userServiceId: { type: DataTypes.INTEGER, allowNull: false },
      serviceTypeId: { type: DataTypes.INTEGER, allowNull: false },
    }
  );

  ServiceTypeUserServiceMap.associate = (models) => {
    ServiceTypeUserServiceMap.belongsTo(models.UserService, {
      foreignKey: "userServiceId", // ✅ force Sequelize to use this
      as: "userService",
    });
    ServiceTypeUserServiceMap.belongsTo(models.ServiceType, {
      foreignKey: "serviceTypeId", // ✅ force Sequelize to use this
      as: "serviceType",
    });
  };

  return ServiceTypeUserServiceMap;
};
