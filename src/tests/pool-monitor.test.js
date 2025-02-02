// src/tests/pool-monitor.test.js
require('dotenv').config();
const { expect } = require('chai');
const PoolMonitor = require('../services/pool-monitor');
const logger = require('../utils/logger');

async function runTests() {
    // Increase timeout for network operations
    const monitor = new PoolMonitor();

    try {
        // Environment validation
        const requiredVars = [
            'MAINNET_RPC_URL',
            'MAINNET_WS_URL',
            'HELIUS_API_KEY'
        ];

        requiredVars.forEach(varName => {
            if (!process.env[varName]) {
                throw new Error(`Missing environment variable: ${varName}`);
            }
        });

        logger.info('Environment validation passed');

        // Test initialization
        logger.info('Testing initialization...');
        expect(monitor).to.exist;
        expect(monitor.POOL_SIZE).to.equal(2208);
        expect(monitor.knownPools).to.be.instanceOf(Map);
        expect(monitor.knownPools.size).to.equal(0);
        
        const status = monitor.getStatus();
        expect(status.connectionStatus).to.equal('Connected');
        expect(status.isMonitoring).to.be.false;
        expect(status.hasSubscription).to.be.false;
        
        logger.info('All tests passed! ✅');

    } catch (error) {
        logger.error(`Test failed: ${error.message}`);
        process.exit(1);
    } finally {
        if (monitor) {
            await monitor.stopMonitoring();
        }
    }
}

// Run the tests
runTests().catch(error => {
    logger.error(`Test execution failed: ${error.message}`);
    process.exit(1);
});