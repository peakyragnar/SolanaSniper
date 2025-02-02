// src/tests/pool-monitor.test.js
require('dotenv').config();
const { expect } = require('chai');
const PoolMonitor = require('../services/pool-monitor');
const logger = require('../utils/logger');

describe('Pool Monitor Integration Tests', function() {
    // Increase timeout for network operations
    this.timeout(40000);
    
    let monitor;

    before(() => {
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
    });

    beforeEach(() => {
        monitor = new PoolMonitor();
    });

    afterEach(async () => {
        if (monitor) {
            await monitor.stopMonitoring();
        }
    });

    it('should initialize with valid connection', () => {
        expect(monitor).to.exist;
        expect(monitor.POOL_SIZE).to.equal(2208);
        expect(monitor.knownPools).to.be.instanceOf(Map);
        expect(monitor.knownPools.size).to.equal(0);
        
        const status = monitor.getStatus();
        expect(status.connectionStatus).to.equal('Connected');
        expect(status.isMonitoring).to.be.false;
        expect(status.hasSubscription).to.be.false;
    });

    it('should start monitoring and set up subscription', async () => {
        const result = await monitor.startMonitoring();
        expect(result).to.be.true;
        
        const status = monitor.getStatus();
        expect(status.isMonitoring).to.be.true;
        expect(status.hasSubscription).to.be.true;
        expect(monitor.subscription).to.exist;
    });

    it('should handle multiple start calls gracefully', async () => {
        const firstStart = await monitor.startMonitoring();
        expect(firstStart).to.be.true;
        
        const secondStart = await monitor.startMonitoring();
        expect(secondStart).to.be.true;
        
        const status = monitor.getStatus();
        expect(status.isMonitoring).to.be.true;
    });

    it('should stop monitoring and clean up resources', async () => {
        await monitor.startMonitoring();
        await monitor.stopMonitoring();
        
        const status = monitor.getStatus();
        expect(status.isMonitoring).to.be.false;
        expect(status.hasSubscription).to.be.false;
        expect(monitor.subscription).to.be.null;
    });

    it('should maintain known pools state', async () => {
        await monitor.startMonitoring();
        
        // Wait for potential pool updates
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const status = monitor.getStatus();
        expect(status.knownPoolsCount).to.be.a('number');
        
        // Log any pools found
        if (status.knownPoolsCount > 0) {
            logger.info(`Found ${status.knownPoolsCount} pools during test`);
        } else {
            logger.info('No pools detected during test period');
        }
    }).timeout(6000);  // Increase timeout to 6 seconds

    it('should provide accurate status information', () => {
        const status = monitor.getStatus();
        expect(status).to.have.all.keys([
            'connectionStatus',
            'isMonitoring',
            'hasSubscription',
            'knownPoolsCount'
        ]);
        expect(status.connectionStatus).to.equal('Connected');
        expect(status.knownPoolsCount).to.equal(monitor.knownPools.size);
    });
});