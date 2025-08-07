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

    // Check if driver is already registered
    const existingDriver = await storage.getDriverByTelegramId(telegramUserId);
    
    if (existingDriver) {
      // Driver exists, show dashboard
      if (!existingDriver.isApproved) {
        await ctx.reply('⏳ Your driver application is under review.\n\nStatus: Pending Approval\nWe will notify you once your application is approved.');
      } else {
        // Show driver dashboard
        const statusText = existingDriver.isOnline ? (existingDriver.isAvailable ? '🟢 Online & Available' : '🟡 Online & Busy') : '🔴 Offline';
        
        const driverAppUrl = process.env.REPLIT_DEV_DOMAIN 
          ? `https://${process.env.REPLIT_DEV_DOMAIN}/driver-app.html`
          : 'https://replit.com';

        const keyboard = {
          inline_keyboard: [
            [
              { text: existingDriver.isOnline ? '🔴 Go Offline' : '🟢 Go Online', callback_data: existingDriver.isOnline ? 'driver_offline' : 'driver_online' }
            ],
            [{ text: '🚗 Open Driver Dashboard', web_app: { url: driverAppUrl } }],
            [
              { text: '📋 My Deliveries', callback_data: 'my_deliveries' },
              { text: '💰 Earnings', callback_data: 'driver_earnings' }
            ]
          ]
        };

        await ctx.reply(`🚗 Welcome back, ${existingDriver.name}!\n\nStatus: ${statusText}\nRating: ${existingDriver.rating}⭐ (${existingDriver.totalDeliveries || 0} deliveries)\nZone: ${existingDriver.zone || 'Not assigned'}\n\nChoose an option:`, { reply_markup: keyboard });
      }
    } else {
      // New driver - start with contact sharing
      const welcomeMessage = `🚗 Welcome to BeU Delivery Driver Portal!

Hello ${firstName}! I'm your driver assistant for managing deliveries.

📱 To get started, please share your contact information with us. This will help us auto-fill your registration form.`;

      const keyboard = {
        keyboard: [
          [{ text: '📱 Share My Contact', request_contact: true }]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      };

      await ctx.reply(welcomeMessage, { reply_markup: keyboard });
    }
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

Total Earnings: ${driver.totalEarnings} ETB
Total Deliveries: ${driver.totalDeliveries}
Average per Delivery: ${(driver.totalDeliveries || 0) > 0 ? (Number(driver.totalEarnings) / (driver.totalDeliveries || 1)).toFixed(2) : '0'} ETB

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

  // Handle location sharing
  bot.on('location', async (ctx) => {
    const telegramUserId = ctx.from?.id.toString();
    const location = ctx.message.location;
    
    if (!telegramUserId || !location) return;

    try {
      const user = await storage.getUserByTelegramId(telegramUserId);
      if (!user) {
        await ctx.reply('❌ User not found. Please register first.');
        return;
      }

      const driver = await storage.getDriverByUserId(user.id);
      if (!driver) {
        await ctx.reply('❌ Driver profile not found. Please register as a driver first.');
        return;
      }

      if (!driver.isApproved) {
        await ctx.reply('⏳ Your driver application is still pending approval. Please wait for admin approval.');
        return;
      }

      // Save driver's live location
      await storage.updateDriverLocation(driver.id, {
        lat: location.latitude,
        lng: location.longitude
      });

      // Also update driver status to online if they're sharing location
      await storage.updateDriverStatus(driver.id, true, true);

      await ctx.reply('✅ Location updated successfully!\n\nYou are now online and will receive orders from nearby restaurants.', {
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

  // Handle contact sharing
  bot.on('contact', async (ctx) => {
    const telegramUserId = ctx.from?.id.toString();
    const contact = ctx.message.contact;
    
    if (!telegramUserId || !contact) return;

    try {
      // Verify the shared contact is the user's own contact
      if (contact.user_id?.toString() !== telegramUserId) {
        await ctx.reply('❌ Please share your own contact information.', {
          reply_markup: {
            keyboard: [
              [{ text: '📱 Share My Contact', request_contact: true }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        });
        return;
      }

      const phoneNumber = contact.phone_number;
      const firstName = contact.first_name || ctx.from?.first_name || '';
      const lastName = contact.last_name || ctx.from?.last_name || '';
      
      await ctx.reply('✅ Thank you for sharing your contact information!\n\nNow you can proceed with your driver registration. Your phone number will be automatically filled in the form.', {
        reply_markup: {
          remove_keyboard: true
        }
      });

      // Now show registration button with phone number in URL
      const driverAppUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}/driver-app.html?phone=${encodeURIComponent(phoneNumber)}&name=${encodeURIComponent(`${firstName} ${lastName}`.trim())}`
        : `https://replit.com?phone=${encodeURIComponent(phoneNumber)}`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '📝 Complete Driver Registration', web_app: { url: driverAppUrl } }],
          [{ text: '📋 View Requirements', callback_data: 'driver_requirements' }]
        ]
      };

      await ctx.reply('📝 **Complete Your Driver Registration**\n\nClick the button below to open the registration form. Your contact information has been saved and will be auto-filled.', { 
        reply_markup: keyboard,
        parse_mode: 'Markdown'
      });
      
      console.log(`Contact shared by driver ${telegramUserId}: ${phoneNumber}`);
    } catch (error) {
      console.error('Error handling contact sharing:', error);
      await ctx.reply('❌ Failed to process contact information. Please try again.');
    }
  });
}

// Broadcast message to all drivers
export async function broadcastToAllDrivers(broadcastData: {
  title: string;
  message: string;
  imageUrl?: string | null;
  messageType: string;
  timestamp: Date;
}) {
  try {
    // Get all drivers (not users with role 'driver', but actual driver records)
    const drivers = await storage.getAllDrivers();
    
    if (drivers.length === 0) {
      console.log('No drivers found to broadcast to');
      return;
    }

    console.log(`Broadcasting to ${drivers.length} drivers`);
    
    // Log driver details for debugging
    console.log('📊 Driver telegram IDs:', drivers.map(d => ({ 
      name: d.name, 
      telegramId: d.telegramId,
      isApproved: d.isApproved,
      status: d.status
    })));

    // Get the driver bot instance
    const { getDriverBot } = await import('./bot');
    const driverBot = getDriverBot();

    if (!driverBot) {
      console.error('Driver bot not available for broadcasting');
      return;
    }

    // Prepare the message with emoji based on type
    const typeEmojis = {
      welcome: '👋',
      product: '🆕',
      announcement: '📢',
      promotion: '🎉'
    };

    const emoji = typeEmojis[broadcastData.messageType as keyof typeof typeEmojis] || '📢';
    const formattedMessage = `${emoji} ${broadcastData.title}\n\n${broadcastData.message}`;

    // Broadcast to all drivers
    let successCount = 0;
    let errorCount = 0;
    
    for (const driver of drivers) {
      if (driver.telegramId) {
        try {
          console.log(`📤 Sending message to driver ${driver.telegramId} (${driver.name})`);
          
          if (broadcastData.imageUrl) {
            // Send with image
            const imageUrl = `https://${process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'}${broadcastData.imageUrl}`;
            console.log(`📷 Sending image: ${imageUrl}`);
            
            await driverBot.telegram.sendPhoto(
              driver.telegramId,
              { url: imageUrl },
              { caption: formattedMessage }
            );
          } else {
            // Send text only
            await driverBot.telegram.sendMessage(driver.telegramId, formattedMessage);
          }

          console.log(`✅ Message sent successfully to driver ${driver.telegramId}`);
          successCount++;
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`❌ Failed to send message to driver ${driver.telegramId}:`, error);
          console.error(`❌ Error details:`, {
            code: error.code,
            message: error.message,
            description: error.description
          });
          errorCount++;
        }
      } else {
        console.log(`⚠️ Driver ${driver.name} has no telegramId`);
      }
    }
    
    console.log(`📊 Driver broadcast summary: ${successCount} successful, ${errorCount} failed out of ${drivers.length} drivers`);

    console.log('Driver broadcast completed');
  } catch (error) {
    console.error('Error broadcasting to drivers:', error);
    throw error;
  }
}
