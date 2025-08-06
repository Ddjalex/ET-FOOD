import { Telegraf, Markup, Context as TelegrafContext } from 'telegraf';
import { storage } from '../storage';

interface DriverContext extends TelegrafContext {
  session?: any;
}

export function setupEnhancedDriverBot(bot: Telegraf<DriverContext>) {
  console.log('Setting up Enhanced Driver Bot (EnbelaDriver_bot) commands...');

  // Start command with enhanced registration flow
  bot.start(async (ctx) => {
    const telegramId = ctx.from?.id.toString();
    const firstName = ctx.from?.first_name || '';
    
    try {
      // Check if driver already registered
      const existingUser = await storage.getUserByTelegramId(telegramId);
      
      if (existingUser && existingUser.role === 'driver') {
        const driver = await storage.getDriverByUserId(existingUser.id);
        
        if (driver) {
          if (driver.isApproved) {
            await ctx.reply(
              `🚗 Welcome back, ${firstName}!\n\n` +
              `You're registered and approved to deliver with BeU.\n\n` +
              `📊 Your Stats:\n` +
              `• Status: ${driver.isOnline ? '🟢 Online' : '🔴 Offline'}\n` +
              `• Total Deliveries: ${driver.totalDeliveries}\n` +
              `• Total Earnings: $${driver.totalEarnings}\n` +
              `• Rating: ⭐ ${driver.rating}`,
              Markup.inlineKeyboard([
                [Markup.button.webApp('🚗 Open Driver Dashboard', getDriverAppUrl())]
              ])
            );
          } else if (!driver.isApproved) {
            await ctx.reply(
              `⏳ Hello ${firstName}!\n\n` +
              `Your driver registration is being reviewed by our team. You'll be notified once approved.\n\n` +
              `📋 Registration Status: Pending Review`,
              Markup.inlineKeyboard([
                [Markup.button.webApp('📱 Check Status', getDriverAppUrl())]
              ])
            );
          } else {
            await ctx.reply(
              `❌ Unfortunately, your driver registration was not approved.\n\n` +
              `You can reapply with updated documents.`,
              Markup.inlineKeyboard([
                [Markup.button.webApp('📝 Reapply', getDriverAppUrl())]
              ])
            );
          }
        } else {
          // User exists but no driver record
          await showRegistrationWelcome(ctx, firstName);
        }
      } else {
        // New user, show welcome and registration
        await showRegistrationWelcome(ctx, firstName);
      }
    } catch (error) {
      console.error('Driver bot start error:', error);
      await ctx.reply('Sorry, there was an error. Please try again later.');
    }
  });

  // Enhanced help command
  bot.help((ctx) => {
    ctx.reply(
      `🚗 *BeU Driver Bot Help*\n\n` +
      `*Commands:*\n` +
      `• /start - Get started or check status\n` +
      `• /register - Register as a new driver\n` +
      `• /status - Check your current status\n` +
      `• /earnings - View your earnings summary\n` +
      `• /orders - Check available orders\n` +
      `• /online - Go online to receive orders\n` +
      `• /offline - Go offline\n` +
      `• /help - Show this help message\n\n` +
      `*Quick Actions:*`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.webApp('🚗 Driver Dashboard', getDriverAppUrl())],
          [Markup.button.webApp('📝 Register Now', getDriverAppUrl())]
        ])
      }
    );
  });

  // Registration command
  bot.command('register', async (ctx) => {
    await showRegistrationWelcome(ctx, ctx.from?.first_name || 'Driver');
  });

  // Status command with detailed information
  bot.command('status', async (ctx) => {
    const telegramId = ctx.from?.id.toString();
    
    try {
      const user = await storage.getUserByTelegramId(telegramId);
      
      if (!user || user.role !== 'driver') {
        await ctx.reply(
          '❌ You are not registered as a driver yet.\n\n' +
          'Join our delivery team and start earning!',
          Markup.inlineKeyboard([
            [Markup.button.webApp('📝 Register Now', getDriverAppUrl())]
          ])
        );
        return;
      }

      const driver = await storage.getDriverByUserId(user.id);
      
      if (!driver) {
        await ctx.reply(
          '❌ Driver profile not found.',
          Markup.inlineKeyboard([
            [Markup.button.webApp('📝 Complete Registration', getDriverAppUrl())]
          ])
        );
        return;
      }

      let statusEmoji = '⏳';
      let statusText = 'Pending Approval';
      
      if (driver.isApproved) {
        statusEmoji = driver.isOnline ? '🟢' : '🔴';
        statusText = driver.isOnline ? 'Online & Ready for Orders' : 'Offline';
      } else {
        statusEmoji = '⏳';
        statusText = 'Pending Approval';
      }

      await ctx.reply(
        `🚗 *Driver Status Report*\n\n` +
        `Status: ${statusEmoji} ${statusText}\n` +
        `Name: ${(driver as any).name || 'Not provided'}\n` +
        `Phone: ${(driver as any).phoneNumber || 'Not provided'}\n\n` +
        `📊 *Performance:*\n` +
        `• Total Deliveries: ${driver.totalDeliveries || 0}\n` +
        `• Total Earnings: $${driver.totalEarnings}\n` +
        `• Today's Earnings: $${(driver as any).todayEarnings || '0.00'}\n` +
        `• Rating: ⭐ ${driver.rating}/5.0\n\n` +
        `${driver.zone ? `🗺 Zone: ${driver.zone}` : ''}`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.webApp('📱 Open Dashboard', getDriverAppUrl())]
          ])
        }
      );
    } catch (error) {
      console.error('Driver status error:', error);
      await ctx.reply('Sorry, there was an error fetching your status. Please try again.');
    }
  });

  // Earnings command with breakdown
  bot.command('earnings', async (ctx) => {
    const telegramId = ctx.from?.id.toString();
    
    try {
      const user = await storage.getUserByTelegramId(telegramId);
      const driver = user ? await storage.getDriverByUserId(user.id) : null;
      
      if (!driver) {
        await ctx.reply(
          '❌ You need to be registered as a driver first.',
          Markup.inlineKeyboard([
            [Markup.button.webApp('📝 Register Now', getDriverAppUrl())]
          ])
        );
        return;
      }

      const totalDeliveries = driver.totalDeliveries || 0;
      const avgPerDelivery = totalDeliveries > 0 
        ? (parseFloat(driver.totalEarnings || '0') / totalDeliveries).toFixed(2)
        : '0.00';

      await ctx.reply(
        `💰 *Earnings Summary*\n\n` +
        `📈 *Current Period:*\n` +
        `• Today: $${(driver as any).todayEarnings || '0.00'}\n` +
        `• This Week: $${(driver as any).weeklyEarnings || '0.00'}\n\n` +
        `📊 *All Time:*\n` +
        `• Total Earnings: $${driver.totalEarnings}\n` +
        `• Total Deliveries: ${driver.totalDeliveries}\n` +
        `• Average per Delivery: $${avgPerDelivery}\n\n` +
        `⭐ Rating: ${driver.rating}/5.0`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.webApp('📊 Detailed Analytics', getDriverAppUrl())]
          ])
        }
      );
    } catch (error) {
      console.error('Driver earnings error:', error);
      await ctx.reply('Sorry, there was an error fetching your earnings. Please try again.');
    }
  });

  // Orders command
  bot.command('orders', async (ctx) => {
    const telegramId = ctx.from?.id.toString();
    
    try {
      const user = await storage.getUserByTelegramId(telegramId);
      const driver = user ? await storage.getDriverByUserId(user.id) : null;
      
      if (!driver || driver.status !== 'active') {
        await ctx.reply(
          '❌ You need to be an approved driver to check orders.',
          Markup.inlineKeyboard([
            [Markup.button.webApp('📱 Complete Registration', getDriverAppUrl())]
          ])
        );
        return;
      }

      if (!driver.isOnline) {
        await ctx.reply(
          '🔴 You are currently offline.\n\n' +
          'Go online to see and accept available orders.',
          Markup.inlineKeyboard([
            [Markup.button.callback('🟢 Go Online', 'go_online')],
            [Markup.button.webApp('📱 Driver Dashboard', getDriverAppUrl())]
          ])
        );
        return;
      }

      // This would fetch actual available orders
      await ctx.reply(
        `📦 *Available Orders*\n\n` +
        `Orders near your location will appear here when you're online.\n\n` +
        `💡 Keep the Driver App open to receive real-time notifications!`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.webApp('📱 View Live Orders', getDriverAppUrl())]
          ])
        }
      );
    } catch (error) {
      console.error('Driver orders error:', error);
      await ctx.reply('Sorry, there was an error. Please try again.');
    }
  });

  // Online/Offline commands
  bot.command('online', async (ctx) => {
    await toggleDriverStatus(ctx, true);
  });

  bot.command('offline', async (ctx) => {
    await toggleDriverStatus(ctx, false);
  });

  // Callback query handlers
  bot.action('go_online', async (ctx) => {
    await ctx.answerCbQuery();
    await toggleDriverStatus(ctx, true);
  });

  bot.action('go_offline', async (ctx) => {
    await ctx.answerCbQuery();
    await toggleDriverStatus(ctx, false);
  });

  return bot;
}

