const express = require('express');
const { body, validationResult } = require('express-validator');
const { User } = require('../config/database');
const jwt = require('jsonwebtoken');

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

// Validaciones para actualizar perfil
const validacionActualizarPerfil = [
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('telefono')
    .optional()
    .isMobilePhone('es-AR')
    .withMessage('Número de teléfono inválido'),
  body('zona')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Zona inválida'),
  body('oficios')
    .optional()
    .isArray()
    .withMessage('Oficios debe ser un array'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres')
];

// @route   GET /api/users/profile
// @desc    Obtener perfil del usuario actual
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userResponse = {
      id: req.user.id,
      email: req.user.email,
      tipoUsuario: req.user.tipoUsuario,
      emailVerificado: req.user.emailVerificado,
      perfilCompleto: req.user.perfilCompleto,
      fechaRegistro: req.user.createdAt,
      ultimoAcceso: req.user.ultimoAcceso,
      perfil: {
        nombre: req.user.nombre,
        telefono: req.user.telefono,
        fotoPerfil: req.user.fotoPerfil,
        zona: req.user.zona,
        oficios: req.user.oficios,
        descripcion: req.user.descripcion,
        promedioCalificaciones: req.user.promedioCalificaciones,
        totalReviews: req.user.totalReviews,
        distribucionEstrellas: req.user.distribucionEstrellas,
        verificado: req.user.verificado,
        disponible: req.user.disponible,
        configuracion: req.user.configuracion
      }
    };

    res.json({
      success: true,
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Actualizar perfil del usuario
// @access  Private
router.put('/profile', authenticateToken, validacionActualizarPerfil, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { nombre, telefono, zona, oficios, descripcion } = req.body;
    
    // Preparar datos para actualizar
    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (zona !== undefined) updateData.zona = zona;
    if (oficios !== undefined) updateData.oficios = oficios;
    if (descripcion !== undefined) updateData.descripcion = descripcion;

    // Verificar si el perfil está completo
    const perfilCompleto = !!(
      (nombre || req.user.nombre) &&
      (telefono || req.user.telefono) &&
      (zona || req.user.zona) &&
      ((oficios && oficios.length > 0) || (req.user.oficios && req.user.oficios.length > 0))
    );

    updateData.perfilCompleto = perfilCompleto;

    await req.user.update(updateData);

    const userResponse = {
      id: req.user.id,
      email: req.user.email,
      tipoUsuario: req.user.tipoUsuario,
      emailVerificado: req.user.emailVerificado,
      perfilCompleto: req.user.perfilCompleto,
      perfil: {
        nombre: req.user.nombre,
        telefono: req.user.telefono,
        zona: req.user.zona,
        oficios: req.user.oficios,
        descripcion: req.user.descripcion
      }
    };

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: {
        user: userResponse
      }
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   POST /api/users/upload-photo
// @desc    Subir foto de perfil (simulado)
// @access  Private
router.post('/upload-photo', authenticateToken, async (req, res) => {
  try {
    // Simular subida de foto
    const fotoUrl = `https://api.conectacordoba.com/uploads/profile_${req.user.id}_${Date.now()}.jpg`;
    
    await req.user.update({ fotoPerfil: fotoUrl });

    res.json({
      success: true,
      message: 'Foto de perfil actualizada',
      data: {
        fotoPerfil: fotoUrl
      }
    });
  } catch (error) {
    console.error('Error al subir foto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   PUT /api/users/availability
// @desc    Cambiar disponibilidad del profesional
// @access  Private
router.put('/availability', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipoUsuario !== 'profesional') {
      return res.status(403).json({
        success: false,
        message: 'Solo los profesionales pueden cambiar su disponibilidad'
      });
    }

    const { disponible } = req.body;
    
    await req.user.update({ disponible: Boolean(disponible) });

    res.json({
      success: true,
      message: `Estado cambiado a ${req.user.disponible ? 'disponible' : 'no disponible'}`,
      data: {
        disponible: req.user.disponible
      }
    });
  } catch (error) {
    console.error('Error al cambiar disponibilidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   PUT /api/users/settings
// @desc    Actualizar configuración del usuario
// @access  Private
router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const { configuracion } = req.body;
    
    // Mergear configuración existente con nueva
    const nuevaConfiguracion = {
      ...req.user.configuracion,
      ...configuracion
    };

    await req.user.update({ configuracion: nuevaConfiguracion });

    res.json({
      success: true,
      message: 'Configuración actualizada',
      data: {
        configuracion: nuevaConfiguracion
      }
    });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Eliminar cuenta de usuario
// @access  Private
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    await req.user.destroy();

    res.json({
      success: true,
      message: 'Cuenta eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;