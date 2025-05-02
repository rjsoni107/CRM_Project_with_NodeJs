const { Sequelize } = require('sequelize');

const { POSTGRESQL_DATABASE, POSTGRESQL_USERNAME, POSTGRESQL_PASSWORD, POSTGRESQL_HOST } = process.env;

const sequelize = new Sequelize(POSTGRESQL_DATABASE, POSTGRESQL_USERNAME, POSTGRESQL_PASSWORD, {
    host: POSTGRESQL_HOST,
    dialect: 'postgres',
    logging: false,
});

module.exports = sequelize;