const sequelize = require('../config/db');
const User = require('./User');
const Message = require('./Message');

// Определяем связи
User.hasMany(Message, { foreignKey: 'senderId' });
Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });

module.exports = {
  sequelize,
  User,
  Message
};
