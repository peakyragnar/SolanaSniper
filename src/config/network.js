const { Connection } = require('@solana/web3.js');
const logger = require('../utils/logger');

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const POOL_MONITOR_RPC_URL = process.env.POOL_MONITOR_RPC_URL || 'https://api.mainnet-beta.solana.com';

const getConnection = () => {
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    logger.info(`Connected to Solana RPC at ${SOLANA_RPC_URL}`);
    return connection;
};

const getPoolMonitorConnection = () => {
    const connection = new Connection(POOL_MONITOR_RPC_URL, 'confirmed');
    logger.info(`Pool monitor connection created to ${POOL_MONITOR_RPC_URL}`);
    return connection;
};

module.exports = { getConnection, getPoolMonitorConnection };