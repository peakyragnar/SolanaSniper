Development Environment Choices:
    Node.js:
        It's JavaScript-based, making it easier for beginners
        Has extensive crypto libraries and SDK support
        Most Solana tools and examples use Node.js
        Excellent package management through npm
        JavaScript is more common in Web3 development
    

File Structure Decisions:
    src/ why separate source directory
        Keeps code organized
        Industry standard practice
        Separates source from configuration files
        Makes deployment easier

    
    src/config/
        Purpose:
            Store network configuration
            API endpoints
            Environment-specific settings
        Why separate from other code:
            Makes it easier to switch between testnet/mainnet
            Centralizes all configuration
            Improves maintainability
    
        Core Components:
        Network Configuration (src/config/network.js):

            Handles blockchain connectivity - multiple networks
            Provides two connection types: regular and pool monitor specific
            Uses environment variables for RPC URLs
            Implements basic logging

    src/services/
        Purpose:
           Core business logic
           Major functionality modules
           External service integrations

        Why this structure?
            Separates concerns
            Makes code more modular
            Improves maintainability
            Easier to test individual components
            Supports scalability

        Core Components:
            Token Monitoring Service (src/services/pool-monitor.js):







    src/utils/
        Purpose:
           Helper functions
           shared utilities
           common calculations

        why needed?
            Prevents code duplication
            Makes testing easier
            Improves code organization

    

Dependencies Chosen:
    @solana/web3.js
        Purpose:
            core solana interactions
            network connection
            transaction handling

        Why necessary?
            Official Solana SDK
            Required for any Solana interaction

    @solana/spl-token
        Purpose:
            Token program interactions
            Token account management

        why needed:
            Required for token swaps
            Handles token account creation

    dotenv
        purpose:
            environment variable managmement
            secure configuration storage

        why important:
            keeps sensitive data out of code 
            handles token account creation

install SOLANA CLI:
    sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

create new wallet: solana-keygen new --outfile ./wallet.json

pubkey: HJacMpaNVd2B3vDCup9P836mMWfthgnY253f3EsFJoLZ
seed phrase: side junior provide early vague plug wrestle luggage shove usual design claim

check balance: solana balance HJacMpaNVd2B3vDCup9P836mMWfthgnY253f3EsFJoLZ --url devnet
https://faucet.solana.com/




So far: 
Project Structure
We've set up a structured Node.js project with distinct components:

SolanaSniper/
├── src/
│   ├── config/      (Configuration files)
│   ├── services/    (Core services)
│   └── utils/       (Helper utilities)


Wallet Service (src/services/wallet.js):

    Loads and manages your Solana wallet
    Safely handles your wallet's keypair
    Provides methods to access wallet information
    Uses secure environment variables for private key path

Logger Utility (src/utils/logger.js):

    Provides consistent logging throughout the app
    Has different levels (info, error, debug)
    Makes debugging easier

Main Application (src/index.js):

    Entry point of the application
    Brings all components together
    Currently performs basic initialization:

    Loads your wallet
    Connects to Solana devnet
    Checks wallet balance

********************************************************************************
Git branch function:

# You're working on adding token monitoring
git checkout -b feature/token-monitoring   # Create new branch
# Make changes to files...
git add .                                 # Stage changes
git commit -m "Add price checker"         # Save changes
git push origin feature/token-monitoring  # Upload to GitHub

When feature is complete and tested:
git checkout main      # Go back to main branch
git merge feature/token-monitoring  # Add your new feature to main

git branch - tells you which branch you are on
git checkout feature/test - switches to that branch

# Show git's internal storage
ls .git/objects

# Switch back to feature branch to see file
git checkout feature/test
ls

# Switch to main to see file disappear
git checkout main
ls

rm test.txt - deletes the file

# Push all branches
git push origin --all

# Push specific branch
git push origin feature/test

++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
FULL TOKEN MONITORING:

Token Creation (Mint Initialization)
    Key Feature: Detect newly created tokens (SPL tokens) via the InitializeMint instruction in the SPL Token Program.

    Data to Extract:
        [Mint Address]: Unique identifier of the token.
        [Creator Wallet]: Address of the token's deployer.
        [Decimals]: Token precision (e.g., 6 for USDC).
        [Initial Supply]: Total tokens minted at creation.
        [Freeze/Mint Authority]: Whether the creator retains control (red flag for scams).
    
