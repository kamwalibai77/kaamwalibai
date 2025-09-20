export default (sequelize, DataTypes) => {
  const UserService = sequelize.define("UserService", {
    providerId: { type: DataTypes.INTEGER, allowNull: false },
    serviceTypeIds: { type: DataTypes.JSON }, // array of service type IDs
    amount: { type: DataTypes.FLOAT, allowNull: false },
    rateType: DataTypes.ENUM("hourly", "daily", "weekly", "monthly"), // ✅ role column
    currency: { type: DataTypes.STRING, defaultValue: "INR" },
    contactNumber: { type: DataTypes.STRING },
  });

  UserService.associate = (models) => {
    UserService.belongsTo(models.User, {
      foreignKey: "providerId",
      as: "provider",
    });
  };

  return UserService;
};
