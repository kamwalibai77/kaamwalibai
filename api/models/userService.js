export default (sequelize, DataTypes) => {
  const UserService = sequelize.define("UserService", {
    providerId: { type: DataTypes.INTEGER, allowNull: false },
    serviceTypeId: DataTypes.INTEGER,
    amount: { type: DataTypes.FLOAT, allowNull: false },
    currency: { type: DataTypes.STRING, defaultValue: "INR" },
  });
  return UserService;
};
