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

// Validaciones para crear review
const validacionCrearReview = [
  body('conexionId')
    .isUUID()
    .withMessage('ID de conexión inválido'),
  body('puntuacion')
    .isInt({ min: 1, max: 5 })
    .withMessage('La puntuación debe ser entre 1 y 5'),
  body('comentario')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('El comentario debe tener entre 10 y 500 caracteres'),
  body('trabajoCompletado')
    .optional()
    .isBoolean()
    .withMessage('Trabajo completado debe ser verdadero o falso'),
  body('recomendaria')
    .optional()
    .isBoolean()
    .withMessage('Recomendaría debe ser verdadero o falso'),
  body('aspectosPositivos')
    .optional()
    .isArray()
    .withMessage('Aspectos positivos debe ser un array'),
  body('aspectosMejorar')
    .optional()
    .isArray()
    .withMessage('Aspectos a mejorar debe ser un array')
];

// @route   POST /api/reviews
// @desc    Crear una nueva review
// @access  Private (Cliente)
router.post('/', authenticateToken, validacionCrearReview, async (req, res) => {
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
        message: 'Solo los clientes pueden crear reviews'
      });
    }

    const {
      conexionId,
      puntuacion,
      comentario,
      trabajoCompletado = true,
      recomendaria,
      aspectosPositivos = [],
      aspectosMejorar = []
    } = req.body;

    // Verificar que la conexión existe y pertenece al cliente
    const conexion = await Connection.findOne({
      where: {
        id: conexionId,
        clienteId: req.user.id,
        estado: 'completada',
        calificacionPendiente: true
      },
      include: [{
        model: User,
        as: 'profesional',
        attributes: ['id', 'nombre']
      }]
    });

    if (!conexion) {
      return res.status(404).json({
        success: false,
        message: 'Conexión no encontrada o no elegible para calificar'
      });
    }

    // Verificar que no existe ya una review para esta conexión
    const reviewExistente = await Review.findOne({
      where: { conexionId }
    });

    if (reviewExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una calificación para esta conexión'
      });
    }

    // Crear la review
    const nuevaReview = await Review.create({
      profesionalId: conexion.profesionalId,
      clienteId: req.user.id,
      conexionId,
      puntuacion,
      comentario: comentario.trim(),
      trabajoCompletado,
      recomendaria,
      aspectosPositivos,
      aspectosMejorar,
      verificado: true // Las reviews de conexiones completadas son automáticamente verificadas
    });

    // La actualización de calificaciones del profesional se maneja en el hook del modelo

    res.status(201).json({
      success: true,
      message: 'Calificación creada exitosamente',
      data: {
        review: {
          id: nuevaReview.id,
          puntuacion: nuevaReview.puntuacion,
          comentario: nuevaReview.comentario,
          trabajoCompletado: nuevaReview.trabajoCompletado,
          recomendaria: nuevaReview.recomendaria,
          fecha: nuevaReview.createdAt,
          profesional: conexion.profesional
        }
      }
    });

  } catch (error) {
    console.error('Error al crear review:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/reviews/my-reviews
// @desc    Obtener reviews creadas por el usuario (cliente)
// @access  Private
router.get('/my-reviews', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipoUsuario !== 'cliente') {
      return res.status(403).json({
        success: false,
        message: 'Solo los clientes pueden ver sus reviews'
      });
    }

    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { clienteId: req.user.id },
      include: [
        {
          model: User,
          as: 'profesional',
          attributes: ['id', 'nombre', 'zona', 'oficios', 'fotoPerfil']
        },
        {
          model: Connection,
          as: 'conexion',
          attributes: ['id', 'descripcionTrabajo', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const reviewsFormateadas = reviews.map(review => ({
      id: review.id,
      puntuacion: review.puntuacion,
      comentario: review.comentario,
      trabajoCompletado: review.trabajoCompletado,
      recomendaria: review.recomendaria,
      aspectosPositivos: review.aspectosPositivos,
      aspectosMejorar: review.aspectosMejorar,
      fecha: review.createdAt,
      profesional: review.profesional,
      conexion: review.conexion
    }));

    res.json({
      success: true,
      data: {
        reviews: reviewsFormateadas,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener mis reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/reviews/received
// @desc    Obtener reviews recibidas por el profesional
// @access  Private
router.get('/received', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipoUsuario !== 'profesional') {
      return res.status(403).json({
        success: false,
        message: 'Solo los profesionales pueden ver reviews recibidas'
      });
    }

    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { 
        profesionalId: req.user.id,
        verificado: true 
      },
      include: [
        {
          model: User,
          as: 'cliente',
          attributes: ['id', 'nombre']
        },
        {
          model: Connection,
          as: 'conexion',
          attributes: ['id', 'descripcionTrabajo', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const reviewsFormateadas = reviews.map(review => ({
      id: review.id,
      puntuacion: review.puntuacion,
      comentario: review.comentario,
      trabajoCompletado: review.trabajoCompletado,
      recomendaria: review.recomendaria,
      aspectosPositivos: review.aspectosPositivos,
      aspectosMejorar: review.aspectosMejorar,
      fecha: review.createdAt,
      cliente: review.cliente?.nombre || 'Cliente anónimo',
      conexion: review.conexion
    }));

    // Obtener estadísticas de calificaciones
    const estadisticas = {
      promedio: req.user.promedioCalificaciones,
      total: req.user.totalReviews,
      distribucion: req.user.distribucionEstrellas
    };

    res.json({
      success: true,
      data: {
        reviews: reviewsFormateadas,
        estadisticas,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener reviews recibidas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/reviews/pending
// @desc    Obtener conexiones pendientes de calificar
// @access  Private (Cliente)
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipoUsuario !== 'cliente') {
      return res.status(403).json({
        success: false,
        message: 'Solo los clientes pueden ver calificaciones pendientes'
      });
    }

    const conexionesPendientes = await Connection.findAll({
      where: {
        clienteId: req.user.id,
        estado: 'completada',
        calificacionPendiente: true
      },
      include: [
        {
          model: User,
          as: 'profesional',
          attributes: ['id', 'nombre', 'zona', 'oficios', 'fotoPerfil']
        }
      ],
      order: [['fechaFinTrabajo', 'DESC']]
    });

    // Filtrar solo las que no tienen review
    const conexionesSinReview = [];
    for (const conexion of conexionesPendientes) {
      const reviewExistente = await Review.findOne({
        where: { conexionId: conexion.id }
      });
      
      if (!reviewExistente) {
        conexionesSinReview.push({
          id: conexion.id,
          descripcionTrabajo: conexion.descripcionTrabajo,
          fechaFinTrabajo: conexion.fechaFinTrabajo,
          profesional: conexion.profesional
        });
      }
    }

    res.json({
      success: true,
      data: {
        conexionesPendientes: conexionesSinReview,
        total: conexionesSinReview.length
      }
    });

  } catch (error) {
    console.error('Error al obtener calificaciones pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Actualizar una review existente
// @access  Private (Cliente que creó la review)
router.put('/:id', authenticateToken, validacionCrearReview, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const {
      puntuacion,
      comentario,
      trabajoCompletado,
      recomendaria,
      aspectosPositivos,
      aspectosMejorar
    } = req.body;

    // Buscar la review
    const review = await Review.findOne({
      where: {
        id,
        clienteId: req.user.id
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review no encontrada'
      });
    }

    // Verificar que la review no sea muy antigua (ej: max 30 días)
    const diasDesdeCreacion = Math.floor((new Date() - review.createdAt) / (1000 * 60 * 60 * 24));
    if (diasDesdeCreacion > 30) {
      return res.status(403).json({
        success: false,
        message: 'No se pueden editar reviews después de 30 días'
      });
    }

    // Actualizar la review
    await review.update({
      puntuacion,
      comentario: comentario.trim(),
      trabajoCompletado,
      recomendaria,
      aspectosPositivos,
      aspectosMejorar
    });

    res.json({
      success: true,
      message: 'Review actualizada exitosamente',
      data: {
        review: {
          id: review.id,
          puntuacion: review.puntuacion,
          comentario: review.comentario,
          trabajoCompletado: review.trabajoCompletado,
          recomendaria: review.recomendaria,
          aspectosPositivos: review.aspectosPositivos,
          aspectosMejorar: review.aspectosMejorar,
          fechaActualizacion: review.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Error al actualizar review:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Eliminar una review (solo administradores o casos especiales)
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findOne({
      where: {
        id,
        clienteId: req.user.id
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review no encontrada'
      });
    }

    // Solo permitir eliminación en circunstancias especiales
    const diasDesdeCreacion = Math.floor((new Date() - review.createdAt) / (1000 * 60 * 60 * 24));
    if (diasDesdeCreacion > 7) {
      return res.status(403).json({
        success: false,
        message: 'No se pueden eliminar reviews después de 7 días'
      });
    }

    await review.destroy();

    res.json({
      success: true,
      message: 'Review eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar review:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/reviews/recent
// @desc    Obtener reviews recientes de la plataforma
// @access  Public
router.get('/recent', async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const reviewsRecientes = await Review.findAll({
      where: { 
        verificado: true,
        puntuacion: { [Op.gte]: 4 } // Solo mostrar reviews positivas públicamente
      },
      include: [
        {
          model: User,
          as: 'profesional',
          attributes: ['id', 'nombre', 'zona', 'oficios']
        },
        {
          model: User,
          as: 'cliente',
          attributes: ['nombre']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    const reviewsFormateadas = reviewsRecientes.map(review => ({
      id: review.id,
      puntuacion: review.puntuacion,
      comentario: review.comentario.length > 150 
        ? review.comentario.substring(0, 150) + '...'
        : review.comentario,
      fecha: review.createdAt,
      profesional: {
        nombre: review.profesional.nombre,
        zona: review.profesional.zona,
        oficios: review.profesional.oficios.slice(0, 2) // Mostrar solo primeros 2 oficios
      },
      cliente: review.cliente?.nombre || 'Cliente verificado'
    }));

    res.json({
      success: true,
      data: {
        reviews: reviewsFormateadas
      }
    });

  } catch (error) {
    console.error('Error al obtener reviews recientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/reviews/stats
// @desc    Obtener estadísticas generales de reviews
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const totalReviews = await Review.count({ where: { verificado: true } });
    
    const promedioGeneral = await Review.findAll({
      where: { verificado: true },
      attributes: ['puntuacion']
    });

    let suma = 0;
    const distribucion = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    promedioGeneral.forEach(review => {
      suma += review.puntuacion;
      distribucion[review.puntuacion]++;
    });

    const promedio = totalReviews > 0 ? Number((suma / totalReviews).toFixed(1)) : 0;
    
    const porcentajeRecomendacion = await Review.count({
      where: { 
        verificado: true,
        recomendaria: true 
      }
    });

    const estadisticas = {
      totalReviews,
      promedioGeneral: promedio,
      distribucionEstrellas: distribucion,
      porcentajeRecomendacion: totalReviews > 0 
        ? Math.round((porcentajeRecomendacion / totalReviews) * 100)
        : 0,
      reviewsEstesMes: await Review.count({
        where: {
          verificado: true,
          createdAt: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    };

    res.json({
      success: true,
      data: estadisticas
    });

  } catch (error) {
    console.error('Error al obtener estadísticas de reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;