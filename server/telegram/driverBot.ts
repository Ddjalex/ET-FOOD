import { Telegraf, Context } from 'telegraf';
import { storage } from '../storage';

// Driver notification function for new orders
export async function notifyDriverNewOrder(telegramId: string, orderData: any) {
  try {
    console.log(`📱 Sending order notification to driver ${telegramId}`);
    
    const { driverBot } = await import('./bot');
    if (!driverBot) {
      console.error('❌ Driver bot not available');
      return;
    }

    const message = `🚨 NEW DELIVERY ORDER!

📦 Order: ${orderData.orderNumber}
🏪 Restaurant: ${orderData.restaurantName}  
👤 Customer: ${orderData.customerName}
💰 Estimated Earnings: ${orderData.estimatedEarnings} ETB
📍 Distance: ${orderData.distance} km

Open your driver app to accept this order!`;

    await driverBot.telegram.sendMessage(telegramId, message, {
      reply_markup: {
        inline_keyboard: [[
          { text: '🚗 Open Driver App', web_app: { 
            url: process.env.REPLIT_DEV_DOMAIN 
              ? `https://${process.env.REPLIT_DEV_DOMAIN}/driver-app.html`
              : 'https://replit.com'
          }}
        ]]
      }
    });

    console.log(`✅ Order notification sent to driver ${telegramId}`);
  } catch (error) {
    console.error('❌ Error sending order notification to driver:', error);
  }
}

// Real-time driver approval notification
export async function notifyDriverApproval(telegramId: string, driverData: any) {
  try {
    console.log(`🎉 Sending approval notification to driver ${telegramId}`);
    
    const { driverBot } = await import('./bot');
    if (!driverBot) {
      console.error('❌ Driver bot not available');
      return;
    }

    const message = `🎉 Congratulations ${driverData.name}! Your driver application has been approved.

✅ You can now start accepting delivery orders!

📍 **IMPORTANT: To receive orders, you must share your live location when you go online.**

Use the buttons below to get started:`;

    await driverBot.telegram.sendMessage(telegramId, message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📍 Share Location & Go Online', callback_data: 'share_location_instructions' }],
          [{ text: '🚗 Open Driver Dashboard', callback_data: 'open_dashboard_with_location_check' }]
        ]
      }
    });

    console.log(`✅ Approval notification sent to driver ${telegramId}`);
  } catch (error) {
    console.error('❌ Error sending approval notification:', error);
  }
}

// Real-time driver registration confirmation notification
export async function notifyDriverRegistrationReceived(telegramId: string, driverData: any) {
  try {
    console.log(`📋 Sending registration confirmation to driver ${telegramId}`);
    
    const { driverBot } = await import('./bot');
    if (!driverBot) {
      console.error('❌ Driver bot not available');
      return;
    }

    const message = `📋 **Registration Received Successfully!**

✅ **Thank you for registering as a driver**
👤 **Name**: ${driverData.name}
📱 **Phone**: ${driverData.phoneNumber}
🚗 **Vehicle**: ${driverData.vehicleType}${driverData.vehiclePlate ? ` (${driverData.vehiclePlate})` : ''}

⏳ **Status**: Pending Approval
Your application is now under review by our admin team.

📋 **What happens next?**
1. Our team will review your documents
2. You'll receive a notification once approved
3. After approval, share your live location to start receiving orders

**Note**: Approval usually takes 24-48 hours. You'll be notified immediately via this bot once approved!`;

    await driverBot.telegram.sendMessage(telegramId, message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 Check Application Status', callback_data: 'check_status' }],
          [{ text: '📞 Contact Support', callback_data: 'contact_support' }]
        ]
      }
    });

    console.log(`✅ Registration confirmation sent to driver ${telegramId}`);
  } catch (error) {
    console.error('❌ Error sending registration confirmation:', error);
  }
}

