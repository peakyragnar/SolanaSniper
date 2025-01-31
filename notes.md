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
    
    src/utils/
        Purpose:
           Helper functions
           shared utilities
           common calculations

        why needed?
            Prevents code duplication
            Makes testing easier
            Improves code organization

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

Dependencies Chosen:
    @solana/web3.js
        Purpose:
            core solana interactions
            network connection
            transaction handling

        WHy necessary?
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

Core Components:
Network Configuration (src/config/network.js):

    Manages connection to Solana's devnet
    Provides a reusable connection function
    Keeps network settings in one place

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