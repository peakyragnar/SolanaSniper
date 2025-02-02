// src/config/network.js
const { Connection } = require('@solana/web3.js');
const logger = require('../utils/logger');

const getConnection = () => {
    const rpcUrl = process.env.MAINNET_RPC_URL;
    if (!rpcUrl) {
        throw new Error('MAINNET_RPC_URL missing in .env');
    }
    return new Connection(rpcUrl, 'confirmed');
};

const getPoolMonitorConnection = () => {
    const rpcUrl = process.env.MAINNET_RPC_URL;
    const wsUrl = process.env.MAINNET_WS_URL;
    
    if (!rpcUrl || !wsUrl) {
        throw new Error('Missing RPC or WebSocket URL in .env');
    }

    return new Connection(rpcUrl, {
        commitment: 'confirmed',
        wsEndpoint: wsUrl
    });
};

module.exports = { getConnection, getPoolMonitorConnection };