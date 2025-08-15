const express = require('express');
const router = express.Router();

// Catálogo completo de oficios
const oficiosDisponibles = [
  // Construcción y Mantenimiento
  "Albañil", "Carpintero", "Plomero", "Electricista", "Gasista",
  "Cerrajero", "Pintor", "Soldador", "Herrero", "Vidriero",
  
  // Automotriz
  "Mecánico de autos", "Mecánico de motos", "Mecánico (general)",
  "Gomero (especialista en neumáticos)",
  
  // Alimentación
  "Panadero", "Carnicero", "Pescador", "Cocinero", "Repostero", "Quesero",
  
  // Servicios Personales
  "Estilista/Peluquero", "Depiladora", "Fotógrafo", "Guías de cabalgata", 
  "Guia Turistico", "Guia de Montaña",
  
  // Textil y Confección
  "Sastre", "Modista", "Zapatero", "Tapicero",
  
  // Jardinería y Exterior
  "Jardinero", "Auxiliar de jardinería",
  
  // Transporte
  "Chofer", "Camionero", "Cadete",
  
  // Técnico
  "Técnico electrónico", "Técnico en refrigeración", "Instalador de alarmas",
  "Montador de paneles solares", "Montador de cristales y vidrios",
  
  // Industrial
  "Maquinista", "Tornero", "Operador de fábrica", "Operario logístico",
  
  // Servicios Generales
  "Auxiliar de limpieza", "Sereno/Personal de seguridad", "limpieza de Piletas", 
  "Lavadero de Autos/Motos",
  
  // Administrativo
  "Cajero", "Auxiliar administrativo", "Auxiliar contable",
  
  // Salud
  "Auxiliar de enfermería", "Auxiliar de cocina",
  
  // Profesional
  "Abogado",
  
  // Agropecuario
  "Ganadero"
];

// Categorías de oficios para mejor organización
const categorias = {
  "Construcción y Mantenimiento": [
    "Albañil", "Carpintero", "Plomero", "Electricista", "Gasista",
    "Cerrajero", "Pintor", "Soldador", "Herrero", "Vidriero"
  ],
  "Automotriz": [
    "Mecánico de autos", "Mecánico de motos", "Mecánico (general)",
    "Gomero (especialista en neumáticos)"
  ],
  "Alimentación": [
    "Panadero", "Carnicero", "Pescador", "Cocinero", "Repostero", "Quesero"
  ],
  "Servicios Personales": [
    "Estilista/Peluquero", "Depiladora", "Fotógrafo", "Guías de cabalgata", 
    "Guia Turistico", "Guia de Montaña"
  ],
  "Textil y Confección": [
    "Sastre", "Modista", "Zapatero", "Tapicero"
  ],
  "Jardinería y Exterior": [
    "Jardinero", "Auxiliar de jardinería"
  ],
  "Transporte": [
    "Chofer", "Camionero", "Cadete"
  ],
  "Técnico": [
    "Técnico electrónico", "Técnico en refrigeración", "Instalador de alarmas",
    "Montador de paneles solares", "Montador de cristales y vidrios"
  ],
  "Industrial": [
    "Maquinista", "Tornero", "Operador de fábrica", "Operario logístico"
  ],
  "Servicios Generales": [
    "Auxiliar de limpieza", "Sereno/Personal de seguridad", "limpieza de Piletas", 
    "Lavadero de Autos/Motos"
  ],
  "Administrativo": [
    "Cajero", "Auxiliar administrativo", "Auxiliar contable"
  ],
  "Salud": [
    "Auxiliar de enfermería", "Auxiliar de cocina"
  ],
  "Profesional": [
    "Abogado"
  ],
  "Agropecuario": [
    "Ganadero"
  ]
};

// Funciones de utilidad
const esOficioValido = (oficio) => oficiosDisponibles.includes(oficio);

const buscarOficios = (termino) => {
  if (!termino) return oficiosDisponibles;
  const terminoLower = termino.toLowerCase();
  return oficiosDisponibles.filter(oficio => 
    oficio.toLowerCase().includes(terminoLower)
  );
};

const obtenerOficiosPorCategoria = (categoria) => categorias[categoria] || [];

const obtenerCategorias = () => Object.keys(categorias);

const obtenerCategoriaDeOficio = (oficio) => {
  for (const [categoria, oficios] of Object.entries(categorias)) {
    if (oficios.includes(oficio)) {
      return categoria;
    }
  }
  return null;
};

const obtenerOficiosRelacionados = (oficio) => {
  const categoria = obtenerCategoriaDeOficio(oficio);
  if (categoria) {
    return categorias[categoria].filter(o => o !== oficio);
  }
  return [];
};

// @route   GET /api/oficios
// @desc    Obtener todos los oficios disponibles
// @access  Public
router.get('/', (req, res) => {
  try {
    const { search, categoria } = req.query;
    
    let oficios;
    
    if (search) {
      oficios = buscarOficios(search);
    } else if (categoria) {
      oficios = obtenerOficiosPorCategoria(categoria);
    } else {
      oficios = oficiosDisponibles;
    }
    
    res.json({
      success: true,
      data: {
        oficios,
        total: oficios.length
      }
    });
  } catch (error) {
    console.error('Error al obtener oficios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/oficios/categorias
// @desc    Obtener todas las categorías de oficios
// @access  Public
router.get('/categorias', (req, res) => {
  try {
    const todasCategorias = obtenerCategorias();
    
    // Crear respuesta con detalles de cada categoría
    const categoriasDetalle = todasCategorias.map(categoria => ({
      nombre: categoria,
      oficios: obtenerOficiosPorCategoria(categoria),
      total: obtenerOficiosPorCategoria(categoria).length
    }));
    
    res.json({
      success: true,
      data: {
        categorias: categoriasDetalle,
        totalCategorias: todasCategorias.length,
        totalOficios: oficiosDisponibles.length
      }
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/oficios/populares
// @desc    Obtener oficios más demandados (simulado)
// @access  Public
router.get('/populares', (req, res) => {
  try {
    // Oficios más demandados simulados basados en datos argentinos
    const oficiosPopulares = [
      "Plomero",
      "Electricista", 
      "Albañil",
      "Mecánico de autos",
      "Jardinero",
      "Pintor",
      "Carpintero",
      "Auxiliar de limpieza"
    ];
    
    res.json({
      success: true,
      data: {
        oficios: oficiosPopulares,
        total: oficiosPopulares.length
      }
    });
  } catch (error) {
    console.error('Error al obtener oficios populares:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;