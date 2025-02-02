// File: src/utils/logger.js
// Purpose: Provides consistent logging throughout the application
// Benefits: 
// - Centralizes all logging logic
// - Makes it easy to change logging behavior later
// - Adds log levels for better debugging

/**
 * Simple logging utility with consistent formatting
 */
const logger = {
    info: (message, data = '') => {
        console.log(`[INFO] ${message}`, data || '');
    },

    error: (message, error = '') => {
        console.error(`[ERROR] ${message}`, error || '');
    },

    warn: (message, data = '') => {
        console.warn(`[WARN] ${message}`, data || '');
    },

    debug: (message, data = '') => {
        console.debug(`[DEBUG] ${message}`, data || '');
    }
};

module.exports = logger;