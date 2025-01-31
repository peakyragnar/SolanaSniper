// File: src/services/wallet.js
// Purpose: Manages wallet operations and security
// This service handles loading the wallet and providing access to its public key

const { Keypair } = require('@solana/web3.js');  // Solana's web3 library for keypair management
const fs = require('fs');                        // Node.js file system module
const logger = require('../utils/logger');       // Our custom logger

class WalletService {
    constructor() {
        // Initialize with no keypair - we'll load it later
        this.keypair = null;
    }

    // Loads wallet from the JSON file containing the private key
    loadWallet() {
        try {
            // Get private key file path from environment variables
            const privateKeyFile = process.env.PRIVATE_KEY_PATH;
            
            // Read and parse the JSON file containing the private key
            const privateKeyData = JSON.parse(fs.readFileSync(privateKeyFile));
            
            // Create a Solana keypair from the private key data
            // We convert the array to Uint8Array as required by Solana
            this.keypair = Keypair.fromSecretKey(new Uint8Array(privateKeyData));
            
            // Log success with the public key (safe to log)
            logger.info(`Wallet loaded: ${this.keypair.publicKey.toString()}`);
            
            return this.keypair;
        } catch (error) {
            // If anything goes wrong, log the error and re-throw
            logger.error(`Failed to load wallet: ${error.message}`);
            throw error;
        }
    }

    // Safe method to get the public key
    // Throws error if wallet isn't loaded yet
    getPublicKey() {
        if (!this.keypair) {
            throw new Error('Wallet not loaded');
        }
        return this.keypair.publicKey;
    }
}

// Export a single instance (singleton pattern)
module.exports = new WalletService();