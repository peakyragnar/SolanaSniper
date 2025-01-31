const { Connection, clusterApiUrl } = require('@solana/web3.js');

const SOLANA_NETWORK = 'devnet'; // Start with devnet for testing

const getConnection = () => {
    return new Connection(clusterApiUrl(SOLANA_NETWORK));
};

module.exports = {
    getConnection,
    SOLANA_NETWORK
};