export default (sequelize, DataTypes) => {
  const UserServiceCombo = sequelize.define("UserServiceCombo", {
    name: { type: DataTypes.STRING, allowNull: false },
    description: DataTypes.TEXT,
    serviceTypeIds: DataTypes.JSON,
    amount: { type: DataTypes.FLOAT, allowNull: false },
    currency: { type: DataTypes.STRING, defaultValue: "INR" },
  });
  return UserServiceCombo;
};
