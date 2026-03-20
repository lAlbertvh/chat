const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    // references: { model: 'Users', key: 'id' } // не нужно, т.к. связь определим в index.js
  },
  receiverId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  roomId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('text', 'file', 'image'),
    defaultValue: 'text'
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = Message;
