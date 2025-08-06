# Environment Setup Guide

## Overview

The BeU Delivery System uses environment variables for configuration. This guide explains how to set up your environment for both local development and production deployment.

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `SESSION_SECRET` | Secret for session encryption | Random 32+ character string |
| `AUTH_SECRET` | Secret for authentication | Random 32+ character string |
| `CUSTOMER_BOT_TOKEN` | Telegram bot token for customers | Get from @BotFather |
| `DRIVER_BOT_TOKEN` | Telegram bot token for drivers | Get from @BotFather |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `REPLIT_DEV_DOMAIN` | Replit domain (auto-set) | Auto-detected |

## Setup Methods

### Option 1: Replit Secrets (Recommended for Production)

1. Go to your Replit project
2. Click on "Secrets" in the left sidebar  
3. Add each environment variable as a secret
4. Secrets are automatically available as environment variables

### Option 2: Local .env File (Development Only)

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your actual values:
   ```bash
   # Replace placeholder values with real credentials
   DATABASE_URL=your_actual_mongodb_url
   CUSTOMER_BOT_TOKEN=your_actual_customer_bot_token
   # ... etc
   ```

3. **Important**: Never commit `.env` files to version control

## Getting Telegram Bot Tokens

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/start` to begin
3. Send `/newbot` to create a new bot
4. Follow the prompts to set up your bot
5. Copy the provided token
6. Repeat for both customer and driver bots

## Security Best Practices

- ✅ Use Replit Secrets for all sensitive data
- ✅ Use strong, random secrets for SESSION_SECRET and AUTH_SECRET
- ✅ Keep `.env` files out of version control
- ✅ Use different tokens for development and production
- ❌ Never commit secrets to Git repositories
- ❌ Never share tokens in chat or documentation

## Troubleshooting

### Bots Not Responding
- Check that bot tokens are correctly set in Replit Secrets
- Verify tokens work by testing with Telegram API:
  ```bash
  curl "https://api.telegram.org/bot<YOUR_TOKEN>/getMe"
  ```

### Database Connection Issues
- Verify MongoDB connection string is correct
- Check that IP address is whitelisted in MongoDB Atlas
- Ensure database credentials are valid

### Session/Auth Issues
- Make sure SESSION_SECRET and AUTH_SECRET are set
- Use different secrets for different environments
- Ensure secrets are at least 32 characters long

## Environment Status Check

The application logs will show:
- ✅ "Connected to MongoDB successfully" - Database connected
- ✅ "Customer Bot (Enbela_bot) is running" - Customer bot active
- ✅ "Driver Bot (EnbelaDriver_bot) is running" - Driver bot active
- ⚠️ "Warning: TOKEN not found" - Missing environment variable