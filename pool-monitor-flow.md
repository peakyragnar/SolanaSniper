src/
├── config/
│   └── network.js         # Network connection management
│
├── services/
│   └── pool-monitor.js    # Main pool monitoring service
│
├── utils/
│   ├── constants.js       # Shared constants and configurations
│   ├── helius.js         # Helius API integration
│   ├── logger.js         # Logging utility
│   └── pool-layout.js    # Pool data structure decoder
│
├── index.js              # Application entry point
└── .env                  # Environment variables

How Components Interact:

Entry Point Flow:
// index.js
┌─────────────────┐
│    index.js     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│   network.js    │◄───│     .env        │
└────────┬────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│  pool-monitor   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Start Monitor  │
└─────────────────┘

2. Pool Detection Flow:

// When new pool is detected
┌─────────────────┐
│  pool-monitor   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│  Validate Pool  │◄───│   pool-layout   │
└────────┬────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│  Analyze Pool   │◄───│    helius.js    │
└────────┬────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│    Log Info     │
└─────────────────┘

3.  Data Flow Between Components:

network.js
- Manages RPC connections
- Handles connection retries
- Provides WebSocket endpoints

pool-layout.js
- Defines pool data structure
- Decodes raw pool data
- Calculates pool metrics

helius.js
- Fetches transaction history
- Gets token information
- Provides enhanced API access

pool-monitor.js
- Coordinates all components
- Monitors for new pools
- Analyzes pool data
- Maintains pool state

4. key interactions:
// Example of component interaction
class PoolMonitor {
    constructor() {
        // Get connection from network.js
        this.connection = getPoolMonitorConnection();
        
        // Use constants from constants.js
        this.POOL_SIZE = ACCOUNT_SIZES.POOL;
        
        // Initialize Helius API
        this.helius = new HeliusAPI();
    }

    async analyzePool(address, data) {
        // Use pool-layout.js to decode data
        const decodedPool = PoolDataLayout.decode(data);
        
        // Use helius.js to get additional info
        const history = await this.helius.getAddressHistory(address);
        
        // Use logger.js to output info
        logger.info('Pool Analysis:', { decodedPool, history });
    }
}