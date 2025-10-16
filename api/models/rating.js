export default (sequelize, DataTypes) => {
  const Rating = sequelize.define("Rating", {
    raterId: { type: DataTypes.INTEGER, allowNull: false },
    ratedId: { type: DataTypes.INTEGER, allowNull: false },
    score: { type: DataTypes.INTEGER, allowNull: false },
    comment: { type: DataTypes.TEXT, allowNull: true },
  });

  Rating.associate = (models) => {
    Rating.belongsTo(models.User, { foreignKey: "raterId", as: "rater" });
    Rating.belongsTo(models.User, { foreignKey: "ratedId", as: "rated" });
  };

  return Rating;
};
