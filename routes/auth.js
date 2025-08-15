const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../config/database');

const router = express.Router();

// Generar JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'conecta-cordoba-secret-key-render',
    { expiresIn: '7d' }
  );
};

// Validaciones para registro
const validacionRegistro = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('tipoUsuario')
    .isIn(['cliente', 'profesional'])
    .withMessage('Tipo de usuario debe ser cliente o profesional')
];

// Validaciones para login
const validacionLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .notEmpty()
    .withMessage('Contraseña requerida')
];

// @route   POST /api/auth/register
// @desc    Registro de usuario simplificado
// @access  Public
router.post('/register', validacionRegistro, async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { email, password, tipoUsuario } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Crear nuevo usuario (registro simplificado)
    const newUser = await User.create({
      email,
      password,
      tipoUsuario: tipoUsuario.toLowerCase(),
      emailVerificado: false,
      perfilCompleto: false
    });

    // Generar token
    const token = generateToken(newUser.id);

    // Respuesta sin incluir password
    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      tipoUsuario: newUser.tipoUsuario,
      emailVerificado: newUser.emailVerificado,
      perfilCompleto: newUser.perfilCompleto,
      fechaRegistro: newUser.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login de usuario
// @access  Public
router.post('/login', validacionLogin, async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Buscar usuario
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Actualizar último acceso
    await user.actualizarUltimoAcceso();

    // Generar token
    const token = generateToken(user.id);

    // Respuesta sin incluir password
    const userResponse = {
      id: user.id,
      email: user.email,
      tipoUsuario: user.tipoUsuario,
      emailVerificado: user.emailVerificado,
      perfilCompleto: user.perfilCompleto,
      fechaRegistro: user.createdAt,
      perfil: {
        nombre: user.nombre,
        telefono: user.telefono,
        fotoPerfil: user.fotoPerfil,
        zona: user.zona,
        oficios: user.oficios,
        promedioCalificaciones: user.promedioCalificaciones,
        totalReviews: user.totalReviews
      }
    };

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Obtener usuario actual
// @access  Private
router.get('/me', async (req, res) => {
  try {
    // Obtener token del header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, autorización denegada'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'conecta-cordoba-secret-key-render');
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    // Respuesta sin password
    const userResponse = {
      id: user.id,
      email: user.email,
      tipoUsuario: user.tipoUsuario,
      emailVerificado: user.emailVerificado,
      perfilCompleto: user.perfilCompleto,
      fechaRegistro: user.createdAt,
      perfil: {
        nombre: user.nombre,
        telefono: user.telefono,
        fotoPerfil: user.fotoPerfil,
        zona: user.zona,
        oficios: user.oficios,
        promedioCalificaciones: user.promedioCalificaciones,
        totalReviews: user.totalReviews
      }
    };

    res.json({
      success: true,
      data: {
        user: userResponse
      }
    });

  } catch (error) {
    console.error('Error en auth/me:', error);
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
});

// @route   POST /api/auth/verify-email
// @desc    Verificar email (simulado)
// @access  Private
router.post('/verify-email', async (req, res) => {
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
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Simular verificación de email
    await user.update({ emailVerificado: true });

    res.json({
      success: true,
      message: 'Email verificado exitosamente'
    });

  } catch (error) {
    console.error('Error en verificación de email:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;