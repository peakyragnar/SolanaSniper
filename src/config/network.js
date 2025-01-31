const { Connection, clusterApiUrl } = require('@solana/web3.js');

const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const POOL_MONITOR_NETWORK = process.env.POOL_MONITOR_NETWORK || 'mainnet-beta';

// Fallback RPC URLs (use your own RPC endpoints in production)
const FALLBACK_MAINNET_RPC = 'https://api.mainnet-beta.solana.com';
const FALLBACK_WS_URL = 'wss://api.mainnet-beta.solana.com';

const getConnection = () => {
    return new Connection(clusterApiUrl(SOLANA_NETWORK));
};

const getPoolMonitorConnection = () => {
    const rpcUrl = process.env.MAINNET_RPC_URL || FALLBACK_MAINNET_RPC;
    const wsUrl = process.env.MAINNET_WS_URL || FALLBACK_WS_URL;

    try {
        return new Connection(
            rpcUrl,
            {
                commitment: 'confirmed',
                wsEndpoint: wsUrl,
                httpHeaders: {
                    'Content-Type': 'application/json',
                }
            }
        );
    } catch (error) {
        console.error('Failed to create connection:', error);
        throw new Error(`Connection failed: ${error.message}`);
    }
};

module.exports = {
    getConnection,
    getPoolMonitorConnection,
    SOLANA_NETWORK,
    POOL_MONITOR_NETWORK
};