const { PublicKey } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const logger = require('../utils/logger');
const { getConnection, getPoolMonitorConnection } = require('../config/network');

class TokenMonitor {
    constructor() {
        this.connection = getConnection();
        this.watchedTokens = new Map(); // Store tokens we're monitoring
    }

    // Monitor a specific token
    async monitorToken(tokenAddress) {
        try {
            const tokenPublicKey = new PublicKey(tokenAddress);
            
            // Get initial token data
            const tokenInfo = await this.connection.getParsedAccountInfo(tokenPublicKey);
            if (!tokenInfo.value) {
                throw new Error('Token not found');
            }

            logger.info(`Started monitoring token: ${tokenAddress}`);
            
            // Store initial data
            this.watchedTokens.set(tokenAddress, {
                address: tokenAddress,
                lastUpdate: Date.now(),
                supply: tokenInfo.value.data.parsed.info.supply
            });

            // Set up subscription for account changes
            const subscriptionId = this.connection.onAccountChange(
                tokenPublicKey,
                (accountInfo) => this.handleTokenUpdate(tokenAddress, accountInfo),
                'confirmed'
            );

            return subscriptionId;

        } catch (error) {
            logger.error(`Failed to monitor token ${tokenAddress}: ${error.message}`);
            throw error;
        }
    }

    // Handle updates to token data
    handleTokenUpdate(tokenAddress, accountInfo) {
        try {
            const tokenData = this.watchedTokens.get(tokenAddress);
            if (!tokenData) return;

            // Update stored data
            tokenData.lastUpdate = Date.now();
            
            logger.info(`Token ${tokenAddress} updated`);
            // Add your custom logic here for what to do when token data changes
            
        } catch (error) {
            logger.error(`Error handling token update: ${error.message}`);
        }
    }

    // Stop monitoring a token
    stopMonitoring(tokenAddress, subscriptionId) {
        try {
            this.connection.removeAccountChangeListener(subscriptionId);
            this.watchedTokens.delete(tokenAddress);
            logger.info(`Stopped monitoring token: ${tokenAddress}`);
        } catch (error) {
            logger.error(`Failed to stop monitoring token: ${error.message}`);
        }
    }
}

class PoolMonitor {
    constructor() {
        logger.info('Initializing PoolMonitor...');
        this.connection = getPoolMonitorConnection();
        this.RAYDIUM_PROGRAM_ID = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');
        this.isMonitoring = false;
        this.subscription = null;
        this.retryAttempts = 0;
        this.MAX_RETRIES = 3;
        this.TIMEOUT_MS = 15000;
    }

    // Helper function to timeout promises
    async withTimeout(promise, timeoutMs = this.TIMEOUT_MS, errorMessage = 'Operation timed out') {
        let timeoutHandle;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutHandle = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
        });

        try {
            const result = await Promise.race([promise, timeoutPromise]);
            clearTimeout(timeoutHandle);
            return result;
        } catch (error) {
            clearTimeout(timeoutHandle);
            throw error;
        }
    }

    async getRecentPools(limit = 5) {
        try {
            logger.info('Fetching recent Raydium pools...');

            const filters = [
                {
                    dataSize: 1440, // Raydium pool size
                }
            ];

            const config = {
                commitment: 'confirmed',
                filters,
                encoding: 'base64',
            };

            // First attempt with filters
            try {
                const accounts = await this.withTimeout(
                    this.connection.getProgramAccounts(this.RAYDIUM_PROGRAM_ID, config),
                    this.TIMEOUT_MS,
                    'Fetching pools timed out'
                );

                logger.info(`Found ${accounts.length} pools with filter`);
                
                if (accounts.length > 0) {
                    return accounts.slice(0, limit);
                }
            } catch (error) {
                logger.warn(`Initial pool fetch failed: ${error.message}`);
            }

            // Fallback: try without filters
            logger.info('Attempting fallback query without filters...');
            const fallbackConfig = {
                commitment: 'confirmed',
                encoding: 'base64',
                limits: limit
            };

            const fallbackAccounts = await this.withTimeout(
                this.connection.getProgramAccounts(this.RAYDIUM_PROGRAM_ID, fallbackConfig),
                this.TIMEOUT_MS,
                'Fallback query timed out'
            );

            logger.info(`Found ${fallbackAccounts.length} accounts without filter`);
            return fallbackAccounts.slice(0, limit);

        } catch (error) {
            logger.error(`Failed to fetch pools: ${error.message}`);
            
            if (this.retryAttempts < this.MAX_RETRIES) {
                this.retryAttempts++;
                logger.info(`Retrying (${this.retryAttempts}/${this.MAX_RETRIES})...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * this.retryAttempts));
                return this.getRecentPools(limit);
            }
            
            return [];
        }
    }

    async startMonitoring() {
        try {
            if (this.isMonitoring) {
                logger.info('Monitoring already active');
                return true;
            }

            logger.info('Starting real-time pool monitoring...');
            
            // Setup monitoring with automatic reconnection
            const setupSubscription = () => {
                this.subscription = this.connection.onProgramAccountChange(
                    this.RAYDIUM_PROGRAM_ID,
                    (accountInfo, context) => {
                        try {
                            const accountId = context.accountId.toString();
                            logger.info('Account change detected:');
                            logger.info(`- Account: ${accountId}`);
                            logger.info(`- Data length: ${accountInfo.data.length}`);
                            logger.info(`- Slot: ${context.slot}`);
                        } catch (error) {
                            logger.error(`Error processing account change: ${error.message}`);
                        }
                    },
                    'confirmed'
                );
            };

            setupSubscription();
            this.isMonitoring = true;

            // Setup reconnection handler
            this.connection.onDisconnect(() => {
                logger.warn('WebSocket disconnected, attempting to reconnect...');
                if (this.isMonitoring) {
                    setupSubscription();
                }
            });

            logger.info('Pool monitor started successfully');
            return true;

        } catch (error) {
            this.isMonitoring = false;
            logger.error(`Failed to start monitoring: ${error.message}`);
            return false;
        }
    }

    async stopMonitoring() {
        try {
            if (this.subscription) {
                await this.connection.removeAccountChangeListener(this.subscription);
                this.subscription = null;
                this.isMonitoring = false;
                logger.info('Monitoring stopped successfully');
            }
        } catch (error) {
            logger.error(`Error stopping monitor: ${error.message}`);
            throw error;
        }
    }

    getStatus() {
        return {
            isMonitoring: this.isMonitoring,
            hasSubscription: !!this.subscription,
            retryAttempts: this.retryAttempts,
            connectionStatus: this.connection ? 'Connected' : 'Disconnected'
        };
    }
}

module.exports = PoolMonitor;