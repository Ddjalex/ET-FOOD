import { Telegraf, Context } from 'telegraf';
import { storage } from '../storage';

export async function setupDriverBot(bot: Telegraf) {
  console.log('Setting up Driver Bot (EnbelaDriver_bot) commands...');

  // Start command for driver bot
  bot.start(async (ctx: Context) => {
    const telegramUserId = ctx.from?.id.toString();
    const username = ctx.from?.username;
    const firstName = ctx.from?.first_name;
    const lastName = ctx.from?.last_name;

    if (!telegramUserId) {
      return ctx.reply('Unable to identify user. Please try again.');
    }

    // Check if user exists or create new driver
    let user = await storage.getUserByTelegramId(telegramUserId);

    if (!user) {
      user = await storage.upsertUser({
        telegramUserId,
        telegramUsername: username,
        firstName,
        lastName,
        role: 'driver',
      });
    }

    const welcomeMessage = `🚗 Welcome to BeU Delivery Driver Portal!

Hello ${firstName}! I'm your driver assistant for managing deliveries.

Ready to start earning with BeU Delivery?`;

    const driverAppUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}/driver-app.html`
      : 'https://replit.com';

    const keyboard = {
      inline_keyboard: [
        [{ text: '📝 Register as Driver', web_app: { url: driverAppUrl } }],
        [{ text: '🚗 Driver Dashboard', callback_data: 'driver_dashboard' }],
        [{ text: '📋 Requirements', callback_data: 'driver_requirements' }]
      ]
    };

    await ctx.reply(welcomeMessage, { reply_markup: keyboard });
  });
  // Driver command - main driver interface
  bot.command('driver', async (ctx) => {
    const telegramUserId = ctx.from?.id.toString();
    
    if (!telegramUserId) {
      return ctx.reply('Unable to identify user. Please try again.');
    }

    try {
      const user = await storage.getUserByTelegramId(telegramUserId);
      if (!user) {
        return ctx.reply('Please register first by using /start command.');
      }

      const driver = await storage.getDriverByUserId(user.id);

      if (!driver) {
        // Not registered as driver yet
        const driverAppUrl = process.env.REPLIT_DEV_DOMAIN 
          ? `https://${process.env.REPLIT_DEV_DOMAIN}/driver-app.html`
          : 'https://replit.com';

        const keyboard = {
          inline_keyboard: [
            [{ text: '📝 Register as Driver', web_app: { url: driverAppUrl } }],
            [{ text: '📋 Driver Requirements', callback_data: 'driver_requirements' }]
          ]
        };

        await ctx.reply('🚗 Welcome to Driver Portal!\n\nYou are not registered as a driver yet. Would you like to register?', { reply_markup: keyboard });
      } else if (!driver.isApproved) {
        // Registered but not approved
        await ctx.reply('⏳ Your driver application is under review.\n\nStatus: Pending Approval\nWe will notify you once your application is approved.');
      } else {
        // Approved driver - show dashboard
        const statusText = driver.isOnline ? (driver.isAvailable ? '🟢 Online & Available' : '🟡 Online & Busy') : '🔴 Offline';
        
        const keyboard = {
          inline_keyboard: [
            [
              { text: driver.isOnline ? '🔴 Go Offline' : '🟢 Go Online', callback_data: driver.isOnline ? 'driver_offline' : 'driver_online' }
            ],
            [
              { text: '📋 My Deliveries', callback_data: 'my_deliveries' },
              { text: '💰 Earnings', callback_data: 'driver_earnings' }
            ]
          ]
        };

        await ctx.reply(`🚗 Driver Dashboard

Status: ${statusText}
Rating: ${driver.rating}⭐ (${driver.totalDeliveries || 0} deliveries)
Zone: ${driver.zone || 'Not assigned'}

Choose an option:`, { reply_markup: keyboard });
      }
    } catch (error) {
      console.error('Error in driver command:', error);
      await ctx.reply('Sorry, unable to access driver portal. Please try again later.');
    }
  });

  // Handle driver-specific callback queries
  bot.on('callback_query', async (ctx) => {
    const data = 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : undefined;
    const telegramUserId = ctx.from?.id.toString();
    
    if (!data || !telegramUserId) return;

    try {
      const user = await storage.getUserByTelegramId(telegramUserId);
      if (!user) return;

      const driver = await storage.getDriverByUserId(user.id);
      if (!driver) return;

      switch (data) {
        case 'driver_online':
          await storage.updateDriverStatus(driver.id, true, true);
          await ctx.answerCbQuery('You are now online and available for deliveries!');
          
          // Request live location sharing
          const locationKeyboard = {
            inline_keyboard: [
              [
                {
                  text: '📍 Share Live Location',
                  callback_data: 'share_live_location'
                }
              ]
            ]
          };
          
          await ctx.editMessageText('🟢 You are now ONLINE and available for deliveries!\n\n📍 Please share your live location to receive nearby orders:', { reply_markup: locationKeyboard });
          break;

        case 'driver_offline':
          await storage.updateDriverStatus(driver.id, false, false);
          await ctx.answerCbQuery('You are now offline');
          await ctx.editMessageText('🔴 You are now OFFLINE\n\nYou will not receive new delivery requests until you go online again.');
          break;

        case 'my_deliveries':
          await ctx.answerCbQuery();
          const deliveries = await storage.getDeliveriesByDriver(driver.id);
          
          if (deliveries.length === 0) {
            await ctx.reply('📋 No deliveries yet. Go online to start receiving orders!');
          } else {
            let deliveriesList = '📋 Your Recent Deliveries:\n\n';
            deliveries.slice(0, 5).forEach((delivery, index) => {
              deliveriesList += `${index + 1}. Order #${delivery.orderId}\n`;
              deliveriesList += `   Status: ${delivery.status}\n`;
              deliveriesList += `   Earnings: ₹${delivery.earnings || 0}\n`;
              if (delivery.deliveryTime) {
                deliveriesList += `   Completed: ${new Date(delivery.deliveryTime).toLocaleDateString()}\n`;
              }
              deliveriesList += '\n';
            });
            await ctx.reply(deliveriesList);
          }
          break;

        case 'driver_earnings':
          await ctx.answerCbQuery();
          await ctx.reply(`💰 Earnings Summary

Total Earnings: ₹${driver.totalEarnings}
Total Deliveries: ${driver.totalDeliveries}
Average per Delivery: ₹${(driver.totalDeliveries || 0) > 0 ? (Number(driver.totalEarnings) / (driver.totalDeliveries || 1)).toFixed(2) : '0'}

Rating: ${driver.rating}⭐`);
          break;

        case 'share_live_location':
          await ctx.answerCbQuery();
          
          // Request live location from user
          await ctx.reply('📍 Please share your current location:', {
            reply_markup: {
              keyboard: [
                [
                  {
                    text: '📍 Share Live Location',
                    request_location: true
                  }
                ]
              ],
              resize_keyboard: true,
              one_time_keyboard: true
            }
          });
          break;

        case 'driver_dashboard':
          await ctx.answerCbQuery();
          const driverAppUrl = process.env.REPLIT_DEV_DOMAIN 
            ? `https://${process.env.REPLIT_DEV_DOMAIN}/driver-app.html`
            : 'https://replit.com';
          
          const dashboardKeyboard = {
            inline_keyboard: [
              [{ text: '🚗 Open Driver Dashboard', web_app: { url: driverAppUrl } }]
            ]
          };
          
          await ctx.reply('🚗 Access your driver dashboard:', { reply_markup: dashboardKeyboard });
          break;

        case 'driver_requirements':
          await ctx.answerCbQuery();
          await ctx.reply(`📋 Driver Requirements

To become a BeU Delivery driver, you need:

📄 Valid driving license
🏍️ Vehicle (motorcycle, bicycle, or car)
📱 Smartphone with internet
📷 Clear photos of:
   • Your driving license
   • Your vehicle
   • Your ID card

✅ Clean driving record
📍 Available in delivery zones
💪 Physical fitness for deliveries

Ready to apply? Use the registration form!`);
          break;
      }
    } catch (error) {
      console.error('Error handling driver callback:', error);
      await ctx.answerCbQuery('Error processing request');
    }
  });

  // Handle location updates from drivers
  bot.on('location', async (ctx) => {
    const location = ctx.message.location;
    const telegramUserId = ctx.from?.id.toString();

    if (!telegramUserId || !location) return;

    try {
      const user = await storage.getUserByTelegramId(telegramUserId);
      if (!user) return;

      const driver = await storage.getDriverByUserId(user.id);
      if (!driver || !driver.isApproved) return;

      // Update driver location
      await storage.updateDriverLocation(driver.id, {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      });

      await ctx.reply('📍 Location updated successfully!\n\nYour location helps us assign nearby delivery orders to you.');
    } catch (error) {
      console.error('Error updating driver location:', error);
      await ctx.reply('Sorry, unable to update your location. Please try again later.');
    }
  });

  // Handle location sharing
  bot.on('location', async (ctx) => {
    const telegramUserId = ctx.from?.id.toString();
    const location = ctx.message.location;
    
    if (!telegramUserId || !location) return;

    try {
      const user = await storage.getUserByTelegramId(telegramUserId);
      if (!user) return;

      const driver = await storage.getDriverByUserId(user.id);
      if (!driver) return;

      // Save driver's live location
      await storage.updateDriverLocation(driver.id, {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date()
      });

      await ctx.reply('✅ Location updated successfully!\n\nYou will now receive orders from nearby restaurants.', {
        reply_markup: {
          remove_keyboard: true
        }
      });

      console.log(`Driver ${driver.name} location updated: ${location.latitude}, ${location.longitude}`);
    } catch (error) {
      console.error('Error saving driver location:', error);
      await ctx.reply('❌ Failed to update location. Please try again.');
    }
  });
}
