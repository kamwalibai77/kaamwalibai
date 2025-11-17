export default (sequelize, DataTypes) => {
  const ServiceType = sequelize.define("ServiceType", {
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    icon: DataTypes.STRING,
  });
  ServiceType.associate = (models) => {
    ServiceType.belongsToMany(models.UserService, {
      through: models.ServiceTypeUserServiceMap,
      foreignKey: "serviceTypeId",
      otherKey: "userServiceId",
      as: "userServices",
    });
  };
  return ServiceType;
};
