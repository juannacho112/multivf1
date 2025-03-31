# VeeFriends Multiplayer - Issue Fix Documentation

## Problem Summary

The VeeFriends multiplayer game was experiencing issues with deck data handling, specifically:

1. **Newline characters in deck data**: MongoDB validation was failing with "Cast to [string] failed" errors when processing deck data containing newline characters.
2. **Inconsistent deck format**: Decks were sometimes stored as stringified JSON instead of proper JavaScript arrays.
3. **Missing collections**: The VeefriendsGame collection may not exist in new MongoDB installations.

## Solution Implemented

We've implemented a comprehensive solution that addresses all these issues:

### 1. Robust Deck Formatting Utility (`deckFormatter.js`)

- Handles any format of deck data, including problematic string formats with newlines
- Provides multiple parsing methods with fallbacks for different string patterns
- Implements repair functions for malformed JSON strings

### 2. Dedicated Deck Processing Service (`deckProcessingService.js`)

- Centralizes all deck operations to ensure consistent handling
- Uses direct MongoDB operations to bypass Mongoose validation issues
- Implements safe storage and retrieval methods for deck data

### 3. Enhanced Database Model (`VeefriendsGame.js`)

- Improved deck schema with better validation and type conversion
- Fixed the setter function to properly handle string data with newlines

### 4. Utility Scripts

- **test-connection.js**: Verifies MongoDB connection and tests deck formatting
- **init-veefriends-db.js**: Initializes the VeefriendsGame collection and creates test data
- **cleanup-db.js**: Fixes existing corrupted deck data in the database
- **init-db.sh**: Interactive shell script to set up the database properly

## How to Fix Your Installation

### Step 1: Test Your Database Connection

This will check if your MongoDB connection is working and if the VeefriendsGame collection exists:

```bash
cd backend
NODE_OPTIONS=--experimental-modules node test-connection.js
```

### Step 2: Initialize the Database

If the test shows that the VeefriendsGame collection doesn't exist, run:

```bash
cd backend
./init-db.sh
```

This script will:
- Check your MongoDB connection
- Create the VeefriendsGame collection if it doesn't exist
- Create a test game entry to verify everything works

### Step 3: Fix Existing Data (If Needed)

If you already have games with corrupted deck data, run:

```bash
cd backend
./cleanup-db.sh
```

This will scan your database and fix any corrupted deck data.

### Step 4: Restart Your Server

After completing these steps, restart your backend server:

```bash
cd backend
npm start
```

## Technical Details

### Deck Processing Flow

1. Raw deck data (string, array, or object) comes in from client or server code
2. The `ensureProperDeckFormat` function in `deckFormatter.js` normalizes the format
3. The `safelyStoreDeck` function in `deckProcessingService.js` handles MongoDB storage
4. When retrieving decks, the `getPlayerDeck` function ensures proper formatting

### Common Error Patterns Fixed

1. **String newlines**: `"[\n  {\n    id: 'card1',\n    ..."`
2. **JS string concatenation**: `"[\\n' + '  {\\n' + ..."`
3. **Unbalanced brackets**: Missing opening or closing brackets are automatically fixed
4. **Missing quotes**: Property names and values without proper quotes are repaired

## Troubleshooting

If you still encounter issues:

1. Check your MongoDB connection string in the `.env` file
2. Make sure MongoDB is running and accessible
3. Try running the `./init-db.sh` script again
4. Check the server logs for any specific errors

## Contact

If you need further assistance, please provide the complete server logs and any error messages you're seeing.
