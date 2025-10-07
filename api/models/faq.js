export default (sequelize, DataTypes) => {
  const Faq = sequelize.define("Faq", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    question: { type: DataTypes.TEXT, allowNull: false },
    answer: { type: DataTypes.TEXT, allowNull: false },
  });
  return Faq;
};
