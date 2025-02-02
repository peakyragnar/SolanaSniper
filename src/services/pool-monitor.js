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
            // Custom logic for token update can be added here
            
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
        // Raydium program ID (ensure this matches your network)
        this.RAYDIUM_PROGRAM_ID = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');
        this.isMonitoring = false;
        this.subscription = null;
        this.retryAttempts = 0;
        this.MAX_RETRIES = 3;
        this.TIMEOUT_MS = 15000;
    }

    // Adds a timeout to any promise for robust error handling
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
                    dataSize: 1440, // Expected Raydium pool account size
                }
            ];

            const config = {
                commitment: 'confirmed',
                filters,
                encoding: 'base64',
            };

            // First attempt using filters
            try {
                const accounts = await this.withTimeout(
                    this.connection.getProgramAccounts(this.RAYDIUM_PROGRAM_ID, config),
                    this.TIMEOUT_MS,
                    'Fetching pools timed out'
                );

                logger.info(`Found ${accounts.length} pools with filter`);
                if (accounts.length > 0) {
                    // If pools are returned, select the most recent "limit" accounts
                    return accounts.slice(-limit);
                }
            } catch (error) {
                logger.warn(`Initial pool fetch failed: ${error.message}`);
            }

            // Fallback: attempt query without filters
            logger.info('Attempting fallback query without filters...');
            const fallbackConfig = {
                commitment: 'confirmed',
                encoding: 'base64'
            };

            const fallbackAccounts = await this.withTimeout(
                this.connection.getProgramAccounts(this.RAYDIUM_PROGRAM_ID, fallbackConfig),
                this.TIMEOUT_MS,
                'Fallback query timed out'
            );

            logger.info(`Found ${fallbackAccounts.length} accounts without filter`);
            return fallbackAccounts.slice(-limit);
        } catch (error) {
            logger.error(`Failed to fetch pools: ${error.message}`);

            // Increase delay if the error status indicates rate limiting
            const delay = error.status === 429 ? 2000 * (this.retryAttempts + 1) : 1000 * (this.retryAttempts + 1);
            if (this.retryAttempts < this.MAX_RETRIES) {
                this.retryAttempts++;
                logger.info(`Retrying (${this.retryAttempts}/${this.MAX_RETRIES}) after delay of ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
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

            // Set up the subscription using the callback that receives info and context
            const setupSubscription = () => {
                this.subscription = this.connection.onProgramAccountChange(
                    this.RAYDIUM_PROGRAM_ID,
                    (info, context) => {
                        try {
                            // 'info' contains accountId and accountInfo
                            const accountId = info.accountId.toString();
                            const data = info.accountInfo.data || Buffer.alloc(0);
                            logger.info('Account change detected:');
                            logger.info(`- Account: ${accountId}`);
                            logger.info(`- Data length: ${data.length}`);
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

            // Note: onDisconnect is not provided by current web3.js. For reconnection logic,
            // monitor errors on the underlying WebSocket.
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

module.exports = {
    PoolMonitor,
    TokenMonitor
};
