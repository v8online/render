const express = require('express');
const router = express.Router();

// Datos de zonas de Córdoba
const zonasCordoba = {
  ciudades: [
    "Achiras", "Adelia María", "Agua de Oro", "Alta Gracia",
    "Altos de Chipión", "Anisacate", "Arroyito", "Bell Ville",
    "Colonia Caroya", "Cosquín", "Cruz del Eje", "Deán Funes",
    "Estación Juárez Celman", "General Cabrera", "General Deheza",
    "Jesús María", "Laboulaye", "Las Varillas", "Leones",
    "Malagueño", "Malvinas Argentinas", "Marcos Juárez",
    "Mendiolaza", "Mina Clavero", "Montecristo", "Morteros",
    "Oliva", "Oncativo", "Pilar", "Río Ceballos", "Río Cuarto",
    "Río Primero", "Río Segundo", "Río Tercero", "Saldán",
    "San Francisco", "Santa María de Punilla", "Santa Rosa de Calamuchita",
    "Tanti", "Unquillo", "Vicuña Mackenna", "Villa Allende",
    "Villa Carlos Paz", "Villa Dolores", "Villa General Belgrano",
    "Villa María", "Villa Nueva", "Villa de Soto",
    "Villa del Rosario", "Villa del Totoral"
  ],
  municipios: [
    "Achiras", "Adelia María", "Agua de Oro", "Altos de Chipión",
    "Anisacate", "Arias", "Arroyo Cabral", "Bialet Massé",
    "Calchín", "Camilo Aldao", "Carnerillo", "Cruz Alta",
    "Del Campillo", "Despeñaderos", "Devoto", "El Brete",
    "El Tío", "Etruria", "Falda del Carmen", "General Baldissera",
    "General Roca", "Guatimozín", "Huinca Renancó", "Laguna Larga",
    "Las Acequias", "Las Peñas", "Las Tapias", "Los Cerrillos",
    "Los Cóndores", "Los Surgentes", "Luyaba", "Mayu Sumaj",
    "Mi Granja", "Morteros", "Nicolás Bruzzone", "Noetinger",
    "Nono", "Obispo Trejo", "Ordóñez", "Pascanas",
    "Porteña", "Potrero de Garay", "Pozo del Molle", "Quilino",
    "Río Primero", "Sacanta", "Salsacate", "Salsipuedes",
    "San Carlos Minas", "San José", "San José de la Dormida",
    "San Lorenzo", "San Marcos Sierra", "San Marcos Sud",
    "San Pedro", "San Roque", "Santa Catalina Holmberg",
    "Santa Eufemia", "Saturnino María Laspiur", "Sebastián Elcano",
    "Serrezuela", "Sinsacate", "Tancacha", "Ticino",
    "Toledo", "Tránsito", "Ucacha", "Valle de Anisacate",
    "Valle Hermoso", "Viamonte", "Villa Allende", "Villa Ascasubi",
    "Villa Candelaria Norte", "Villa Cura Brochero", "Villa Giardino",
    "Villa Huidobro", "Villa Parque Santa Ana", "Villa Parque Síquiman",
    "Villa Rumipal", "Villa Río Icho Cruz", "Villa Santa Cruz del Lago",
    "Villa Sarmiento", "Villa Valeria", "Villa Yacanto",
    "Villa de las Rosas", "Villa del Dique", "Villa del Prado"
  ]
};

// Combinar todas las zonas y eliminar duplicados
const todasLasZonas = [...new Set([...zonasCordoba.ciudades, ...zonasCordoba.municipios])].sort();

// Funciones de utilidad
const esZonaValida = (zona) => todasLasZonas.includes(zona);

const buscarZonas = (termino) => {
  if (!termino) return todasLasZonas;
  const terminoLower = termino.toLowerCase();
  return todasLasZonas.filter(zona => 
    zona.toLowerCase().includes(terminoLower)
  );
};

const obtenerZonasPorTipo = (tipo) => {
  switch(tipo) {
    case 'ciudades':
      return zonasCordoba.ciudades.sort();
    case 'municipios':
      return zonasCordoba.municipios.sort();
    default:
      return todasLasZonas;
  }
};

// @route   GET /api/zonas
// @desc    Obtener todas las zonas de Córdoba
// @access  Public
router.get('/', (req, res) => {
  try {
    const { search, tipo } = req.query;
    
    let zonas;
    
    if (search) {
      zonas = buscarZonas(search);
    } else if (tipo) {
      zonas = obtenerZonasPorTipo(tipo);
    } else {
      zonas = todasLasZonas;
    }
    
    res.json({
      success: true,
      data: {
        zonas,
        total: zonas.length
      }
    });
  } catch (error) {
    console.error('Error al obtener zonas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/zonas/validate/:zona
// @desc    Validar si una zona existe
// @access  Public
router.get('/validate/:zona', (req, res) => {
  try {
    const { zona } = req.params;
    const esValida = esZonaValida(zona);
    
    res.json({
      success: true,
      data: {
        zona,
        valida: esValida
      }
    });
  } catch (error) {
    console.error('Error al validar zona:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/zonas/populares
// @desc    Obtener zonas más populares (simulado)
// @access  Public
router.get('/populares', (req, res) => {
  try {
    // Zonas más populares simuladas
    const zonasPopulares = [
      "Villa Carlos Paz",
      "Alta Gracia", 
      "Cosquín",
      "Río Cuarto",
      "Villa María",
      "Cruz del Eje",
      "Bell Ville",
      "Jesús María"
    ];
    
    res.json({
      success: true,
      data: {
        zonas: zonasPopulares,
        total: zonasPopulares.length
      }
    });
  } catch (error) {
    console.error('Error al obtener zonas populares:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/zonas/estadisticas
// @desc    Obtener estadísticas de zonas
// @access  Public
router.get('/estadisticas', (req, res) => {
  try {
    const estadisticas = {
      totalZonas: todasLasZonas.length,
      ciudades: obtenerZonasPorTipo('ciudades').length,
      municipios: obtenerZonasPorTipo('municipios').length,
      cobertura: "100% de la provincia de Córdoba"
    };
    
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