// Main application logic
class ConectaCordobaApp {
    constructor() {
        this.oficios = [];
        this.zonas = [];
        this.featuredProfessionals = [];
        this.recentReviews = [];
        this.init();
    }

    async init() {
        try {
            await this.loadInitialData();
            this.setupEventListeners();
            this.updateHomepageStats();
        } catch (error) {
            console.error('Error al inicializar la aplicación:', error);
        }
    }

    async loadInitialData() {
        try {
            // Load featured professionals
            const featuredResponse = await api.getFeaturedProfessionals();
            if (featuredResponse.success) {
                this.featuredProfessionals = featuredResponse.data.profesionales;
                this.renderFeaturedProfessionals();
            }

            // Load recent reviews
            const reviewsResponse = await api.getRecentReviews(6);
            if (reviewsResponse.success) {
                this.recentReviews = reviewsResponse.data.reviews;
                this.renderRecentReviews();
            }

            // Load oficios and zonas for search
            const oficiosResponse = await api.getOficios();
            if (oficiosResponse.success) {
                this.oficios = oficiosResponse.data.oficios;
                this.populateOficiosSelect();
            }

            const zonasResponse = await api.getZones();
            if (zonasResponse.success) {
                this.zonas = zonasResponse.data.zonas;
                this.populateZonasSelect();
            }

        } catch (error) {
            console.error('Error al cargar datos iniciales:', error);
        }
    }

