export default (sequelize, DataTypes) => {
  const BlockedUser = sequelize.define("BlockedUser", {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    targetId: { type: DataTypes.INTEGER, allowNull: false },
  });
  return BlockedUser;
};
