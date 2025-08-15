const express = require('express');
const { body, validationResult } = require('express-validator');
const { User, Connection, Review } = require('../config/database');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

const router = express.Router();

// Middleware de autenticación
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, autorización denegada'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'conecta-cordoba-secret-key-render');
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

// Validaciones para crear conexión
const validacionCrearConexion = [
  body('profesionalId')
    .isUUID()
    .withMessage('ID de profesional inválido'),
  body('descripcionTrabajo')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('La descripción debe tener entre 10 y 1000 caracteres'),
  body('urgente')
    .optional()
    .isBoolean()
    .withMessage('Urgente debe ser verdadero o falso'),
  body('ubicacionTrabajo')
    .optional()
    .isObject()
    .withMessage('Ubicación de trabajo debe ser un objeto'),
  body('presupuestoEstimado')
    .optional()
    .isObject()
    .withMessage('Presupuesto estimado debe ser un objeto')
];

// @route   POST /api/connections
// @desc    Crear nueva conexión entre cliente y profesional
// @access  Private (Cliente)
router.post('/', authenticateToken, validacionCrearConexion, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    // Verificar que el usuario sea cliente
    if (req.user.tipoUsuario !== 'cliente') {
      return res.status(403).json({
        success: false,
        message: 'Solo los clientes pueden crear conexiones'
      });
    }

    const {
      profesionalId,
      descripcionTrabajo,
      urgente = false,
      ubicacionTrabajo = {},
      presupuestoEstimado = {}
    } = req.body;

    // Verificar que el profesional existe y está disponible
    const profesional = await User.findOne({
      where: {
        id: profesionalId,
        tipoUsuario: 'profesional',
        disponible: true,
        perfilCompleto: true
      }
    });

    if (!profesional) {
      return res.status(404).json({
        success: false,
        message: 'Profesional no encontrado o no disponible'
      });
    }

    // Verificar si requiere pago (tercera conexión)
    const numeroConexion = await Connection.obtenerNumeroConexion(req.user.id, profesionalId);
    const pagoRequerido = numeroConexion === 3;

    // Crear la conexión
    const nuevaConexion = await Connection.create({
      clienteId: req.user.id,
      profesionalId,
      descripcionTrabajo,
      urgente,
      ubicacionTrabajo,
      presupuestoEstimado,
      numeroConexion,
      pagoRequerido,
      estado: pagoRequerido ? 'pendiente' : 'pendiente'
    });

    // Incluir información del profesional en la respuesta
    const conexionCompleta = await Connection.findByPk(nuevaConexion.id, {
      include: [
        {
          model: User,
          as: 'profesional',
          attributes: ['id', 'nombre', 'zona', 'oficios', 'fotoPerfil']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: pagoRequerido 
        ? 'Conexión creada. Se requiere pago para la tercera conexión.'
        : 'Conexión creada exitosamente',
      data: {
        conexion: {
          id: conexionCompleta.id,
          numeroConexion: conexionCompleta.numeroConexion,
          estado: conexionCompleta.estado,
          descripcionTrabajo: conexionCompleta.descripcionTrabajo,
          urgente: conexionCompleta.urgente,
          pagoRequerido: conexionCompleta.pagoRequerido,
          fechaCreacion: conexionCompleta.createdAt,
          profesional: conexionCompleta.profesional
        }
      }
    });

  } catch (error) {
    console.error('Error al crear conexión:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/connections
// @desc    Obtener conexiones del usuario (cliente o profesional)
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { estado, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Construir condiciones según tipo de usuario
    const whereConditions = {};
    const includeModels = [];

    if (req.user.tipoUsuario === 'cliente') {
      whereConditions.clienteId = req.user.id;
      includeModels.push({
        model: User,
        as: 'profesional',
        attributes: ['id', 'nombre', 'zona', 'oficios', 'fotoPerfil', 'telefono']
      });
    } else if (req.user.tipoUsuario === 'profesional') {
      whereConditions.profesionalId = req.user.id;
      includeModels.push({
        model: User,
        as: 'cliente',
        attributes: ['id', 'nombre', 'zona', 'telefono']
      });
    }

    if (estado) {
      whereConditions.estado = estado;
    }

    const { count, rows: conexiones } = await Connection.findAndCountAll({
      where: whereConditions,
      include: includeModels,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const conexionesFormateadas = conexiones.map(conexion => ({
      id: conexion.id,
      numeroConexion: conexion.numeroConexion,
      estado: conexion.estado,
      descripcionTrabajo: conexion.descripcionTrabajo,
      urgente: conexion.urgente,
      pagoRequerido: conexion.pagoRequerido,
      pagoCompletado: conexion.pagoCompletado,
      fechaCreacion: conexion.createdAt,
      fechaInicioTrabajo: conexion.fechaInicioTrabajo,
      fechaFinTrabajo: conexion.fechaFinTrabajo,
      calificacionPendiente: conexion.calificacionPendiente,
      profesional: conexion.profesional,
      cliente: conexion.cliente,
      mensajesNoLeidos: conexion.mensajes.filter(m => !m.leido && m.emisor !== req.user.id).length
    }));

    res.json({
      success: true,
      data: {
        conexiones: conexionesFormateadas,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener conexiones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/connections/:id
// @desc    Obtener detalles de una conexión específica
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const conexion = await Connection.findOne({
      where: {
        id,
        [Op.or]: [
          { clienteId: req.user.id },
          { profesionalId: req.user.id }
        ]
      },
      include: [
        {
          model: User,
          as: 'cliente',
          attributes: ['id', 'nombre', 'zona', 'telefono', 'email']
        },
        {
          model: User,
          as: 'profesional',
          attributes: ['id', 'nombre', 'zona', 'oficios', 'telefono', 'email', 'fotoPerfil']
        }
      ]
    });

    if (!conexion) {
      return res.status(404).json({
        success: false,
        message: 'Conexión no encontrada'
      });
    }

    // Marcar mensajes como leídos
    await conexion.marcarMensajesLeidos(req.user.id);

    const conexionDetallada = {
      id: conexion.id,
      numeroConexion: conexion.numeroConexion,
      estado: conexion.estado,
      descripcionTrabajo: conexion.descripcionTrabajo,
      ubicacionTrabajo: conexion.ubicacionTrabajo,
      urgente: conexion.urgente,
      presupuestoEstimado: conexion.presupuestoEstimado,
      pago: {
        requerido: conexion.pagoRequerido,
        completado: conexion.pagoCompletado,
        monto: conexion.montoComision,
        informacion: conexion.infoPago
      },
      fechas: {
        creacion: conexion.createdAt,
        inicioTrabajo: conexion.fechaInicioTrabajo,
        finTrabajo: conexion.fechaFinTrabajo
      },
      calificacionPendiente: conexion.calificacionPendiente,
      cliente: conexion.cliente,
      profesional: conexion.profesional,
      mensajes: conexion.mensajes,
      duracionTrabajo: conexion.getDuracionTrabajo(),
      requierePago: conexion.getRequierePago()
    };

    res.json({
      success: true,
      data: {
        conexion: conexionDetallada
      }
    });

  } catch (error) {
    console.error('Error al obtener conexión:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   PUT /api/connections/:id/status
// @desc    Actualizar estado de una conexión
// @access  Private
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, fechaInicioTrabajo, fechaFinTrabajo } = req.body;

    const estadosValidos = ['pendiente', 'aceptada', 'en_progreso', 'completada', 'cancelada'];
    
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    const conexion = await Connection.findOne({
      where: {
        id,
        [Op.or]: [
          { clienteId: req.user.id },
          { profesionalId: req.user.id }
        ]
      }
    });

    if (!conexion) {
      return res.status(404).json({
        success: false,
        message: 'Conexión no encontrada'
      });
    }

    // Validar permisos según el tipo de usuario y estado
    if (req.user.tipoUsuario === 'profesional') {
      // Los profesionales pueden aceptar, iniciar y completar trabajos
      if (!['aceptada', 'en_progreso', 'completada'].includes(estado)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para cambiar a este estado'
        });
      }
    } else if (req.user.tipoUsuario === 'cliente') {
      // Los clientes pueden cancelar o marcar como completado
      if (!['cancelada', 'completada'].includes(estado)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para cambiar a este estado'
        });
      }
    }

    // Actualizar datos
    const updateData = { estado };
    
    if (fechaInicioTrabajo) {
      updateData.fechaInicioTrabajo = new Date(fechaInicioTrabajo);
    }
    
    if (fechaFinTrabajo) {
      updateData.fechaFinTrabajo = new Date(fechaFinTrabajo);
    }

    if (estado === 'completada') {
      updateData.calificacionPendiente = true;
      if (!updateData.fechaFinTrabajo) {
        updateData.fechaFinTrabajo = new Date();
      }
    }

    await conexion.update(updateData);

    res.json({
      success: true,
      message: `Conexión ${estado} exitosamente`,
      data: {
        conexion: {
          id: conexion.id,
          estado: conexion.estado,
          fechaInicioTrabajo: conexion.fechaInicioTrabajo,
          fechaFinTrabajo: conexion.fechaFinTrabajo,
          calificacionPendiente: conexion.calificacionPendiente
        }
      }
    });

  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   POST /api/connections/:id/messages
// @desc    Enviar mensaje en una conexión
// @access  Private
router.post('/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { mensaje } = req.body;

    if (!mensaje || mensaje.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El mensaje no puede estar vacío'
      });
    }

    const conexion = await Connection.findOne({
      where: {
        id,
        [Op.or]: [
          { clienteId: req.user.id },
          { profesionalId: req.user.id }
        ]
      }
    });

    if (!conexion) {
      return res.status(404).json({
        success: false,
        message: 'Conexión no encontrada'
      });
    }

    await conexion.agregarMensaje(req.user.id, mensaje.trim());

    res.json({
      success: true,
      message: 'Mensaje enviado',
      data: {
        mensaje: {
          emisor: req.user.id,
          mensaje: mensaje.trim(),
          fecha: new Date(),
          leido: false
        }
      }
    });

  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   POST /api/connections/:id/payment
// @desc    Procesar pago para tercera conexión (simulado)
// @access  Private (Cliente)
router.post('/:id/payment', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { metodoPago, detallesPago } = req.body;

    if (req.user.tipoUsuario !== 'cliente') {
      return res.status(403).json({
        success: false,
        message: 'Solo los clientes pueden realizar pagos'
      });
    }

    const conexion = await Connection.findOne({
      where: {
        id,
        clienteId: req.user.id,
        pagoRequerido: true,
        pagoCompletado: false
      }
    });

    if (!conexion) {
      return res.status(404).json({
        success: false,
        message: 'Conexión no encontrada o no requiere pago'
      });
    }

    // Simular procesamiento de pago
    const infoPago = {
      metodoPago,
      detallesPago,
      fechaPago: new Date(),
      transaccionId: `TX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      monto: conexion.montoComision
    };

    await conexion.update({
      pagoCompletado: true,
      infoPago
    });

    res.json({
      success: true,
      message: 'Pago procesado exitosamente',
      data: {
        transaccion: {
          id: infoPago.transaccionId,
          monto: infoPago.monto,
          fecha: infoPago.fechaPago,
          estado: 'completado'
        }
      }
    });

  } catch (error) {
    console.error('Error al procesar pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/connections/stats
// @desc    Obtener estadísticas de conexiones del usuario
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const whereCondition = req.user.tipoUsuario === 'cliente' 
      ? { clienteId: req.user.id }
      : { profesionalId: req.user.id };

    const conexiones = await Connection.findAll({
      where: whereCondition,
      attributes: ['estado', 'pagoCompletado', 'createdAt']
    });

    const estadisticas = {
      total: conexiones.length,
      porEstado: {
        pendiente: conexiones.filter(c => c.estado === 'pendiente').length,
        aceptada: conexiones.filter(c => c.estado === 'aceptada').length,
        en_progreso: conexiones.filter(c => c.estado === 'en_progreso').length,
        completada: conexiones.filter(c => c.estado === 'completada').length,
        cancelada: conexiones.filter(c => c.estado === 'cancelada').length
      },
      pagosCompletados: conexiones.filter(c => c.pagoCompletado).length
    };

    // Estadísticas por mes (últimos 6 meses)
    const ahora = new Date();
    const seiseMesesAtras = new Date(ahora.getFullYear(), ahora.getMonth() - 6, 1);
    
    const conexionesRecientes = conexiones.filter(c => c.createdAt >= seiseMesesAtras);
    estadisticas.actividadReciente = conexionesRecientes.length;

    res.json({
      success: true,
      data: estadisticas
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;