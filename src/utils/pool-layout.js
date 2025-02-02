// src/utils/pool-layout.js
const { Buffer } = require('buffer');
const { PublicKey } = require('@solana/web3.js');
const BN = require('bn.js');

/**
 * Raydium CLMM Pool Layout decoder
 */
class PoolDataLayout {
    /**
     * Decodes pool data
     * @param {Buffer} data - Raw pool data
     * @returns {Object} Decoded pool data
     */
    static decode(data) {
        try {
            // Pool data starts with 8-byte discriminator
            const discriminator = data.slice(0, 8);
            
            // Basic pool info starts at offset 8
            let offset = 8;
            
            // Decode pool data
            const poolData = {
                // Basic info
                tokenMintA: new PublicKey(data.slice(offset, offset + 32)),
                tokenMintB: new PublicKey(data.slice(offset + 32, offset + 64)),
                tokenVaultA: new PublicKey(data.slice(offset + 64, offset + 96)),
                tokenVaultB: new PublicKey(data.slice(offset + 96, offset + 128)),
                
                // Pool parameters
                tickSpacing: data.readUInt16LE(offset + 128),
                tickArrayBitmap: data.slice(offset + 130, offset + 162),
                
                // Liquidity and price data
                liquidity: new BN(data.slice(offset + 162, offset + 178), 'le'),
                sqrtPriceX64: new BN(data.slice(offset + 178, offset + 194), 'le'),
                tickCurrent: data.readInt32LE(offset + 194),
                
                // Fee parameters
                feeGrowthGlobalA: new BN(data.slice(offset + 198, offset + 214), 'le'),
                feeGrowthGlobalB: new BN(data.slice(offset + 214, offset + 230), 'le'),
                
                // Protocol fees
                protocolFeesTokenA: new BN(data.slice(offset + 230, offset + 246), 'le'),
                protocolFeesTokenB: new BN(data.slice(offset + 246, offset + 262), 'le'),
            };

            return poolData;

        } catch (error) {
            throw new Error(`Pool data decode error: ${error.message}`);
        }
    }

    /**
     * Calculates current price from sqrt price
     * @param {BN} sqrtPriceX64 - Square root price in X64 format
     * @returns {number} Current price
     */
    static calculatePrice(sqrtPriceX64) {
        const price = sqrtPriceX64.mul(sqrtPriceX64);
        return price.div(new BN(2).pow(new BN(128))).toNumber();
    }

    /**
     * Formats pool data for logging
     * @param {Object} poolData - Decoded pool data
     * @returns {Object} Formatted pool data
     */
    static formatForLogging(poolData) {
        return {
            tokenA: poolData.tokenMintA.toString(),
            tokenB: poolData.tokenMintB.toString(),
            liquidity: poolData.liquidity.toString(),
            currentTick: poolData.tickCurrent,
            price: this.calculatePrice(poolData.sqrtPriceX64)
        };
    }
}

module.exports = { PoolDataLayout };