const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Review = sequelize.define('Review', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    profesionalId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    clienteId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    conexionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'connections',
        key: 'id'
      }
    },
    puntuacion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    comentario: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [10, 500]
      }
    },
    verificado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true // Solo clientes que tuvieron conexión real pueden calificar
    },
    moderado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    reportado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Metadata adicional
    trabajoCompletado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    recomendaria: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    aspectosPositivos: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    aspectosMejorar: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    }
  }, {
    tableName: 'reviews',
    timestamps: true,
    indexes: [
      {
        fields: ['profesionalId']
      },
      {
        fields: ['clienteId']
      },
      {
        unique: true,
        fields: ['conexionId'] // Una sola review por conexión
      },
      {
        fields: ['puntuacion']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['verificado']
      }
    ],
    hooks: {
      afterCreate: async (review) => {
        // Actualizar calificaciones del profesional
        const { User } = require('../config/database');
        const profesional = await User.findByPk(review.profesionalId);
        
        if (profesional) {
          // Obtener todas las reviews del profesional
          const reviews = await Review.findAll({
            where: { profesionalId: review.profesionalId, verificado: true }
          });
          
          // Calcular nueva distribución
          const distribucion = {
            estrellas5: 0,
            estrellas4: 0,
            estrellas3: 0,
            estrellas2: 0,
            estrellas1: 0
          };
          
          reviews.forEach(r => {
            distribucion[`estrellas${r.puntuacion}`]++;
          });
          
          // Calcular promedio
          const total = reviews.length;
          const suma = reviews.reduce((acc, r) => acc + r.puntuacion, 0);
          const promedio = total > 0 ? Number((suma / total).toFixed(1)) : 0;
          
          // Actualizar profesional
          await profesional.update({
            promedioCalificaciones: promedio,
            totalReviews: total,
            distribucionEstrellas: distribucion
          });
        }
        
        // Marcar conexión como calificada
        const { Connection } = require('../config/database');
        await Connection.update(
          { calificacionPendiente: false },
          { where: { id: review.conexionId } }
        );
      },
      afterUpdate: async (review) => {
        // Si se cambia la puntuación, recalcular calificaciones del profesional
        if (review.changed('puntuacion')) {
          const { User } = require('../config/database');
          const profesional = await User.findByPk(review.profesionalId);
          
          if (profesional) {
            await profesional.actualizarCalificaciones();
          }
        }
      },
      afterDestroy: async (review) => {
        // Si se elimina una review, recalcular calificaciones del profesional
        const { User } = require('../config/database');
        const profesional = await User.findByPk(review.profesionalId);
        
        if (profesional) {
          await profesional.actualizarCalificaciones();
        }
      }
    }
  });

  // Métodos estáticos
  Review.getPromedioYDistribucion = async function(profesionalId) {
    const reviews = await this.findAll({
      where: { profesionalId, verificado: true },
      attributes: ['puntuacion']
    });
    
    const distribucion = {
      estrellas5: 0,
      estrellas4: 0,
      estrellas3: 0,
      estrellas2: 0,
      estrellas1: 0
    };
    
    let suma = 0;
    reviews.forEach(review => {
      suma += review.puntuacion;
      distribucion[`estrellas${review.puntuacion}`]++;
    });
    
    const total = reviews.length;
    const promedio = total > 0 ? Number((suma / total).toFixed(1)) : 0;
    
    return {
      promedio,
      total,
      distribucion
    };
  };

  Review.getPorProfesional = async function(profesionalId, limit = 10, offset = 0) {
    return await this.findAndCountAll({
      where: { profesionalId, verificado: true },
      include: [
        {
          association: 'cliente',
          attributes: ['nombre', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
  };

  Review.getRecientes = async function(limit = 5) {
    return await this.findAll({
      where: { verificado: true },
      include: [
        {
          association: 'profesional',
          attributes: ['nombre', 'oficios']
        },
        {
          association: 'cliente',
          attributes: ['nombre']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit
    });
  };

  return Review;
};