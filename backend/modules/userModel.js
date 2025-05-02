const { DataTypes } = require('sequelize');
// const sequelize = require('../config/mysqlDatabase');
const sequelize = require('../config/postgresDatabase');

const User = sequelize.define(process.env.POSTGRESQL_USERS, {
    id: { type: DataTypes.STRING, primaryKey: true, allowNull: true },
    businessName: { type: DataTypes.STRING, allowNull: true },
    firstName: { type: DataTypes.STRING, allowNull: true },
    lastName: { type: DataTypes.STRING, allowNull: true },
    emailId: { type: DataTypes.STRING, unique: true, allowNull: true },
    mobile: { type: DataTypes.STRING, unique: true, allowNull: true },
    pin: { type: DataTypes.STRING, allowNull: true },
    userType: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.STRING, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    state: { type: DataTypes.STRING, allowNull: true },
    country: { type: DataTypes.STRING, allowNull: true },
    zip: { type: DataTypes.STRING, allowNull: true },
    company: { type: DataTypes.STRING, allowNull: true },
    website: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.STRING, defaultValue: 'Active' },
    created: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    token: { type: DataTypes.STRING, allowNull: true },
});

module.exports = User;