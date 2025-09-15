export default (sequelize, DataTypes) => {
  const ServiceType = sequelize.define("ServiceType", {
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: DataTypes.TEXT,
  });
  return ServiceType;
};