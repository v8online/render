const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 255]
      }
    },
    tipoUsuario: {
      type: DataTypes.ENUM('cliente', 'profesional'),
      allowNull: false
    },
    emailVerificado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    perfilCompleto: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Información del perfil
    nombre: {
      type: DataTypes.STRING,
      allowNull: true
    },
    telefono: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^\\+?54?[0-9]{10,11}$/
      }
    },
    fotoPerfil: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    // Ubicación
    zona: {
      type: DataTypes.STRING,
      allowNull: true
    },
    coordenadasLat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    coordenadasLng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    direccion: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Solo para profesionales
    oficios: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    portfolioTrabajos: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    // Calificaciones del profesional
    promedioCalificaciones: {
      type: DataTypes.DECIMAL(2, 1),
      defaultValue: 0.0,
      validate: {
        min: 0,
        max: 5
      }
    },
    totalReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    distribucionEstrellas: {
      type: DataTypes.JSONB,
      defaultValue: {
        estrellas5: 0,
        estrellas4: 0,
        estrellas3: 0,
        estrellas2: 0,
        estrellas1: 0
      }
    },
    // Metadata
    ultimoAcceso: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        fields: ['tipoUsuario']
      },
      {
        fields: ['zona']
      },
      {
        fields: ['oficios'],
        using: 'gin'
      },
      {
        fields: ['promedioCalificaciones']
      }
    ],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  // Métodos de instancia
  User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.actualizarUltimoAcceso = function() {
    this.ultimoAcceso = new Date();
    return this.save({ fields: ['ultimoAcceso'] });
  };

  User.prototype.actualizarCalificaciones = function() {
    if (this.tipoUsuario !== 'profesional') return;
    
    const distribucion = this.distribucionEstrellas;
    const total = distribucion.estrellas1 + distribucion.estrellas2 + 
                 distribucion.estrellas3 + distribucion.estrellas4 + distribucion.estrellas5;
    
    if (total > 0) {
      const suma = (distribucion.estrellas1 * 1) + (distribucion.estrellas2 * 2) + 
                   (distribucion.estrellas3 * 3) + (distribucion.estrellas4 * 4) + 
                   (distribucion.estrellas5 * 5);
      
      this.promedioCalificaciones = Number((suma / total).toFixed(1));
      this.totalReviews = total;
      return this.save({ fields: ['promedioCalificaciones', 'totalReviews'] });
    }
  };

  // Métodos estáticos
  User.buscarPorZonaYOficio = async function(zona, oficio) {
    return await this.findAll({
      where: {
        tipoUsuario: 'profesional',
        zona: zona,
        oficios: {
          [sequelize.Sequelize.Op.contains]: [oficio]
        },
        activo: true
      },
      order: [['promedioCalificaciones', 'DESC']]
    });
  };

  return User;
};