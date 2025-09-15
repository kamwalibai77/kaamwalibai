export default (sequelize, DataTypes) => {
  const Area = sequelize.define("Area", {
    providerId: { type: DataTypes.INTEGER, allowNull: false },
    city: { type: DataTypes.STRING, allowNull: false },
    pincode: { type: DataTypes.STRING, allowNull: false },
    radiusKm: { type: DataTypes.INTEGER, defaultValue: 5 },
  });
  return Area;
};