    async updateHomepageStats() {
        try {
            const statsResponse = await api.getProfessionalStats();
            if (statsResponse.success) {
                const stats = statsResponse.data;
                
                const totalElement = document.getElementById('totalProfesionales');
                const promedioElement = document.getElementById('promedioCalificaciones');
                
                if (totalElement) {
                    totalElement.textContent = stats.total || '0';
                }
                
                if (promedioElement) {
                    promedioElement.textContent = stats.promedioCalificacionGeneral 
                        ? `${stats.promedioCalificacionGeneral}/5`
                        : '-';
                }
            }
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    }

    renderFeaturedProfessionals() {
        const container = document.getElementById('featuredProfessionals');
        if (!container) return;

        if (this.featuredProfessionals.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-muted">No hay profesionales destacados disponibles</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.featuredProfessionals.map(prof => `
            <div class="col-lg-3 col-md-6 mb-4">
                <div class="card professional-card h-100 shadow-sm">
                    <div class="card-body text-center">
                        <img src="${prof.fotoPerfil || '/images/default-avatar.png'}" 
                             class="professional-avatar mb-3" 
                             alt="${prof.nombre}">
                        <h5 class="card-title">${prof.nombre}</h5>
                        <p class="text-muted mb-2">
                            <i class="fas fa-map-marker-alt"></i> ${prof.zona}
                        </p>
                        <div class="mb-3">
                            ${prof.oficios.slice(0, 2).map(oficio => 
                                `<span class="badge badge-oficio">${oficio}</span>`
                            ).join('')}
                            ${prof.oficios.length > 2 ? 
                                `<span class="badge bg-secondary">+${prof.oficios.length - 2}</span>` : ''
                            }
                        </div>
                        <div class="rating-stars mb-3">
                            ${this.renderStars(prof.calificaciones.promedio)}
                            <small class="text-muted ms-2">
                                (${prof.calificaciones.total} reviews)
                            </small>
                        </div>
                        <button class="btn btn-primary btn-sm" 
                                onclick="viewProfessional('${prof.id}')">
                            Ver Perfil
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderRecentReviews() {
        const container = document.getElementById('recentReviews');
        if (!container) return;

        if (this.recentReviews.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-muted">No hay reseñas recientes disponibles</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.recentReviews.map(review => `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card review-card h-100 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <div class="review-avatar me-3">
                                ${review.cliente.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h6 class="mb-0">${review.cliente}</h6>
                                <small class="text-muted">
                                    ${this.formatDate(review.fecha)}
                                </small>
                            </div>
                        </div>
                        <div class="rating-stars mb-2">
                            ${this.renderStars(review.puntuacion)}
                        </div>
                        <p class="card-text">"${review.comentario}"</p>
                        <div class="border-top pt-2">
                            <small class="text-muted">
                                <strong>${review.profesional.nombre}</strong> - 
                                ${review.profesional.oficios.slice(0, 2).join(', ')}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    populateOficiosSelect() {
        const select = document.getElementById('searchOficio');
        if (!select) return;

        select.innerHTML = '<option value="">Todos los oficios</option>' + 
            this.oficios.map(oficio => 
                `<option value="${oficio}">${oficio}</option>`
            ).join('');
    }

    populateZonasSelect() {
        const select = document.getElementById('searchZona');
        if (!select) return;

        select.innerHTML = '<option value="">Todas las zonas</option>' + 
            this.zonas.map(zona => 
                `<option value="${zona}">${zona}</option>`
            ).join('');
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return [
            ...Array(fullStars).fill('<i class="fas fa-star"></i>'),
            ...(hasHalfStar ? ['<i class="fas fa-star-half-alt"></i>'] : []),
            ...Array(emptyStars).fill('<i class="far fa-star"></i>')
        ].join('');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    setupEventListeners() {
        // Search form
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.performSearch();
            });
        }
    }

    async performSearch() {
        const oficio = document.getElementById('searchOficio').value;
        const zona = document.getElementById('searchZona').value;
        const search = document.getElementById('searchText').value;

        const filters = {};
        if (oficio) filters.oficio = oficio;
        if (zona) filters.zona = zona;
        if (search) filters.search = search;

        try {
            const response = await api.searchProfessionals(filters);
            if (response.success) {
                this.renderSearchResults(response.data.profesionales);
            }
        } catch (error) {
            console.error('Error en búsqueda:', error);
            authManager.showToast('Error', 'Error al realizar la búsqueda', 'error');
        }
    }

    renderSearchResults(professionals) {
        const container = document.getElementById('searchResults');
        if (!container) return;

        if (professionals.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5>No se encontraron profesionales</h5>
                    <p class="text-muted">Intenta con otros criterios de búsqueda</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <h5 class="mb-3">Resultados de búsqueda (${professionals.length})</h5>
            ${professionals.map(prof => `
                <div class="card search-result-item mb-3">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-auto">
                                <img src="${prof.fotoPerfil || '/images/default-avatar.png'}" 
                                     class="professional-avatar" 
                                     alt="${prof.nombre}">
                            </div>
                            <div class="col">
                                <h6 class="mb-1">${prof.nombre}</h6>
                                <p class="text-muted mb-1">
                                    <i class="fas fa-map-marker-alt"></i> ${prof.zona}
                                </p>
                                <div class="mb-2">
                                    ${prof.oficios.slice(0, 3).map(oficio => 
                                        `<span class="badge bg-light text-dark me-1">${oficio}</span>`
                                    ).join('')}
                                </div>
                                <div class="rating-stars">
                                    ${this.renderStars(prof.calificaciones.promedio)}
                                    <small class="text-muted ms-2">
                                        (${prof.calificaciones.total} reviews)
                                    </small>
                                </div>
                            </div>
                            <div class="col-auto">
                                <button class="btn btn-primary btn-sm" 
                                        onclick="viewProfessional('${prof.id}')">
                                    Ver Perfil
                                </button>
                                ${authManager.isAuthenticated && authManager.currentUser.tipoUsuario === 'cliente' ? `
                                    <button class="btn btn-outline-primary btn-sm ms-2" 
                                            onclick="connectWithProfessional('${prof.id}')">
                                        Conectar
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        `;
    }
}

// Global functions
window.showBuscarProfesionales = function() {
    const modal = new bootstrap.Modal(document.getElementById('searchModal'));
    modal.show();
};

window.viewProfessional = function(professionalId) {
    // For now, just show an alert. In a full implementation, this would open a detailed view
    authManager.showToast('Información', 'Funcionalidad de vista detallada próximamente', 'info');
};

window.connectWithProfessional = function(professionalId) {
    if (!authManager.requireRole('cliente')) {
        return;
    }
    
    // For now, just show an alert. In a full implementation, this would open connection form
    authManager.showToast('Información', 'Funcionalidad de conexión próximamente', 'info');
};

window.showProfile = function() {
    if (!authManager.requireAuth()) {
        return;
    }
    
    authManager.showToast('Información', 'Funcionalidad de perfil próximamente', 'info');
};

window.showMyConnections = function() {
    if (!authManager.requireAuth()) {
        return;
    }
    
    authManager.showToast('Información', 'Funcionalidad de conexiones próximamente', 'info');
};

window.showMyReviews = function() {
    if (!authManager.requireRole('cliente')) {
        return;
    }
    
    authManager.showToast('Información', 'Funcionalidad de reviews próximamente', 'info');
};

window.showReceivedReviews = function() {
    if (!authManager.requireRole('profesional')) {
        return;
    }
    
    authManager.showToast('Información', 'Funcionalidad de reviews recibidas próximamente', 'info');
};

window.toggleAvailability = async function() {
    if (!authManager.requireRole('profesional')) {
        return;
    }
    
    try {
        const newStatus = !authManager.currentUser.disponible;
        const response = await api.updateAvailability(newStatus);
        
        if (response.success) {
            authManager.currentUser.disponible = newStatus;
            authManager.updateUI();
            authManager.showToast(
                'Estado Actualizado', 
                `Ahora estás ${newStatus ? 'disponible' : 'no disponible'} para nuevos trabajos`, 
                'success'
            );
        }
    } catch (error) {
        authManager.showToast('Error', 'No se pudo actualizar el estado', 'error');
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.conectaApp = new ConectaCordobaApp();
});