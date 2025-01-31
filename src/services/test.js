const path = require('path');
const fs = require('fs');

// Validate .env file exists
const envPath = path.resolve(__dirname, '../../.env');
if (!fs.existsSync(envPath)) {
    console.error('.env file not found at:', envPath);
    process.exit(1);
}

require('dotenv').config({ path: envPath });
const PoolMonitor = require('./pool-monitor');
const logger = require('../utils/logger');

let monitor = null;
let shutdownInProgress = false;

async function test() {
    try {
        // Environment validation
        logger.info('Environment check:');
        logger.info(`MAINNET_RPC_URL: ${process.env.MAINNET_RPC_URL ? 'Set' : 'Not set'}`);
        logger.info(`POOL_MONITOR_NETWORK: ${process.env.POOL_MONITOR_NETWORK ? 'Set' : 'Not set'}`);

        if (!process.env.MAINNET_RPC_URL) {
            throw new Error('MAINNET_RPC_URL environment variable is required');
        }

        logger.info('Starting pool monitor test...');
        
        // Initialize monitor
        monitor = new PoolMonitor();
        logger.info('Pool monitor instance created');
        
        // Get recent pools with timeout and retry
        logger.info('Fetching recent pools...');
        const pools = await monitor.getRecentPools(5);
        logger.info(`Fetch complete. Found ${pools.length} pools`);
        
        // Start monitoring if pools were found
        if (pools.length > 0) {
            logger.info('Starting monitoring...');
            const monitoringStarted = await monitor.startMonitoring();
            
            if (monitoringStarted) {
                logger.info('Monitor is active. Press Ctrl+C to stop.');
                
                // Periodic status check
                setInterval(() => {
                    if (!shutdownInProgress) {
                        const status = monitor.getStatus();
                        logger.info('Monitor status:', status);
                    }
                }, 30000); // Check every 30 seconds
            } else {
                throw new Error('Failed to start monitoring');
            }
        } else {
            throw new Error('No pools found');
        }

    } catch (error) {
        logger.error(`Test failed: ${error.message}`);
        await cleanup();
        process.exit(1);
    }
}

async function cleanup() {
    if (shutdownInProgress) return;
    shutdownInProgress = true;
    
    logger.info('Cleaning up...');
    if (monitor) {
        try {
            await monitor.stopMonitoring();
            logger.info('Monitor stopped successfully');
        } catch (error) {
            logger.error('Error during cleanup:', error);
        }
    }
}

// Handle shutdown
process.on('SIGINT', async () => {
    logger.info('Shutdown signal received...');
    await cleanup();
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
    logger.error('Uncaught exception:', error);
    await cleanup();
    process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', async (error) => {
    logger.error('Unhandled rejection:', error);
    await cleanup();
    process.exit(1);
});

// Start the test
test().catch(async (error) => {
    logger.error('Unhandled error:', error);
    await cleanup();
    process.exit(1);
});