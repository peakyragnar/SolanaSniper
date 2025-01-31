// File: src/index.js
// Purpose: Application entry point
// This file brings everything together and initializes the bot

// Load environment variables from .env file
require('dotenv').config();

// Import required services and utilities
const { getConnection } = require('./config/network');
const walletService = require('./services/wallet');
const logger = require('./utils/logger');

// Main initialization function
async function initialize() {
    try {
        // Step 1: Load the wallet
        // This loads our keypair from the JSON file specified in .env
        const wallet = walletService.loadWallet();
        logger.info('Wallet loaded successfully');

        // Step 2: Connect to Solana network
        // This creates a connection to the network specified in .env
        const connection = getConnection();
        logger.info(`Connected to ${process.env.SOLANA_NETWORK}`);

        // Step 3: Check wallet balance
        // Note: Balance is returned in lamports (1 SOL = 1,000,000,000 lamports)
        const balance = await connection.getBalance(wallet.publicKey);
        logger.info(`Wallet balance: ${balance / 1000000000} SOL`);

    } catch (error) {
        // If anything goes wrong during initialization:
        // 1. Log the error
        // 2. Exit the process with error code 1
        logger.error(`Initialization failed: ${error.message}`);
        process.exit(1);
    }
}

// Start the initialization process
initialize();