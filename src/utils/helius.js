// src/utils/helius.js
const axios = require('axios');
const logger = require('./logger');

class HeliusAPI {
    constructor() {
        this.baseUrl = process.env.HELIUS_API_URL;
        this.apiKey = process.env.HELIUS_API_KEY;
    }

    /**
     * Parse transaction details
     * @param {string} signature - Transaction signature
     */
    async parseTransaction(signature) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/transactions/`,
                {
                    params: {
                        'api-key': this.apiKey,
                        signatures: [signature]
                    }
                }
            );
            return response.data;
        } catch (error) {
            logger.error(`Helius API error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get transaction history for an address
     * @param {string} address - Wallet or contract address
     */
    async getAddressHistory(address) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/addresses/${address}/transactions/`,
                {
                    params: {
                        'api-key': this.apiKey
                    }
                }
            );
            return response.data;
        } catch (error) {
            logger.error(`Helius API error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new HeliusAPI();