// Real-time driver rejection notification
export async function notifyDriverRejection(telegramId: string, reason?: string) {
  try {
    console.log(`❌ Sending rejection notification to driver ${telegramId}`);
    
    const { driverBot } = await import('./bot');
    if (!driverBot) {
      console.error('❌ Driver bot not available');
      return;
    }

    const message = `❌ **Driver Application Update**

Unfortunately, your driver application has been rejected.

${reason ? `**Reason**: ${reason}` : '**Reason**: Please contact support for more details.'}

📞 **Need Help?**
Contact our support team if you have questions about this decision.

You can reapply after addressing the mentioned issues.`;

    await driverBot.telegram.sendMessage(telegramId, message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📝 Apply Again', callback_data: 'reapply_driver' }],
          [{ text: '📞 Contact Support', callback_data: 'contact_support' }]
        ]
      }
    });

    console.log(`✅ Rejection notification sent to driver ${telegramId}`);
  } catch (error) {
    console.error('❌ Error sending rejection notification:', error);
  }
}

// Notify driver when they go online after sharing location
export async function notifyDriverOnline(telegramId: string, driverData: any) {
  try {
    console.log(`🟢 Sending online notification to driver ${telegramId}`);
    
    const { driverBot } = await import('./bot');
    if (!driverBot) {
      console.error('❌ Driver bot not available');
      return;
    }

    const driverAppUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}/driver-app.html`
      : 'https://replit.com';

    const message = `🟢 **YOU'RE NOW ONLINE!**

✅ Live location shared successfully
🚗 **Status**: Online & Available for deliveries
📍 **Zone**: ${driverData.zone || 'City-wide'}

You can now receive delivery orders! Your driver dashboard is ready.`;

    await driverBot.telegram.sendMessage(telegramId, message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚗 Open Driver Dashboard', web_app: { url: driverAppUrl } }],
          [{ text: '📊 View Earnings', callback_data: 'driver_earnings' }, { text: '📋 My Orders', callback_data: 'my_deliveries' }]
        ]
      }
    });

    console.log(`✅ Online notification sent to driver ${telegramId}`);
  } catch (error) {
    console.error('❌ Error sending online notification:', error);
  }
}

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
      // Driver exists, check approval status  
      if (!existingDriver.isApproved) {
        await ctx.reply('⏳ Your driver application is under review.\n\nStatus: Pending Approval\nWe will notify you once your application is approved.');
      } else {
        // Approved driver - show location sharing instructions first
        const locationInstructions = `🚗 **Welcome back, ${existingDriver.name}!**

You are an approved driver! To start working:

📍 **Step 1: Share your live location to go online**
1. Click the 📎 attachment icon below
2. Select 📍 **Location** from the menu  
3. Choose **"Share My Live Location for..."**
4. Select **"until I turn it off"** for continuous tracking
5. Tap **Share** to start location sharing

Once you share your location, you'll be online and can access your delivery dashboard.`;

        await ctx.reply(locationInstructions, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '❓ Need Help with Location Sharing', callback_data: 'location_help' }],
              [{ text: '📋 View Driver Requirements', callback_data: 'driver_requirements' }]
            ]
          }
        });
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
        // Approved driver - check if they're online first
        const statusText = driver.isOnline ? (driver.isAvailable ? '🟢 Online & Available' : '🟡 Online & Busy') : '🔴 Offline';
        
        if (!driver.isOnline) {
          // Driver not online - need to share location first
          await ctx.reply(`🚗 **Driver Status: OFFLINE**

📍 To start receiving orders, you need to share your live location first:

**Instructions:**
1. Click 📎 attachment icon below
2. Select 📍 Location
3. Choose "Share My Live Location for..."
4. Select "until I turn it off"
5. Tap Share to go online

After sharing your location, you can access your dashboard.`, {
            reply_markup: {
              inline_keyboard: [
                [{ text: '❓ Need Help with Location Sharing', callback_data: 'location_help' }],
                [{ text: '📋 Driver Requirements', callback_data: 'driver_requirements' }]
              ]
            }
          });
        } else {
          // Driver is online - show dashboard access
          const driverAppUrl = process.env.REPLIT_DEV_DOMAIN 
            ? `https://${process.env.REPLIT_DEV_DOMAIN}/driver-app.html`
            : 'https://replit.com';
            
          const keyboard = {
            inline_keyboard: [
              [{ text: '🚗 Open Driver Dashboard', web_app: { url: driverAppUrl } }],
              [
                { text: '📋 My Deliveries', callback_data: 'my_deliveries' },
                { text: '💰 Earnings', callback_data: 'driver_earnings' }
              ]
            ]
          };

          await ctx.reply(`🚗 **Driver Dashboard**

🟢 Status: ${statusText}
⭐ Rating: ${driver.rating} (${driver.totalDeliveries || 0} deliveries)
📍 Zone: ${driver.zone || 'Not assigned'}

You are online and can receive delivery orders!`, { 
            reply_markup: keyboard 
          });
        }
      }
    } catch (error) {
      console.error('Error in driver command:', error);
      await ctx.reply('Sorry, unable to access driver portal. Please try again later.');
    }
  });

  // Handle location messages for live location sharing  
  bot.on('location', async (ctx) => {
    const telegramUserId = ctx.from?.id.toString();
    const location = ctx.message.location;
    
    if (!telegramUserId || !location) return;

    try {
      console.log(`📍 Received location from driver ${telegramUserId}:`, location);
      
      // Get driver by telegram ID
      const driver = await storage.getDriverByTelegramId(telegramUserId);
      
      if (!driver) {
        await ctx.reply('❌ Driver not found. Please register first using /start');
        return;
      }

      if (!driver.isApproved) {
        await ctx.reply('⏳ Your driver application is still pending approval. You\'ll be notified once approved.');
        return;
      }

      // Check if this is live location using proper type assertion
      const locationWithLivePeriod = location as any;
      if (locationWithLivePeriod.live_period && locationWithLivePeriod.live_period > 0) {
        console.log(`🔴 Live location sharing started by driver ${driver.id}`);
        
        // Update driver location and set online
        await storage.updateDriverLocation(driver.id, {
          lat: location.latitude,
          lng: location.longitude
        });
        
        // Set driver online and available
        await storage.updateDriverStatus(driver.id, true, true);
        
        // Send success notification with dashboard access
        await notifyDriverOnline(telegramUserId, driver);
        
        console.log(`✅ Driver ${driver.id} is now online and available`);
      } else {
        // Regular location, not live location
        await ctx.reply(`📍 **Location received, but you need to share LIVE LOCATION to go online.**

To start working:
1. Click 📎 attachment icon below
2. Select 📍 **Location**
3. Choose **"Share My Live Location for..."**
4. Select **"until I turn it off"**
5. Tap **Share**

This will make you available for delivery orders!`);
      }
    } catch (error) {
      console.error('Error handling location:', error);
      await ctx.reply('❌ Error processing location. Please try again.');
    }
  });

  // Handle contact sharing for new driver registration
  bot.on('contact', async (ctx) => {
    const telegramUserId = ctx.from?.id.toString();
    const contact = ctx.message.contact;
    
    if (!telegramUserId || !contact) return;

    try {
      console.log(`📱 Received contact from ${telegramUserId}:`, contact);
      
      // Check if user is sharing their own contact
      if (contact.user_id?.toString() === telegramUserId) {
        const firstName = ctx.from?.first_name || contact.first_name;
        const lastName = ctx.from?.last_name || contact.last_name || '';
        const phoneNumber = contact.phone_number;
        
        // Create or update user
        const userData = {
          telegramUserId,
          telegramUsername: ctx.from?.username,
          firstName,
          lastName,
          role: 'driver',
        };
        
        const user = await storage.upsertUser(userData);
        
        // Generate registration URL with auto-fill data
        const driverRegUrl = process.env.REPLIT_DEV_DOMAIN 
          ? `https://${process.env.REPLIT_DEV_DOMAIN}/driver-app.html?phone=${encodeURIComponent(phoneNumber)}&name=${encodeURIComponent(`${firstName} ${lastName}`.trim())}`
          : 'https://replit.com';
          
        await ctx.reply(`✅ **Contact received!** 
        
Thanks ${firstName}! Your information has been saved.

📝 **Next: Complete Your Driver Registration**
Your phone number (${phoneNumber}) will be auto-filled in the registration form.`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🚗 Complete Driver Registration', web_app: { url: driverRegUrl } }],
              [{ text: '📋 View Requirements', callback_data: 'driver_requirements' }]
            ]
          }
        });
      } else {
        await ctx.reply('❌ Please share your own contact information.');
      }
    } catch (error) {
      console.error('Error handling contact:', error);
      await ctx.reply('❌ Error processing contact. Please try again.');
    }
  });

  // Handle driver-specific callback queries
  bot.on('callback_query', async (ctx) => {
    const data = 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : undefined;
    const telegramUserId = ctx.from?.id.toString();
    
    if (!data || !telegramUserId) return;

    try {
      const user = await storage.getUserByTelegramId(telegramUserId);
      
      switch (data) {
        case 'location_help':
          await ctx.answerCbQuery();
          await ctx.reply(`📍 **How to Share Live Location**

**Step-by-step instructions:**
1. Click the 📎 attachment icon below
2. Select 📍 **Location** from the menu  
3. Choose **"Share My Live Location for..."**
4. Select **"until I turn it off"** for continuous tracking
5. Tap **Share** to start location sharing

⚠️ **Important**: You must share **LIVE LOCATION** (not just current location) to go online and receive delivery orders.

Once you share live location, you'll automatically go online!`);
          break;

        case 'reapply_driver':
          await ctx.answerCbQuery();
          const driverRegUrl = process.env.REPLIT_DEV_DOMAIN 
            ? `https://${process.env.REPLIT_DEV_DOMAIN}/driver-app.html`
            : 'https://replit.com';
          
          await ctx.reply('📝 **Ready to reapply?**\n\nMake sure to address any previous issues mentioned in your rejection notice.', {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🚗 Start New Application', web_app: { url: driverRegUrl } }]
              ]
            }
          });
          break;

        case 'contact_support':
          await ctx.answerCbQuery();
          await ctx.reply(`📞 **Contact Support**

For assistance with your driver application:

📧 **Email**: support@beudelivery.com
📱 **Phone**: +251-XXX-XXXX
⏰ **Hours**: 9 AM - 6 PM (Monday - Friday)

Our support team will help resolve any issues with your application.`);
          break;

        case 'driver_requirements':
          await ctx.answerCbQuery();
          await ctx.reply(`📋 **Driver Requirements**

✅ **Vehicle Requirements:**
- Motorcycle or Bicycle only
- Valid vehicle registration
- Plate number (for motorcycles)

✅ **Documents Required:**
- Government ID (Kebele ID or Passport)
- Profile photo
- Contact information

✅ **Other Requirements:**
- Must be 18+ years old
- Reliable phone with internet access
- Ability to share live location

**Note:** Driving license is NOT required for delivery drivers.`);
          break;

        case 'check_status':
          await ctx.answerCbQuery();
          
          // Check driver's current status
          const currentDriver = await storage.getDriverByTelegramId(user.id.toString());
          if (!currentDriver) {
            await ctx.reply('❌ No driver application found. Please register first using /start command.');
            return;
          }

          let statusMessage = `📋 **Driver Application Status**

👤 **Name**: ${currentDriver.name}
📱 **Phone**: ${currentDriver.phoneNumber}
🚗 **Vehicle**: ${currentDriver.vehicleType}${currentDriver.vehiclePlate ? ` (${currentDriver.vehiclePlate})` : ''}

`;

          if (currentDriver.isApproved) {
            statusMessage += `✅ **Status**: APPROVED
🟢 **You can now start receiving orders!**

📍 To go online and receive orders:
1. Share your live location
2. Use the dashboard to manage deliveries`;
          } else if (currentDriver.status === 'rejected') {
            statusMessage += `❌ **Status**: REJECTED
📝 **Reason**: Application did not meet requirements

You can contact support for more information.`;
          } else {
            statusMessage += `⏳ **Status**: PENDING APPROVAL
📝 Your application is under review.

⏰ **Typical review time**: 24-48 hours
📱 You'll receive an instant notification once approved!`;
          }

          await ctx.reply(statusMessage, {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔄 Refresh Status', callback_data: 'check_status' }],
                [{ text: '📞 Contact Support', callback_data: 'contact_support' }]
              ]
            }
          });
          break;

        case 'contact_support':
          await ctx.answerCbQuery();
          await ctx.reply(`📞 **Contact Support**

For any questions or issues with your driver application:

📧 **Email**: support@beudelivery.com
📱 **WhatsApp**: +251911234567
⏰ **Support Hours**: 8 AM - 10 PM (Monday to Sunday)

🚀 **Common Questions:**
• Application status updates
• Document verification issues
• Technical support

Our support team will respond within 24 hours.`);
          break;

        case 'share_location_instructions':
          await ctx.answerCbQuery();
          await ctx.reply(`📍 **How to Share Live Location**

**Step-by-step instructions:**
1. Click the 📎 attachment icon below
2. Select 📍 **Location** from the menu  
3. Choose **"Share My Live Location for..."**
4. Select **"until I turn it off"** for continuous tracking
5. Tap **Share** to start location sharing

⚠️ **Important**: You must share **LIVE LOCATION** (not just current location) to go online and receive delivery orders.

Once you share live location, you'll automatically go online!`);
          break;

        case 'open_dashboard_with_location_check':
          await ctx.answerCbQuery();
          
          // First check if user has an approved driver account
          const driverForDashboard = await storage.getDriverByTelegramId(telegramUserId);
          
          if (!driverForDashboard || !driverForDashboard.isApproved) {
            await ctx.reply('❌ Driver account not found or not approved. Please complete registration first.');
            return;
          }
          
          // Check if driver is online (has shared location)
          if (!driverForDashboard.isOnline) {
            await ctx.reply(`📍 **Location Required First**

To access your driver dashboard, you must share your live location:

1. Click 📎 attachment icon below
2. Select 📍 **Location**
3. Choose **"Share My Live Location for..."**
4. Select **"until I turn it off"**
5. Tap **Share**

After sharing your location, you can access the dashboard.`, {
              reply_markup: {
                inline_keyboard: [
                  [{ text: '📍 Location Help', callback_data: 'share_location_instructions' }]
                ]
              }
            });
            return;
          }
          
          // Driver is online, provide dashboard access
          const driverAppUrl = process.env.REPLIT_DEV_DOMAIN 
            ? `https://${process.env.REPLIT_DEV_DOMAIN}/driver-app.html`
            : 'https://replit.com';
            
          await ctx.reply(`🚗 **Driver Dashboard Access**

✅ Location shared - You're online!
🟢 Status: Ready for orders

Access your dashboard:`, {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🚗 Open Driver Dashboard', web_app: { url: driverAppUrl } }]
              ]
            }
          });
          break;
      }

      // Get driver for driver-specific queries
      if (!user) return;
      const driver = await storage.getDriverByUserId(user.id);
      if (!driver) return;

      switch (data) {

        case 'my_deliveries':
          await ctx.answerCbQuery();
          const driverDeliveries = await storage.getDeliveriesByDriver(driver.id);
          
          if (driverDeliveries.length === 0) {
            await ctx.reply('📋 No deliveries yet. Go online to start receiving orders!');
          } else {
            let deliveriesList = '📋 Your Recent Deliveries:\n\n';
            driverDeliveries.slice(0, 5).forEach((delivery, index) => {
              deliveriesList += `${index + 1}. Order #${delivery.orderId}\n`;
              deliveriesList += `   Status: ${delivery.status}\n`;
              deliveriesList += `   Earnings: ${delivery.earnings || 0} ETB\n`;
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
          
          const detailedInstructions = `📍 **How to Share Your Live Location in Telegram:**

**Step-by-step:**
1. 📎 Click the attachment/paperclip icon at the bottom of this chat
2. 📍 Select "Location" from the menu
3. 🔴 Choose "Share My Live Location for..." (not just "Send selected location")
4. ⏰ Select "until I turn it off" for continuous tracking
5. ✅ Tap "Share" to confirm

**Why this is important:**
• Restaurants can see when you arrive for pickup
• Customers can track your delivery progress
• BeU system gets real-time updates for better coordination

Your location will be shared only while you're working and can be stopped anytime.`;
          
          await ctx.reply(detailedInstructions);
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

        case 'driver_status':
          await ctx.answerCbQuery();
          const statusMessage = `🚗 **Your Driver Status**

📊 **Current Status:** ${driver.isOnline ? '🟢 Online' : '🔴 Offline'}
📍 **Location Sharing:** ${driver.isOnline ? '✅ Active' : '❌ Not sharing'}
⭐ **Rating:** ${driver.rating}
🚚 **Total Deliveries:** ${driver.totalDeliveries || 0}
💰 **Total Earnings:** ${driver.totalEarnings || 0} ETB

${driver.isOnline ? 'You are receiving orders!' : 'Share your live location to start receiving orders.'}`;
          
          await ctx.reply(statusMessage);
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

  // Handle live location updates
  bot.on('location', async (ctx) => {
    const telegramUserId = ctx.from?.id.toString();
    if (!telegramUserId) return;

    try {
      const user = await storage.getUserByTelegramId(telegramUserId);
      if (!user) {
        await ctx.reply('Please register first using /start command.');
        return;
      }

      const driver = await storage.getDriverByUserId(user.id);
      if (!driver) {
        await ctx.reply('Please complete your driver registration first.');
        return;
      }

      if (!driver.isApproved) {
        await ctx.reply('⏳ Your driver application is still under review. You cannot start working until approved.');
        return;
      }

      const { latitude, longitude } = ctx.message.location;
      const live_period = (ctx.message.location as any).live_period;

      if (live_period) {
        // Live location started - make driver online and show dashboard access
        await storage.updateDriverLocation(driver.id, { lat: latitude, lng: longitude });
        await storage.updateDriverStatus(driver.id, true, true);

        const driverAppUrl = process.env.REPLIT_DEV_DOMAIN 
          ? `https://${process.env.REPLIT_DEV_DOMAIN}/driver-app.html`
          : 'https://replit.com';

        await ctx.reply(`🟢 **You're now ONLINE!**

📍 Live location sharing activated
🚗 Ready to receive delivery orders
⭐ Current rating: ${driver.rating}

Welcome to your shift, ${driver.name}!`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🚗 Open Driver Dashboard', web_app: { url: driverAppUrl } }],
              [
                { text: '📊 My Stats', callback_data: 'driver_status' },
                { text: '💰 Earnings', callback_data: 'driver_earnings' }
              ],
              [{ text: '📋 Help & Support', callback_data: 'driver_help' }]
            ]
          }
        });

        console.log(`✅ Driver ${driver.name} (${driver.id}) is now online with live location sharing`);
      } else {
        // Static location received - remind about live location requirement
        await ctx.reply(`📍 **Location received, but you need to share **Live Location** to go online and receive orders.**

To start working:
1. Click 📎 attachment icon
2. Select 📍 Location
3. Choose "Share My Live Location for..."
4. Select "until I turn it off"

This ensures real-time tracking for customers and efficient order delivery.`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '❓ Need Help?', callback_data: 'location_help' }]
            ]
          }
        });
      }
    } catch (error) {
      console.error('Error handling location update:', error);
      await ctx.reply('Sorry, there was an error processing your location. Please try again.');
    }
  });

  // Handle when live location stops
  bot.on('edited_message', async (ctx) => {
    if (!ctx.editedMessage || !('location' in ctx.editedMessage)) return;
    
    const telegramUserId = ctx.from?.id.toString();
    if (!telegramUserId) return;

    try {
      const user = await storage.getUserByTelegramId(telegramUserId);
      if (!user) return;

      const driver = await storage.getDriverByUserId(user.id);
      if (!driver) return;

      // Check if live location stopped (live_period = 0)
      const live_period = (ctx.editedMessage.location as any)?.live_period;
      
      if (live_period === 0) {
        // Live location stopped - make driver offline
        await storage.updateDriverStatus(driver.id, false, false);

        await ctx.reply(`🔴 **Live location sharing stopped**

You are now OFFLINE. To receive deliveries again:

📍 **Start sharing live location:**
1. Click 📎 attachment icon
2. Select 📍 Location
3. Choose "Share My Live Location for..."
4. Select "until I turn it off"`);
      }
    } catch (error) {
      console.error('Error handling location stop:', error);
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

// Send approval notification to driver via Telegram
export async function sendApprovalNotificationToDriver(telegramId: string, driverName: string) {
  try {
    console.log(`📱 Sending approval notification to driver ${telegramId} (${driverName})`);
    
    const { driverBot } = await import('./bot');
    if (!driverBot) {
      console.error('❌ Driver bot not available');
      return;
    }

    const driverAppUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}/driver-app.html`
      : 'https://replit.com';

    const approvalMessage = `🎉 **CONGRATULATIONS!**

✅ Your driver application has been **APPROVED!**

🚗 You are now an official BeU Delivery driver!

**Next Steps:**
📍 Share your live location to start receiving orders
🚗 Access your driver dashboard
💰 Start earning with deliveries

**Important:** To receive orders, you must share your live location first:
1. Click 📎 attachment icon
2. Select 📍 Location  
3. Choose "Share My Live Location for..."
4. Select "until I turn it off"

Welcome to the BeU family, ${driverName}! 🎉`;

    await driverBot.telegram.sendMessage(telegramId, approvalMessage, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚗 Open Driver Dashboard', web_app: { url: driverAppUrl } }],
          [{ text: '📍 How to Share Live Location', callback_data: 'location_help' }],
          [{ text: '📋 Driver Guide', callback_data: 'driver_requirements' }]
        ]
      },
      parse_mode: 'Markdown'
    });

    console.log(`✅ Approval notification sent to driver ${telegramId}`);
  } catch (error) {
    console.error('❌ Error sending approval notification to driver:', error);
  }
}

// Send rejection notification to driver via Telegram
export async function sendRejectionNotificationToDriver(telegramId: string, driverName: string, reason?: string) {
  try {
    console.log(`📱 Sending rejection notification to driver ${telegramId} (${driverName})`);
    
    const { driverBot } = await import('./bot');
    if (!driverBot) {
      console.error('❌ Driver bot not available');
      return;
    }

    const rejectionMessage = `❌ **Application Status Update**

Unfortunately, your driver application has been **declined**.

${reason ? `**Reason:** ${reason}` : ''}

**What you can do:**
• Review our driver requirements
• Ensure all documents are clear and valid
• Contact support if you have questions
• You can reapply after addressing any issues

We encourage you to review the requirements and apply again when ready.

Thank you for your interest in BeU Delivery.`;

    await driverBot.telegram.sendMessage(telegramId, rejectionMessage, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 Review Requirements', callback_data: 'driver_requirements' }],
          [{ text: '📞 Contact Support', url: 'https://t.me/BeUSupport' }]
        ]
      },
      parse_mode: 'Markdown'
    });

    console.log(`✅ Rejection notification sent to driver ${telegramId}`);
  } catch (error) {
    console.error('❌ Error sending rejection notification to driver:', error);
  }
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
            code: (error as any).code,
            message: (error as any).message,
            description: (error as any).description
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
