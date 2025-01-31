// File: src/utils/logger.js
// Purpose: Provides consistent logging throughout the application
// Benefits: 
// - Centralizes all logging logic
// - Makes it easy to change logging behavior later
// - Adds log levels for better debugging

const logger = {
    // Info level: For general operational messages
    info: (message) => console.log(`[INFO] ${message}`),
    
    // Error level: For errors and exceptions
    error: (message) => console.error(`[ERROR] ${message}`),
    
    // Debug level: For detailed debugging information
    debug: (message) => console.log(`[DEBUG] ${message}`)
};

module.exports = logger;