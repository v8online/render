// Authentication management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.initializeAuth();
    }

    async initializeAuth() {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const response = await api.getCurrentUser();
                if (response.success) {
                    this.currentUser = response.data.user;
                    this.isAuthenticated = true;
                    this.updateUI();
                } else {
                    this.logout();
                }
            } catch (error) {
                console.error('Error al verificar autenticación:', error);
                this.logout();
            }
        }
        this.updateUI();
    }

    async login(email, password) {
        try {
            const response = await api.login(email, password);
            if (response.success) {
                this.currentUser = response.data.user;
                this.isAuthenticated = true;
                this.updateUI();
                this.hideLoginModal();
                this.showToast('¡Bienvenido!', 'Has iniciado sesión correctamente', 'success');
                return { success: true };
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            this.showToast('Error', error.message, 'error');
            return { success: false, message: error.message };
        }
    }

    async register(email, password, tipoUsuario) {
        try {
            const response = await api.register(email, password, tipoUsuario);
            if (response.success) {
                this.currentUser = response.data.user;
                this.isAuthenticated = true;
                this.updateUI();
                this.hideRegisterModal();
                this.showToast('¡Registro Exitoso!', 'Tu cuenta ha sido creada correctamente', 'success');
                return { success: true };
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            this.showToast('Error en Registro', error.message, 'error');
            return { success: false, message: error.message };
        }
    }

    logout() {
        api.logout();
        this.currentUser = null;
        this.isAuthenticated = false;
        this.updateUI();
        this.showToast('Sesión Cerrada', 'Has cerrado sesión correctamente', 'info');
    }

    updateUI() {
        const navbarButtons = document.getElementById('navbarButtons');
        
        if (this.isAuthenticated && this.currentUser) {
            // User is logged in
            navbarButtons.innerHTML = `
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" 
                       data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fas fa-user-circle"></i> ${this.currentUser.email}
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><h6 class="dropdown-header">
                            <i class="fas fa-${this.currentUser.tipoUsuario === 'profesional' ? 'tools' : 'user'}"></i>
                            ${this.currentUser.tipoUsuario === 'profesional' ? 'Profesional' : 'Cliente'}
                        </h6></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" onclick="showProfile()">
                            <i class="fas fa-user"></i> Mi Perfil
                        </a></li>
                        ${this.currentUser.tipoUsuario === 'cliente' ? `
                            <li><a class="dropdown-item" href="#" onclick="showMyConnections()">
                                <i class="fas fa-handshake"></i> Mis Conexiones
                            </a></li>
                            <li><a class="dropdown-item" href="#" onclick="showMyReviews()">
                                <i class="fas fa-star"></i> Mis Calificaciones
                            </a></li>
                        ` : `
                            <li><a class="dropdown-item" href="#" onclick="showMyConnections()">
                                <i class="fas fa-briefcase"></i> Mis Trabajos
                            </a></li>
                            <li><a class="dropdown-item" href="#" onclick="showReceivedReviews()">
                                <i class="fas fa-star"></i> Calificaciones Recibidas
                            </a></li>
                            <li><a class="dropdown-item" href="#" onclick="toggleAvailability()">
                                <i class="fas fa-${this.currentUser.disponible ? 'pause' : 'play'}"></i> 
                                ${this.currentUser.disponible ? 'Marcar No Disponible' : 'Marcar Disponible'}
                            </a></li>
                        `}
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" onclick="authManager.logout()">
                            <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                        </a></li>
                    </ul>
                </li>
            `;
        } else {
            // User is not logged in
            navbarButtons.innerHTML = `
                <li class="nav-item">
                    <button class="btn btn-outline-light me-2" onclick="showLoginModal()">
                        <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                    </button>
                </li>
                <li class="nav-item">
                    <button class="btn btn-light" onclick="showRegisterModal('cliente')">
                        <i class="fas fa-user-plus"></i> Registrarse
                    </button>
                </li>
            `;
        }
    }

    showLoginModal() {
        const modal = new bootstrap.Modal(document.getElementById('loginModal'));
        modal.show();
    }

    hideLoginModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        if (modal) {
            modal.hide();
        }
    }

    showRegisterModal(tipoUsuario = 'cliente') {
        document.getElementById('tipoUsuario').value = tipoUsuario;
        document.getElementById('registerModalTitle').textContent = 
            tipoUsuario === 'profesional' ? 'Registro de Profesional' : 'Registro de Cliente';
        
        const modal = new bootstrap.Modal(document.getElementById('registerModal'));
        modal.show();
    }

    hideRegisterModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
        if (modal) {
            modal.hide();
        }
    }

    showToast(title, message, type = 'info') {
        const toast = document.getElementById('alertToast');
        const toastTitle = document.getElementById('toastTitle');
        const toastMessage = document.getElementById('toastMessage');
        const toastHeader = toast.querySelector('.toast-header');
        
        // Set content
        toastTitle.textContent = title;
        toastMessage.textContent = message;
        
        // Set color based on type
        toastHeader.className = 'toast-header';
        switch (type) {
            case 'success':
                toastHeader.classList.add('bg-success', 'text-white');
                break;
            case 'error':
                toastHeader.classList.add('bg-danger', 'text-white');
                break;
            case 'warning':
                toastHeader.classList.add('bg-warning', 'text-dark');
                break;
            default:
                toastHeader.classList.add('bg-primary', 'text-white');
        }
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }

    // Check if user is authenticated
    requireAuth() {
        if (!this.isAuthenticated) {
            this.showToast('Acceso Requerido', 'Debes iniciar sesión para acceder a esta función', 'warning');
            this.showLoginModal();
            return false;
        }
        return true;
    }

    // Check if user has specific role
    requireRole(role) {
        if (!this.requireAuth()) {
            return false;
        }
        
        if (this.currentUser.tipoUsuario !== role) {
            this.showToast('Acceso Denegado', `Esta función es solo para ${role}s`, 'error');
            return false;
        }
        return true;
    }
}

// Initialize authentication manager
const authManager = new AuthManager();

// Event listeners for forms
document.addEventListener('DOMContentLoaded', function() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            if (!email || !password) {
                authManager.showToast('Error', 'Por favor completa todos los campos', 'error');
                return;
            }
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Iniciando...';
            
            try {
                await authManager.login(email, password);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const tipoUsuario = document.getElementById('tipoUsuario').value;
            
            if (!email || !password || !confirmPassword) {
                authManager.showToast('Error', 'Por favor completa todos los campos', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                authManager.showToast('Error', 'Las contraseñas no coinciden', 'error');
                return;
            }
            
            if (password.length < 6) {
                authManager.showToast('Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
                return;
            }
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Registrando...';
            
            try {
                await authManager.register(email, password, tipoUsuario);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
});

// Global functions for UI interaction
window.showLoginModal = () => authManager.showLoginModal();
window.showRegisterModal = (tipoUsuario) => authManager.showRegisterModal(tipoUsuario);

// Export auth manager
window.authManager = authManager;