// Helper functions
async function showRegistrationWelcome(ctx: DriverContext, firstName: string) {
  await ctx.reply(
    `🚗 Welcome to BeU Delivery, ${firstName}!\n\n` +
    `Join thousands of drivers earning money on their own schedule.\n\n` +
    `✨ *Driver Benefits:*\n` +
    `• Flexible working hours\n` +
    `• Competitive earnings\n` +
    `• Weekly payments\n` +
    `• Real-time order tracking\n` +
    `• 24/7 support\n\n` +
    `📝 Ready to get started? Complete your registration below:`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.webApp('📝 Register Now', getDriverAppUrl())],
        [Markup.button.callback('📞 Contact Support', 'contact_support')]
      ])
    }
  );
}

async function toggleDriverStatus(ctx: DriverContext, isOnline: boolean) {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId) {
    await ctx.reply('Unable to identify user. Please try again.');
    return;
  }
  
  try {
    const user = await storage.getUserByTelegramId(telegramId);
    const driver = user ? await storage.getDriverByUserId(user.id) : null;
    
    if (!driver || !driver.isApproved) {
      await ctx.reply(
        '❌ You need to be an approved driver first.',
        Markup.inlineKeyboard([
          [Markup.button.webApp('📝 Complete Registration', getDriverAppUrl())]
        ])
      );
      return;
    }

    // Update driver status (this would call the actual API)
    await storage.updateDriverStatus(driver.id, isOnline, isOnline);
    
    const statusText = isOnline ? 'Online' : 'Offline';
    const emoji = isOnline ? '🟢' : '🔴';
    
    await ctx.reply(
      `${emoji} *Status Updated*\n\n` +
      `You are now ${statusText.toLowerCase()}.\n\n` +
      `${isOnline ? '📱 Keep the Driver App open to receive order notifications!' : '💤 You won\'t receive new orders while offline.'}`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          isOnline 
            ? [Markup.button.callback('🔴 Go Offline', 'go_offline')]
            : [Markup.button.callback('🟢 Go Online', 'go_online')],
          [Markup.button.webApp('📱 Driver Dashboard', getDriverAppUrl())]
        ])
      }
    );
  } catch (error) {
    console.error('Toggle status error:', error);
    await ctx.reply('Sorry, there was an error updating your status. Please try again.');
  }
}

function getDriverAppUrl(): string {
  const domain = process.env.REPLIT_DEV_DOMAIN;
  if (domain) {
    return `https://${domain}/driver-app.html`;
  }
  return 'https://replit.com'; // Fallback
}