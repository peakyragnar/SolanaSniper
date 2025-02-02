// src/services/pool-monitor.js
const { PublicKey } = require('@solana/web3.js');
const logger = require('../utils/logger');
const { getPoolMonitorConnection } = require('../config/network');

module.exports = class PoolMonitor {
    constructor() {
        logger.info('Initializing PoolMonitor...');
        this.connection = getPoolMonitorConnection();
        this.RAYDIUM_PROGRAM_ID = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');
        this.POOL_SIZE = 2208; // Raydium pool account size
        this.isMonitoring = false;
        this.subscription = null;
        this.knownPools = new Map();
    }

    getStatus() {
        return {
            isMonitoring: this.isMonitoring,
            hasSubscription: this.subscription !== null,
            connectionStatus: this.connection ? 'Connected' : 'Disconnected',
            knownPoolsCount: this.knownPools.size
        };
    }

    async startMonitoring() {
        try {
            if (this.isMonitoring) {
                logger.info('Already monitoring');
                return true;
            }

            logger.info('Starting pool monitoring...');

            // Set up program account subscription
            this.subscription = this.connection.onProgramAccountChange(
                this.RAYDIUM_PROGRAM_ID,
                (info) => {
                    this.handlePoolUpdate(info);
                },
                'confirmed'
            );

            this.isMonitoring = true;
            logger.info('Pool monitoring active');
            return true;

        } catch (error) {
            this.isMonitoring = false;
            this.subscription = null;
            logger.error(`Failed to start monitoring: ${error.message}`);
            return false;
        }
    }

    async stopMonitoring() {
        try {
            if (this.subscription !== null) {
                await this.connection.removeProgramAccountChangeListener(this.subscription);
                this.subscription = null;
            }
            this.isMonitoring = false;
            logger.info('Monitoring stopped');
            return true;
        } catch (error) {
            logger.error(`Error stopping monitor: ${error.message}`);
            throw error;
        }
    }

    handlePoolUpdate(info) {
        try {
            // Validate account info
            if (!info || !info.accountInfo) {
                logger.warn('Invalid account info received');
                return;
            }

            // Extract and validate account data
            const accountId = info.accountId?.toString() || 'unknown';
            const accountInfo = info.accountInfo;
            const dataSize = accountInfo.data?.length || 0;
            const owner = accountInfo.owner?.toString() || 'unknown';

            // Check if this is a pool account
            if (dataSize === this.POOL_SIZE) {
                // Log pool detection with details
                logger.info('Pool detected:', {
                    address: accountId,
                    owner,
                    size: dataSize
                });

                // Store pool data
                this.knownPools.set(accountId, {
                    lastSeen: Date.now(),
                    dataSize,
                    owner
                });
            } else {
                logger.debug(`Non-pool account: ${accountId}`, { size: dataSize });
            }
        } catch (error) {
            logger.error('Pool update error:', error);
        }
    }
};