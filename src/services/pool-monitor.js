// Required imports
const { PublicKey } = require('@solana/web3.js');          // For Solana public key handling
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token'); // For SPL token operations
const logger = require('../utils/logger');                  // Custom logging utility
const { getConnection, getPoolMonitorConnection } = require('../config/network'); // Network connections

// Token monitoring class - handles individual token tracking
class TokenMonitor {
    constructor() {
        this.connection = getConnection();                  // Initialize Solana connection
        this.watchedTokens = new Map();                    // Store monitored tokens and their data
    }

    // Method to start monitoring a specific token
    async monitorToken(tokenAddress) {
        try {
            // Convert string address to PublicKey object
            const tokenPublicKey = new PublicKey(tokenAddress);
            
            // Fetch initial token data to verify token exists
            const tokenInfo = await this.connection.getParsedAccountInfo(tokenPublicKey);
            if (!tokenInfo.value) {
                throw new Error('Token not found');
            }

            logger.info(`Started monitoring token: ${tokenAddress}`);
            
            // Store token data in memory
            this.watchedTokens.set(tokenAddress, {
                address: tokenAddress,
                lastUpdate: Date.now(),
                supply: tokenInfo.value.data.parsed.info.supply
            });

            // Set up real-time monitoring subscription
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

    // Handler for token account updates
    handleTokenUpdate(tokenAddress, accountInfo) {
        try {
            const tokenData = this.watchedTokens.get(tokenAddress);
            if (!tokenData) return;

            tokenData.lastUpdate = Date.now();
            logger.info(`Token ${tokenAddress} updated`);
            
        } catch (error) {
            logger.error(`Error handling token update: ${error.message}`);
        }
    }

    // Method to stop monitoring a specific token
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

// Pool monitoring class - handles Raydium liquidity pool monitoring
class PoolMonitor {
    constructor() {
        logger.info('Initializing PoolMonitor...');
        this.connection = getPoolMonitorConnection();       // Initialize mainnet connection
        this.RAYDIUM_PROGRAM_ID = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');
        this.isMonitoring = false;                         // Monitoring state flag
        this.subscription = null;                          // WebSocket subscription
        this.retryAttempts = 0;                           // Counter for retry attempts
        this.MAX_RETRIES = 3;                             // Maximum retry attempts
        this.TIMEOUT_MS = 30000;                          // Operation timeout (15 seconds)
    }

    // Utility method to add timeout to promises
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

    // Method to fetch recent pool creations
    async getRecentPools(limit = 5) {
        try {
            logger.info('Fetching recent Raydium pools...');

            // Set up filters for pool accounts
            const filters = [
                {
                    dataSize: 1440, // Raydium pool account size
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
                    this.connection.getProgramAccounts(this.RAYDIUM_PROGRAM_ID, config)
                );

                logger.info(`Found ${accounts.length} pools with filter`);
                if (accounts.length > 0) {
                    return accounts.slice(-limit);
                }
            } catch (error) {
                logger.warn(`Initial pool fetch failed: ${error.message}`);
            }

            // Fallback attempt without filters
            logger.info('Attempting fallback query without filters...');
            const fallbackConfig = {
                commitment: 'confirmed',
                encoding: 'base64'
            };

            const fallbackAccounts = await this.withTimeout(
                this.connection.getProgramAccounts(this.RAYDIUM_PROGRAM_ID, fallbackConfig)
            );

            logger.info(`Found ${fallbackAccounts.length} accounts without filter`);
            return fallbackAccounts.slice(-limit);

        } catch (error) {
            // Handle rate limiting and retries
            logger.error(`Failed to fetch pools: ${error.message}`);
            const delay = error.status === 429 ? 2000 * (this.retryAttempts + 1) : 1000 * (this.retryAttempts + 1);
            
            if (this.retryAttempts < this.MAX_RETRIES) {
                this.retryAttempts++;
                logger.info(`Retrying (${this.retryAttempts}/${this.MAX_RETRIES})...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.getRecentPools(limit);
            }
            return [];
        }
    }

    // Method to start real-time pool monitoring
    async startMonitoring() {
        try {
            if (this.isMonitoring) {
                logger.info('Monitoring already active');
                return true;
            }

            logger.info('Starting real-time pool monitoring...');

            // Set up WebSocket subscription
            const setupSubscription = () => {
                this.subscription = this.connection.onProgramAccountChange(
                    this.RAYDIUM_PROGRAM_ID,
                    (info, context) => {
                        try {
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
            logger.info('Pool monitor started successfully');
            return true;

        } catch (error) {
            this.isMonitoring = false;
            logger.error(`Failed to start monitoring: ${error.message}`);
            return false;
        }
    }

    // Method to stop monitoring
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

    // Method to get current monitoring status
    getStatus() {
        return {
            isMonitoring: this.isMonitoring,
            hasSubscription: !!this.subscription,
            retryAttempts: this.retryAttempts,
            connectionStatus: this.connection ? 'Connected' : 'Disconnected'
        };
    }
}

// Export both classes for use in other files
module.exports = {
    PoolMonitor,
    TokenMonitor
};