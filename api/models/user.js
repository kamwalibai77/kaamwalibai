export default (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("user", "ServiceProvider", "superadmin"), // ✅ role column
      defaultValue: "user", // default role
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM("male", "female", "other"),
      allowNull: true,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    adhar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pan: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profilePhoto: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isSubscribed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    trialCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // user gets 0 trial connections by default until they accept free trial
    },
    aaadharNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    panCardNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  User.associate = (models) => {
    User.hasMany(models.UserService, {
      foreignKey: "providerId",
      as: "services",
      onDelete: "CASCADE",
    });
  };

  return User;
};
