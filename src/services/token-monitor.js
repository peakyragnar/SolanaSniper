const { PublicKey } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const logger = require('../utils/logger');
const { getConnection } = require('../config/network');

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

module.exports = new TokenMonitor();