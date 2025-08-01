import { Telegraf, Context } from 'telegraf';
import { storage } from '../storage';
import { setupCustomerBot } from './customerBot';
import { setupDriverBot } from './driverBot';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || 'your_bot_token_here';

if (!BOT_TOKEN || BOT_TOKEN === 'your_bot_token_here') {
  console.warn('Warning: TELEGRAM_BOT_TOKEN not found in environment variables. Bot functionality will be limited.');
}

export const bot = new Telegraf(BOT_TOKEN);

export async function setupTelegramBot() {
  try {
    // Start command - common entry point
    bot.start(async (ctx: Context) => {
      const telegramUserId = ctx.from?.id.toString();
      const username = ctx.from?.username;
      const firstName = ctx.from?.first_name;
      const lastName = ctx.from?.last_name;

      if (!telegramUserId) {
        return ctx.reply('Unable to identify user. Please try again.');
      }

      // Check if user exists
      let user = await storage.getUserByTelegramId(telegramUserId);

      if (!user) {
        // Create new user
        user = await storage.upsertUser({
          telegramUserId,
          telegramUsername: username,
          firstName,
          lastName,
          role: 'customer', // Default role
        });
      }

      // Welcome message with role-based options
      const welcomeMessage = `Welcome to BeU Delivery! 🛵

Hello ${firstName}! I'm here to help you with food delivery.

What would you like to do?`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🍕 Order Food', callback_data: 'order_food' },
            { text: '🚗 Become a Driver', callback_data: 'become_driver' }
          ],
          [
            { text: '📋 My Orders', callback_data: 'my_orders' },
            { text: '🏪 Restaurant Portal', url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/restaurant` }
          ]
        ]
      };

      await ctx.reply(welcomeMessage, { reply_markup: keyboard });
    });

    // Help command
    bot.help(async (ctx) => {
      const helpMessage = `BeU Delivery Bot Commands:

🍕 /start - Start the bot and see main menu
📋 /orders - View your recent orders
🚗 /driver - Driver registration and controls
🏪 /restaurant - Restaurant management
❓ /help - Show this help message

For customer support, contact @beu_support`;

      await ctx.reply(helpMessage);
    });

    // Setup specialized bot handlers
    await setupCustomerBot(bot);
    await setupDriverBot(bot);

    // Handle callback queries
    bot.on('callback_query', async (ctx) => {
      const data = ctx.callbackQuery?.data;
      
      if (!data) return;

      switch (data) {
        case 'order_food':
          await ctx.answerCbQuery();
          await ctx.reply('🍕 Opening food ordering interface...', {
            reply_markup: {
              inline_keyboard: [[
                { text: '🛒 Browse Restaurants', web_app: { url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/customer` } }
              ]]
            }
          });
          break;

        case 'become_driver':
          await ctx.answerCbQuery();
          await ctx.reply('🚗 Starting driver registration process...', {
            reply_markup: {
              inline_keyboard: [[
                { text: '📝 Register as Driver', web_app: { url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/driver-registration` } }
              ]]
            }
          });
          break;

        case 'my_orders':
          await ctx.answerCbQuery();
          const telegramUserId = ctx.from?.id.toString();
          if (telegramUserId) {
            const user = await storage.getUserByTelegramId(telegramUserId);
            if (user) {
              const orders = await storage.getOrdersByCustomer(user.id);
              if (orders.length === 0) {
                await ctx.reply('📋 You have no orders yet. Start by ordering some delicious food!');
              } else {
                let ordersList = '📋 Your Recent Orders:\n\n';
                orders.slice(0, 5).forEach((order, index) => {
                  ordersList += `${index + 1}. Order #${order.orderNumber}\n`;
                  ordersList += `   Status: ${order.status}\n`;
                  ordersList += `   Total: ₹${order.total}\n`;
                  ordersList += `   Date: ${new Date(order.createdAt!).toLocaleDateString()}\n\n`;
                });
                await ctx.reply(ordersList);
              }
            }
          }
          break;

        default:
          await ctx.answerCbQuery('Unknown action');
      }
    });

    // Error handling
    bot.catch((err, ctx) => {
      console.error('Telegram bot error:', err);
      ctx.reply('Sorry, something went wrong. Please try again later.');
    });

    // Start the bot
    if (BOT_TOKEN !== 'your_bot_token_here') {
      await bot.launch();
      console.log('Telegram bot started successfully');

      // Graceful shutdown
      process.once('SIGINT', () => bot.stop('SIGINT'));
      process.once('SIGTERM', () => bot.stop('SIGTERM'));
    }

  } catch (error) {
    console.error('Failed to setup Telegram bot:', error);
  }
}
