export default (sequelize, DataTypes) => {
  const AvailabilityTime = sequelize.define("AvailabilityTime", {
    providerId: { type: DataTypes.INTEGER, allowNull: false },
    dayOfWeek: { type: DataTypes.STRING, allowNull: false },
    startTime: { type: DataTypes.TIME, allowNull: false },
    endTime: { type: DataTypes.TIME, allowNull: false },
  });
  return AvailabilityTime;
};