Token Transfers & Balances
    Key Feature: Track TransferChecked or Transfer instructions to monitor token movements.

    Data to Extract:
        [Sender/Receiver Addresses]: Identify whales or suspicious wallets.
        [Amount Transferred]: Large transfers may signal pumps/dumps.
        [Associated Token Accounts (ATAs)]: Track balances of specific wallets.
        [Timestamp]: Time of activity for pattern analysis.


 Liquidity Pool Activity
    Key Feature: Monitor DEX interactions (e.g., Raydium, Orca, Serum) for liquidity changes.

    Data to Extract:
        [Pool Creation]: New liquidity pools (e.g., via Raydium's createPool).
        [Add/Remove Liquidity]: Track LP token minting/burning.
        [Swap Volume]: High volume may indicate hype or manipulation.
        [Pool Ownership]: Check if the deployer controls the LP (rug-pull risk).

Token Metadata Updates
    Key Feature: Watch for changes to the Token Metadata Program (e.g., name, symbol, URI).    

    Data to Extract:
        [Updated Metadata URI]: Links to off-chain data (e.g., CoinGecko, website).
        [URI]: Track metadata changes (e.g., token images, descriptions).
        [Timestamp]: Time of changes for pattern analysis.
        [Freeze Authority Changes]: Sudden changes may indicate malicious intent.


DEX Listings & Market Activity
    Key Feature: Detect new markets on DEXs (e.g., Raydium or OpenBook).

    Data to Extract:
        [Market ID]: Address of the trading pair.
        [Base/Quote Token]: Pair being traded (e.g., SOL/newToken).
        [Order Book Updates]: Bid/ask spreads and liquidity depth.

+++++++++++++++++++++++++
update tracking:

# Development Phases

## Phase 1: Basic Infrastructure (Current)
- ✅ Network connections
- ✅ Basic monitoring setup
- ✅ Error handling
- ✅ Logging system

## Phase 2: Pool Monitoring (In Progress)
- 🔄 Detect new pool creation
- 🔄 Filter real pools from other account changes
- ⬜ Analyze pool composition
- ⬜ Track liquidity changes

## Phase 3: Token Monitoring
- ⬜ Detect new token creation
- ⬜ Track token metadata
- ⬜ Monitor transfers
- ⬜ Track balances

## Phase 4: Market Analysis
- ⬜ DEX listings
- ⬜ Price impact calculation
- ⬜ Volume tracking
- ⬜ Liquidity depth analysis

## Phase 5: Risk Analysis
- ⬜ Ownership analysis
- ⬜ Liquidity locking checks
- ⬜ Whale wallet tracking
- ⬜ Rug-pull detection

# Detailed Implementation Steps

## 1. Pool Monitoring (Current Focus)
1. Basic Pool Detection
   - ✅ Connect to Raydium program
   - ✅ Detect account changes
   - 🔄 Filter for pool-sized accounts (2208 bytes)
   - ⬜ Verify pool structure

2. Pool Analysis
   - ⬜ Decode pool data structure
   - ⬜ Extract token pair information
   - ⬜ Calculate initial liquidity
   - ⬜ Track liquidity changes

3. Pool Validation
   - ⬜ Verify pool creator
   - ⬜ Check token validity
   - ⬜ Analyze initial liquidity distribution
   - ⬜ Monitor LP token distribution

## 2. Token Monitoring (Next Phase)
1. Token Creation Detection
   - ⬜ Monitor SPL Token Program
   - ⬜ Detect InitializeMint instructions
   - ⬜ Extract token metadata
   - ⬜ Validate token structure

2. Token Transfer Tracking
   - ⬜ Monitor Transfer instructions
   - ⬜ Track significant movements
   - ⬜ Monitor whale wallets
   - ⬜ Calculate velocity metrics

## 3. Market Analysis (Future Phase)
1. DEX Integration
   - ⬜ Monitor market creation
   - ⬜ Track order book changes
   - ⬜ Calculate price impact
   - ⬜ Monitor trading volume

## 4. Risk Analysis (Final Phase)
1. Security Checks
   - ⬜ Analyze contract ownership
   - ⬜ Check for known scam patterns
   - ⬜ Monitor suspicious transactions
   - ⬜ Track related wallets