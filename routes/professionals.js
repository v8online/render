const express = require('express');
const { Op } = require('sequelize');
const { User, Review } = require('../config/database');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware de autenticación opcional
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'conecta-cordoba-secret-key-render');
      const user = await User.findByPk(decoded.userId);
      req.user = user;
    }
    
    next();
  } catch (error) {
    next(); // Continuar sin usuario autenticado
  }
};

// @route   GET /api/professionals
// @desc    Buscar profesionales con filtros
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      search,
      zona,
      oficio,
      calificacion,
      disponible,
      verificado,
      page = 1,
      limit = 20,
      sortBy = 'calificacion'
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Construir condiciones de búsqueda
    const whereConditions = {
      tipoUsuario: 'profesional',
      perfilCompleto: true
    };

    if (search) {
      whereConditions[Op.or] = [
        { nombre: { [Op.iLike]: `%${search}%` } },
        { descripcion: { [Op.iLike]: `%${search}%` } },
        { oficios: { [Op.contains]: [search] } }
      ];
    }

    if (zona) {
      whereConditions.zona = { [Op.iLike]: `%${zona}%` };
    }

    if (oficio) {
      whereConditions.oficios = { [Op.contains]: [oficio] };
    }

    if (calificacion) {
      whereConditions.promedioCalificaciones = { [Op.gte]: parseFloat(calificacion) };
    }

    if (disponible !== undefined) {
      whereConditions.disponible = disponible === 'true';
    }

    if (verificado !== undefined) {
      whereConditions.verificado = verificado === 'true';
    }

    // Configurar ordenamiento
    let orderBy = [['createdAt', 'DESC']];
    switch (sortBy) {
      case 'calificacion':
        orderBy = [['promedioCalificaciones', 'DESC'], ['totalReviews', 'DESC']];
        break;
      case 'reviews':
        orderBy = [['totalReviews', 'DESC'], ['promedioCalificaciones', 'DESC']];
        break;
      case 'reciente':
        orderBy = [['createdAt', 'DESC']];
        break;
      case 'alfabetico':
        orderBy = [['nombre', 'ASC']];
        break;
    }

    const { count, rows: profesionales } = await User.findAndCountAll({
      where: whereConditions,
      attributes: [
        'id', 'nombre', 'zona', 'oficios', 'descripcion', 'fotoPerfil',
        'promedioCalificaciones', 'totalReviews', 'distribucionEstrellas',
        'verificado', 'disponible', 'createdAt'
      ],
      order: orderBy,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Formatear respuesta
    const profesionalesFormateados = profesionales.map(prof => ({
      id: prof.id,
      nombre: prof.nombre,
      zona: prof.zona,
      oficios: prof.oficios,
      descripcion: prof.descripcion,
      fotoPerfil: prof.fotoPerfil,
      calificaciones: {
        promedio: prof.promedioCalificaciones,
        total: prof.totalReviews,
        distribucion: prof.distribucionEstrellas
      },
      verificado: prof.verificado,
      disponible: prof.disponible,
      miembroDesde: prof.createdAt
    }));

    res.json({
      success: true,
      data: {
        profesionales: profesionalesFormateados,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        },
        filters: {
          search,
          zona,
          oficio,
          calificacion,
          disponible,
          verificado,
          sortBy
        }
      }
    });

  } catch (error) {
    console.error('Error al buscar profesionales:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/professionals/:id
// @desc    Obtener perfil detallado de un profesional
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const profesional = await User.findOne({
      where: {
        id,
        tipoUsuario: 'profesional',
        perfilCompleto: true
      },
      attributes: [
        'id', 'nombre', 'email', 'telefono', 'zona', 'oficios', 
        'descripcion', 'fotoPerfil', 'promedioCalificaciones', 
        'totalReviews', 'distribucionEstrellas', 'verificado', 
        'disponible', 'createdAt', 'ultimoAcceso'
      ]
    });

    if (!profesional) {
      return res.status(404).json({
        success: false,
        message: 'Profesional no encontrado'
      });
    }

    // Obtener reviews recientes
    const reviews = await Review.findAll({
      where: {
        profesionalId: id,
        verificado: true
      },
      include: [{
        model: User,
        as: 'cliente',
        attributes: ['nombre']
      }],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    const profesionalDetallado = {
      id: profesional.id,
      nombre: profesional.nombre,
      contacto: {
        email: profesional.email,
        telefono: profesional.telefono
      },
      ubicacion: {
        zona: profesional.zona
      },
      servicios: {
        oficios: profesional.oficios,
        descripcion: profesional.descripcion
      },
      calificaciones: {
        promedio: profesional.promedioCalificaciones,
        total: profesional.totalReviews,
        distribucion: profesional.distribucionEstrellas
      },
      estado: {
        verificado: profesional.verificado,
        disponible: profesional.disponible
      },
      actividad: {
        miembroDesde: profesional.createdAt,
        ultimoAcceso: profesional.ultimoAcceso
      },
      fotoPerfil: profesional.fotoPerfil,
      reviews: reviews.map(review => ({
        id: review.id,
        puntuacion: review.puntuacion,
        comentario: review.comentario,
        fecha: review.createdAt,
        cliente: review.cliente?.nombre || 'Cliente anónimo',
        trabajoCompletado: review.trabajoCompletado,
        recomendaria: review.recomendaria
      }))
    };

    res.json({
      success: true,
      data: {
        profesional: profesionalDetallado
      }
    });

  } catch (error) {
    console.error('Error al obtener profesional:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/professionals/:id/reviews
// @desc    Obtener reviews de un profesional con paginación
// @access  Public
router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const profesional = await User.findOne({
      where: { id, tipoUsuario: 'profesional' }
    });

    if (!profesional) {
      return res.status(404).json({
        success: false,
        message: 'Profesional no encontrado'
      });
    }

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: {
        profesionalId: id,
        verificado: true
      },
      include: [{
        model: User,
        as: 'cliente',
        attributes: ['nombre']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const reviewsFormateadas = reviews.map(review => ({
      id: review.id,
      puntuacion: review.puntuacion,
      comentario: review.comentario,
      fecha: review.createdAt,
      cliente: review.cliente?.nombre || 'Cliente anónimo',
      trabajoCompletado: review.trabajoCompletado,
      recomendaria: review.recomendaria,
      aspectosPositivos: review.aspectosPositivos,
      aspectosMejorar: review.aspectosMejorar
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
        },
        resumenCalificaciones: {
          promedio: profesional.promedioCalificaciones,
          total: profesional.totalReviews,
          distribucion: profesional.distribucionEstrellas
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/professionals/featured
// @desc    Obtener profesionales destacados
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const profesionalesDestacados = await User.findAll({
      where: {
        tipoUsuario: 'profesional',
        verificado: true,
        disponible: true,
        perfilCompleto: true,
        promedioCalificaciones: { [Op.gte]: 4.0 },
        totalReviews: { [Op.gte]: 5 }
      },
      attributes: [
        'id', 'nombre', 'zona', 'oficios', 'fotoPerfil',
        'promedioCalificaciones', 'totalReviews', 'descripcion'
      ],
      order: [
        ['promedioCalificaciones', 'DESC'],
        ['totalReviews', 'DESC']
      ],
      limit: 8
    });

    const destacados = profesionalesDestacados.map(prof => ({
      id: prof.id,
      nombre: prof.nombre,
      zona: prof.zona,
      oficios: prof.oficios,
      fotoPerfil: prof.fotoPerfil,
      calificaciones: {
        promedio: prof.promedioCalificaciones,
        total: prof.totalReviews
      },
      descripcionCorta: prof.descripcion?.substring(0, 100) + '...'
    }));

    res.json({
      success: true,
      data: {
        profesionales: destacados
      }
    });

  } catch (error) {
    console.error('Error al obtener profesionales destacados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/professionals/stats
// @desc    Obtener estadísticas de profesionales
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const stats = await User.findAll({
      where: { tipoUsuario: 'profesional' },
      attributes: [
        'zona',
        'oficios',
        'verificado',
        'disponible',
        'promedioCalificaciones'
      ]
    });

    // Procesar estadísticas
    const estadisticas = {
      total: stats.length,
      verificados: stats.filter(p => p.verificado).length,
      disponibles: stats.filter(p => p.disponible).length,
      conCalificaciones: stats.filter(p => p.promedioCalificaciones > 0).length,
      zonasMasPopulares: {},
      oficiosMasOfrecidos: {},
      promedioCalificacionGeneral: 0
    };

    // Calcular zonas más populares
    stats.forEach(prof => {
      if (prof.zona) {
        estadisticas.zonasMasPopulares[prof.zona] = 
          (estadisticas.zonasMasPopulares[prof.zona] || 0) + 1;
      }
    });

    // Calcular oficios más ofrecidos
    stats.forEach(prof => {
      if (prof.oficios) {
        prof.oficios.forEach(oficio => {
          estadisticas.oficiosMasOfrecidos[oficio] = 
            (estadisticas.oficiosMasOfrecidos[oficio] || 0) + 1;
        });
      }
    });

    // Calcular promedio general
    const profesionalesConCalificacion = stats.filter(p => p.promedioCalificaciones > 0);
    if (profesionalesConCalificacion.length > 0) {
      const suma = profesionalesConCalificacion.reduce((acc, p) => acc + p.promedioCalificaciones, 0);
      estadisticas.promedioCalificacionGeneral = Number((suma / profesionalesConCalificacion.length).toFixed(1));
    }

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