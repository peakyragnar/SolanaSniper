const { Indexer } = require('@jup-ag/common');
const { getConnection } = require('../config/network');
const logger = require('../utils/logger');

class TokenMonitorService {
    constructor() {
        this.connection = getConnection();
        this.indexer = new Indexer({ cluster: 'devnet' });
    }

    async monitorToken(tokenMint) {
        try {
            const tokens = await this.indexer.getTokens();
            const token = tokens.find(t => t.address === tokenMint);
            if (!token) {
                logger.error('Token not found');
                return null;
            }
            logger.info(`Found token: ${token.symbol}`);
            return token;
        } catch (error) {
            logger.error(`Token monitoring failed: ${error.message}`);
            return null;
        }
    }
}

module.exports = new TokenMonitorService();