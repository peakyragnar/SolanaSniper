const { Connection } = require('@solana/web3.js');
const logger = require('../utils/logger');

const getConnection = () => {
    // Use the SOLANA_RPC_URL environment variable if provided;
    // otherwise, default to the public Mainnet-Beta RPC endpoint.
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');
    // Log the network we're connecting to (based on SOLANA_NETWORK) and the RPC URL
    logger.info(`Connected to ${process.env.SOLANA_NETWORK || 'mainnet-beta'} via ${rpcUrl}`);
    return connection;
};

const getPoolMonitorConnection = () => {
    // For pool monitoring, we require that MAINNET_RPC_URL is defined in .env.
    if (!process.env.MAINNET_RPC_URL) {
        throw new Error('MAINNET_RPC_URL missing in .env');
    }
    // Use MAINNET_RPC_URL from the environment variables.
    const rpcUrl = process.env.MAINNET_RPC_URL;
    const connection = new Connection(rpcUrl, 'confirmed');
    // Log that the pool monitor is connected to Mainnet-Beta using the provided endpoint.
    logger.info(`Pool monitor connected to mainnet-beta via ${rpcUrl}`);
    return connection;
};

module.exports = { getConnection, getPoolMonitorConnection };