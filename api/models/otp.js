export default (sequelize, DataTypes) => {
  const Otp = sequelize.define("Otp", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    otp_hash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    otp_plain: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    purpose: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  return Otp;
};
