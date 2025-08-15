const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Connection = sequelize.define('Connection', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    clienteId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    profesionalId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    numeroConexion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    pagoRequerido: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    pagoCompletado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    montoComision: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 1500.00 // Pesos argentinos
    },
    // Estado de la conexión
    estado: {
      type: DataTypes.ENUM('pendiente', 'aceptada', 'en_progreso', 'completada', 'cancelada'),
      defaultValue: 'pendiente'
    },
    // Información del trabajo
    descripcionTrabajo: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    fechaInicioTrabajo: {
      type: DataTypes.DATE,
      allowNull: true
    },
    fechaFinTrabajo: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Información de pago (para la 3ra conexión)
    infoPago: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    // Comunicación
    mensajes: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    // Metadata
    ubicacionTrabajo: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    urgente: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    presupuestoEstimado: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    calificacionPendiente: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'connections',
    timestamps: true,
    indexes: [
      {
        fields: ['clienteId', 'profesionalId']
      },
      {
        fields: ['clienteId', 'numeroConexion']
      },
      {
        fields: ['profesionalId', 'estado']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['estado']
      },
      {
        fields: ['pagoRequerido', 'pagoCompletado']
      }
    ],
    hooks: {
      beforeCreate: async (connection) => {
        // Calcular número de conexión
        const count = await Connection.count({
          where: {
            clienteId: connection.clienteId,
            profesionalId: connection.profesionalId
          }
        });
        
        connection.numeroConexion = count + 1;
        
        // Verificar si requiere pago (3ra conexión)
        connection.pagoRequerido = connection.numeroConexion === 3;
        
        // Marcar para calificación si se completa
        if (connection.estado === 'completada') {
          connection.calificacionPendiente = true;
        }
      },
      beforeUpdate: async (connection) => {
        // Marcar para calificación cuando se completa
        if (connection.changed('estado') && connection.estado === 'completada') {
          connection.calificacionPendiente = true;
        }
      }
    }
  });

  // Métodos de instancia
  Connection.prototype.agregarMensaje = async function(emisorId, mensaje) {
    const nuevoMensaje = {
      emisor: emisorId,
      mensaje: mensaje,
      fecha: new Date(),
      leido: false
    };
    
    this.mensajes = [...this.mensajes, nuevoMensaje];
    return await this.save();
  };

  Connection.prototype.marcarMensajesLeidos = async function(usuarioId) {
    this.mensajes = this.mensajes.map(mensaje => {
      if (mensaje.emisor !== usuarioId) {
        mensaje.leido = true;
      }
      return mensaje;
    });
    
    return await this.save();
  };

  Connection.prototype.completarTrabajo = async function() {
    this.estado = 'completada';
    this.fechaFinTrabajo = new Date();
    this.calificacionPendiente = true;
    return await this.save();
  };

  // Métodos estáticos
  Connection.obtenerNumeroConexion = async function(clienteId, profesionalId) {
    const count = await this.count({
      where: {
        clienteId: clienteId,
        profesionalId: profesionalId
      }
    });
    return count + 1;
  };

  Connection.verificarPagoRequerido = async function(clienteId, profesionalId) {
    const numeroConexion = await this.obtenerNumeroConexion(clienteId, profesionalId);
    return numeroConexion === 3;
  };

  // Virtual para duración del trabajo
  Connection.prototype.getDuracionTrabajo = function() {
    if (this.fechaInicioTrabajo && this.fechaFinTrabajo) {
      return Math.ceil((this.fechaFinTrabajo - this.fechaInicioTrabajo) / (1000 * 60 * 60 * 24));
    }
    return null;
  };

  // Virtual para verificar si necesita pago
  Connection.prototype.getRequierePago = function() {
    return this.numeroConexion === 3 && !this.pagoCompletado;
  };

  return Connection;
};