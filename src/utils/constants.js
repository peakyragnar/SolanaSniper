// src/utils/constants.js
const { PublicKey } = require('@solana/web3.js');

module.exports = {
    // Raydium CLMM Program ID
    RAYDIUM_PROGRAM_ID: new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'),
    
    // Token Metadata Program ID
    TOKEN_METADATA_PROGRAM_ID: new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'),
    
    // Account sizes
    ACCOUNT_SIZES: {
        POOL: 1440,      // Raydium CLMM pool size
        TOKEN: 752,      // Token account size
        OTHER: 544       // Other account size
    },
    
    // Network settings
    COMMITMENT: 'confirmed',
    
    // Monitoring settings
    MAX_RETRIES: 3,
    TIMEOUT_MS: 30000,
    RETRY_DELAY: 2000
};