// src/index.js
require('dotenv').config();
const { getConnection, getPoolMonitorConnection } = require('./config/network');
const PoolMonitor = require('./services/pool-monitor');
const { PoolDataLayout } = require('./utils/pool-layout');
const logger = require('./utils/logger');

/**
 * Graceful shutdown handler
 * @param {PoolMonitor} monitor - Pool monitor instance
 */
async function handleShutdown(monitor) {
    logger.info('Shutting down...');
    if (monitor) {
        await monitor.stopMonitoring();
    }
    process.exit(0);
}

/**
 * Main application initialization
 */
async function initialize() {
    let monitor = null;
    try {
        // Initialize connections
        const connection = await getConnection();
        const monitorConnection = await getPoolMonitorConnection();
        
        logger.info('Connections established');

        // Initialize pool monitor
        monitor = new PoolMonitor();
        
        // Start monitoring
        logger.info('=== Starting Pool Monitor ===');
        await monitor.startMonitoring();
        
        // Log initial status
        const status = monitor.getStatus();
        logger.info('Monitor Status:', status);
        
        // Set up shutdown handlers
        process.on('SIGINT', () => handleShutdown(monitor));
        process.on('SIGTERM', () => handleShutdown(monitor));
        
        logger.info('Monitor is active. Press Ctrl+C to stop.');

    } catch (error) {
        logger.error(`Initialization failed: ${error.message}`);
        if (monitor) {
            await monitor.stopMonitoring();
        }
        process.exit(1);
    }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled rejection:', error);
});

// Start the application
initialize();