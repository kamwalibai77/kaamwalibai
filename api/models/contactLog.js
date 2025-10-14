// api/models/contactLog.js
export default (sequelize, DataTypes) => {
  const ContactLog = sequelize.define("ContactLog", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: { type: DataTypes.STRING, allowNull: false },
    subscription_id: { type: DataTypes.UUID, allowNull: true },
    provider_id: { type: DataTypes.STRING, allowNull: false },
    action: { type: DataTypes.STRING, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, { timestamps: false });

  ContactLog.associate = (models) => {
    if (models.Subscription) ContactLog.belongsTo(models.Subscription, { foreignKey: 'subscription_id' });
  };

  return ContactLog;
};
