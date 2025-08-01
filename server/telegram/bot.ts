import { Telegraf, Context } from 'telegraf';
import { storage } from '../storage';
import { setupCustomerBot } from './customerBot';
import { setupDriverBot } from './driverBot';

const CUSTOMER_BOT_TOKEN = process.env.CUSTOMER_BOT_TOKEN;
const DRIVER_BOT_TOKEN = process.env.DRIVER_BOT_TOKEN;

if (!CUSTOMER_BOT_TOKEN) {
  console.warn('Warning: CUSTOMER_BOT_TOKEN not found in environment variables. Customer bot will not start.');
}

if (!DRIVER_BOT_TOKEN) {
  console.warn('Warning: DRIVER_BOT_TOKEN not found in environment variables. Driver bot will not start.');
}

// Initialize both bots
export const customerBot = CUSTOMER_BOT_TOKEN ? new Telegraf(CUSTOMER_BOT_TOKEN) : null;
export const driverBot = DRIVER_BOT_TOKEN ? new Telegraf(DRIVER_BOT_TOKEN) : null;

export async function setupTelegramBots() {
  try {
    console.log('Setting up Telegram bots...');
    
    // Setup Customer Bot (Enbela_bot) - Run in background
    if (customerBot) {
      console.log('Initializing Customer Bot (Enbela_bot)...');
      setupCustomerBot(customerBot);
      // Launch bot in background without waiting
      customerBot.launch().then(() => {
        console.log('✅ Customer Bot (Enbela_bot) is running');
      }).catch((error) => {
        console.error('Error launching customer bot:', error);
      });
    }

    // Setup Driver Bot (EnbelaDriver_bot) - Run in background
    if (driverBot) {
      console.log('Initializing Driver Bot (EnbelaDriver_bot)...');
      setupDriverBot(driverBot);
      // Launch bot in background without waiting
      driverBot.launch().then(() => {
        console.log('✅ Driver Bot (EnbelaDriver_bot) is running');
      }).catch((error) => {
        console.error('Error launching driver bot:', error);
      });
    }

    if (!customerBot && !driverBot) {
      console.warn('No bot tokens provided. Bots are not running.');
      return;
    }

    console.log('🚀 Telegram bots setup initiated (running in background)');

    // Graceful shutdown handlers
    process.once('SIGINT', () => {
      console.log('Received SIGINT, stopping bots...');
      stopTelegramBots();
    });
    
    process.once('SIGTERM', () => {
      console.log('Received SIGTERM, stopping bots...');
      stopTelegramBots();
    });

  } catch (error) {
    console.error('Error setting up Telegram bots:', error);
  }
}

// Legacy function for backward compatibility
export async function setupTelegramBot() {
  return setupTelegramBots();
}

// Graceful shutdown
export function stopTelegramBots() {
  try {
    if (customerBot) {
      customerBot.stop('SIGINT');
      console.log('Customer bot stopped');
    }
    if (driverBot) {
      driverBot.stop('SIGINT');
      console.log('Driver bot stopped');
    }
  } catch (error) {
    console.error('Error stopping bots:', error);
  }
}