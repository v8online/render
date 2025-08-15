#!/usr/bin/env node

/**
 * Database Setup Script for Render.com
 * 
 * This script handles:
 * 1. Database connection testing
 * 2. Table creation (migrations)
 * 3. Initial data seeding
 * 4. Database health checks
 */

const { Sequelize } = require('sequelize');
const { sequelize, User, Connection, Review } = require('../config/database');

// Logging utility
const log = (message, level = 'info') => {
    const timestamp = new Date().toISOString();
    const levels = {
        info: '📘',
        success: '✅',
        warning: '⚠️',
        error: '❌'
    };
    console.log(`${levels[level]} [${timestamp}] ${message}`);
};

// Test database connection
async function testConnection() {
    try {
        log('Testing database connection...');
        await sequelize.authenticate();
        log('Database connection established successfully', 'success');
        return true;
    } catch (error) {
        log(`Database connection failed: ${error.message}`, 'error');
        return false;
    }
}

// Create all tables
async function createTables() {
    try {
        log('Creating database tables...');
        
        // Sync all models (create tables)
        await sequelize.sync({ force: false, alter: true });
        
        log('All tables created successfully', 'success');
        return true;
    } catch (error) {
        log(`Table creation failed: ${error.message}`, 'error');
        return false;
    }
}

// Seed initial data
async function seedInitialData() {
    try {
        log('Checking for initial data...');
        
        // Check if we already have users
        const userCount = await User.count();
        
        if (userCount > 0) {
            log(`Database already has ${userCount} users, skipping seed`, 'info');
            return true;
        }
        
        log('Seeding initial data...');
        
        // Create sample users
        const sampleUsers = [
            {
                email: 'cliente1@ejemplo.com',
                password: 'password123',
                tipoUsuario: 'cliente',
                nombre: 'Juan Cliente',
                telefono: '+54 351 123-4567',
                zona: 'Córdoba Capital',
                emailVerificado: true,
                perfilCompleto: true
            },
            {
                email: 'profesional1@ejemplo.com',
                password: 'password123',
                tipoUsuario: 'profesional',
                nombre: 'María Profesional',
                telefono: '+54 351 987-6543',
                zona: 'Villa Carlos Paz',
                oficios: ['Plomero', 'Gasista'],
                descripcion: 'Profesional con 10 años de experiencia en plomería y gas',
                emailVerificado: true,
                perfilCompleto: true,
                verificado: true,
                disponible: true
            },
            {
                email: 'profesional2@ejemplo.com',
                password: 'password123',
                tipoUsuario: 'profesional',
                nombre: 'Carlos Electricista',
                telefono: '+54 351 555-1234',
                zona: 'Alta Gracia',
                oficios: ['Electricista', 'Instalador de alarmas'],
                descripcion: 'Especialista en instalaciones eléctricas residenciales y comerciales',
                emailVerificado: true,
                perfilCompleto: true,
                verificado: true,
                disponible: true
            }
        ];
        
        for (const userData of sampleUsers) {
            await User.create(userData);
            log(`Created user: ${userData.email}`, 'success');
        }
        
        log('Initial data seeded successfully', 'success');
        return true;
        
    } catch (error) {
        log(`Data seeding failed: ${error.message}`, 'error');
        return false;
    }
}

// Database health check
async function healthCheck() {
    try {
        log('Performing database health check...');
        
        // Test basic queries
        const userCount = await User.count();
        const connectionCount = await Connection.count();
        const reviewCount = await Review.count();
        
        log(`Health check results:`, 'info');
        log(`  Users: ${userCount}`, 'info');
        log(`  Connections: ${connectionCount}`, 'info');
        log(`  Reviews: ${reviewCount}`, 'info');
        
        // Test a more complex query
        const professionals = await User.count({
            where: { tipoUsuario: 'profesional' }
        });
        
        log(`  Professionals: ${professionals}`, 'info');
        log('Database health check completed', 'success');
        
        return true;
    } catch (error) {
        log(`Health check failed: ${error.message}`, 'error');
        return false;
    }
}

// Main setup function
async function setupDatabase() {
    try {
        log('🚀 Starting database setup for Conecta Córdoba...');
        
        // Step 1: Test connection
        const connectionOk = await testConnection();
        if (!connectionOk) {
            log('Setup failed at connection test', 'error');
            process.exit(1);
        }
        
        // Step 2: Create tables
        const tablesOk = await createTables();
        if (!tablesOk) {
            log('Setup failed at table creation', 'error');
            process.exit(1);
        }
        
        // Step 3: Seed initial data
        const seedOk = await seedInitialData();
        if (!seedOk) {
            log('Setup failed at data seeding', 'error');
            process.exit(1);
        }
        
        // Step 4: Health check
        const healthOk = await healthCheck();
        if (!healthOk) {
            log('Setup completed but health check failed', 'warning');
        }
        
        log('🎉 Database setup completed successfully!', 'success');
        log('Your Conecta Córdoba database is ready to use.', 'info');
        
        // Close connection
        await sequelize.close();
        
    } catch (error) {
        log(`Unexpected error during setup: ${error.message}`, 'error');
        process.exit(1);
    }
}

// Handle command line arguments
const command = process.argv[2];

switch (command) {
    case 'test':
        testConnection().then(() => process.exit(0)).catch(() => process.exit(1));
        break;
    case 'migrate':
        createTables().then(() => process.exit(0)).catch(() => process.exit(1));
        break;
    case 'seed':
        seedInitialData().then(() => process.exit(0)).catch(() => process.exit(1));
        break;
    case 'health':
        healthCheck().then(() => process.exit(0)).catch(() => process.exit(1));
        break;
    case 'setup':
    default:
        setupDatabase();
        break;
}

module.exports = {
    testConnection,
    createTables,
    seedInitialData,
    healthCheck,
    setupDatabase
};