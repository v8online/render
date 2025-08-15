const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración de la base de datos PostgreSQL para Render
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://localhost:5432/conecta_cordoba',
  {
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Importar todos los modelos
const User = require('../models/User')(sequelize);
const Connection = require('../models/Connection')(sequelize);
const Review = require('../models/Review')(sequelize);

// Definir asociaciones
User.hasMany(Connection, { foreignKey: 'clienteId', as: 'clienteConnections' });
User.hasMany(Connection, { foreignKey: 'profesionalId', as: 'profesionalConnections' });
User.hasMany(Review, { foreignKey: 'clienteId', as: 'clienteReviews' });
User.hasMany(Review, { foreignKey: 'profesionalId', as: 'profesionalReviews' });

Connection.belongsTo(User, { foreignKey: 'clienteId', as: 'cliente' });
Connection.belongsTo(User, { foreignKey: 'profesionalId', as: 'profesional' });
Connection.hasOne(Review, { foreignKey: 'conexionId', as: 'review' });

Review.belongsTo(User, { foreignKey: 'clienteId', as: 'cliente' });
Review.belongsTo(User, { foreignKey: 'profesionalId', as: 'profesional' });
Review.belongsTo(Connection, { foreignKey: 'conexionId', as: 'conexion' });

module.exports = {
  sequelize,
  User,
  Connection,
  Review
};