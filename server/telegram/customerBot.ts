import { Telegraf, Context } from 'telegraf';
import { storage } from '../storage';

// Interface for customer session data
interface CustomerSession {
  userId: string;
  step: 'start' | 'contact_shared' | 'location_shared' | 'ready_to_order';
  contact?: any;
  location?: { latitude: number; longitude: number };
  sessionToken: string;
}

// Store customer sessions in memory (in production, use Redis or database)
const customerSessions = new Map<string, CustomerSession>();

// Generate session token
function generateSessionToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function setupCustomerBot(bot: Telegraf) {
  console.log('Setting up Customer Bot (Enbela_bot) commands...');

  // Start command for customer bot
  bot.start(async (ctx: Context) => {
    const telegramUserId = ctx.from?.id.toString();
    const username = ctx.from?.username;
    const firstName = ctx.from?.first_name;
    const lastName = ctx.from?.last_name;

    if (!telegramUserId) {
      return ctx.reply('Unable to identify user. Please try again.');
    }

    // Check if user exists or create new customer
    let user = await storage.getUserByTelegramId(telegramUserId);

    if (!user) {
      user = await storage.upsertUser({
        telegramUserId,
        telegramUsername: username,
        firstName,
        lastName,
        role: 'customer',
      });
    }

    // Initialize customer session
    const sessionToken = generateSessionToken();
    customerSessions.set(telegramUserId, {
      userId: user.id,
      step: 'start',
      sessionToken
    });

    const welcomeMessage = `🍕 Welcome to BeU Delivery!

Hello ${firstName}! I'm Enbela, your personal food delivery assistant.

To get started and find the best restaurants near you, I'll need to know your contact and location information. This helps us personalize your experience and ensure accurate delivery.

Please share your contact information first:`;

    const keyboard = {
      keyboard: [
        [{ text: "📱 Share My Contact", request_contact: true }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    };

    await ctx.reply(welcomeMessage, { reply_markup: keyboard });
  });

  // Handle contact sharing
  bot.on('contact', async (ctx) => {
    const telegramUserId = ctx.from?.id.toString();
    if (!telegramUserId) return;

    const session = customerSessions.get(telegramUserId);
    if (!session || session.step !== 'start') {
      return ctx.reply('Please start again by using /start command.');
    }

    // Store contact information
    session.contact = ctx.message.contact;
    session.step = 'contact_shared';
    customerSessions.set(telegramUserId, session);

    const acknowledgmentMessage = `✅ Thank you! I've received your contact information.

Now, to find the best restaurants near you and provide accurate delivery estimates, please share your location:`;

    const locationKeyboard = {
      keyboard: [
        [{ text: "📍 Share My Location", request_location: true }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    };

    await ctx.reply(acknowledgmentMessage, { reply_markup: locationKeyboard });
  });

  // Handle location sharing
  bot.on('location', async (ctx) => {
    const telegramUserId = ctx.from?.id.toString();
    if (!telegramUserId) return;

    const session = customerSessions.get(telegramUserId);
    if (!session || session.step !== 'contact_shared') {
      return ctx.reply('Please start by sharing your contact first. Use /start command.');
    }

    // Store location information
    session.location = {
      latitude: ctx.message.location.latitude,
      longitude: ctx.message.location.longitude
    };
    session.step = 'location_shared';
    customerSessions.set(telegramUserId, session);

    const successMessage = `🎉 Perfect! I've got your location.

Now you're all set to explore delicious restaurants near you. Tap the button below to start ordering:`;

    // Use HTTPS for Telegram Mini Web Apps (required by Telegram)
    const baseUrl = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'https://your-app.replit.app';
    const webAppUrl = `${baseUrl}/telegram-app?session=${session.sessionToken}&userId=${session.userId}&lat=${session.location.latitude}&lng=${session.location.longitude}`;

    const orderKeyboard = {
      inline_keyboard: [
        [{ text: '🍕 Order Food', web_app: { url: webAppUrl } }],
        [{ text: '📋 My Orders', callback_data: 'my_orders' }],
        [{ text: '🏠 Change Location', callback_data: 'change_location' }]
      ]
    };

    await ctx.reply(successMessage, { reply_markup: orderKeyboard });
  });

  // Order food command
  bot.command('order', async (ctx) => {
    const telegramUserId = ctx.from?.id.toString();
    if (!telegramUserId) return;

    const session = customerSessions.get(telegramUserId);
    if (!session || session.step !== 'location_shared') {
      return ctx.reply('Please share your contact and location first by using /start command.');
    }

    // Use HTTPS for Telegram Mini Web Apps (required by Telegram)
    const baseUrl = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'https://your-app.replit.app';
    const webAppUrl = `${baseUrl}/telegram-app?session=${session.sessionToken}&userId=${session.userId}&lat=${session.location?.latitude}&lng=${session.location?.longitude}`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🍕 Order Food', web_app: { url: webAppUrl } }]
      ]
    };

    await ctx.reply('🍕 Ready to order? Browse our restaurants:', { reply_markup: keyboard });
  });

  // Handle callback queries
  bot.on('callback_query', async (ctx) => {
    const telegramUserId = ctx.from?.id.toString();
    if (!telegramUserId) return;

    const data = 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : null;

    if (data === 'my_orders') {
      try {
        const user = await storage.getUserByTelegramId(telegramUserId);
        if (!user) {
          return ctx.answerCbQuery('Please register first by using /start command.');
        }

        const orders = await storage.getOrdersByCustomer(user.id);
        
        if (orders.length === 0) {
          await ctx.answerCbQuery();
          return ctx.reply('📋 You have no orders yet. Start by ordering some delicious food!');
        }

        let orderText = '📋 Your Recent Orders:\n\n';
        orders.slice(0, 5).forEach((order, index) => {
          orderText += `${index + 1}. Order #${order.id.slice(-6)}\n`;
          orderText += `   Status: ${order.status}\n`;
          orderText += `   Total: $${typeof order.total === 'string' ? parseFloat(order.total).toFixed(2) : order.total}\n`;
          orderText += `   Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}\n\n`;
        });

        await ctx.answerCbQuery();
        await ctx.reply(orderText);
      } catch (error) {
        console.error('Error fetching orders:', error);
        await ctx.answerCbQuery('Error fetching orders. Please try again.');
      }
    }

    if (data === 'change_location') {
      const session = customerSessions.get(telegramUserId);
      if (session) {
        session.step = 'start';
        customerSessions.set(telegramUserId, session);
      }

      const locationKeyboard = {
        keyboard: [
          [{ text: "📍 Share My Location", request_location: true }]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      };

      await ctx.answerCbQuery();
      await ctx.reply('📍 Please share your new location:', { reply_markup: locationKeyboard });
    }
  });

  // Handle order placement from Mini Web App
  bot.on('web_app_data', async (ctx: any) => {
    try {
      const telegramUserId = ctx.from?.id.toString();
      if (!telegramUserId) return;

      const webAppData = JSON.parse(ctx.message.web_app_data.data);
      
      // Process the order data received from Mini Web App
      const { items, restaurantId, deliveryAddress, recipientInfo, paymentMethod, total, specialInstructions } = webAppData;

      // Create order in database
      const user = await storage.getUserByTelegramId(telegramUserId);
      if (!user) {
        return ctx.reply('❌ Error: User not found. Please start again with /start');
      }

      // Check if this order was already processed by the API endpoint
      if (webAppData.success && webAppData.orderId) {
        const confirmationMessage = `✅ Order Confirmed!

Order #${webAppData.orderNumber}
Restaurant: ${webAppData.restaurantName || 'Selected Restaurant'}
Total: $${webAppData.total.toFixed(2)}
Payment: ${webAppData.paymentMethod}

Your order is being prepared! Kitchen staff has been notified.

📍 Delivery Address: ${webAppData.deliveryAddress.address}
${webAppData.recipientInfo ? `👤 Recipient: ${webAppData.recipientInfo.name}` : ''}

Estimated delivery time: 25-35 minutes`;

        await ctx.reply(confirmationMessage);
        return;
      }

      // Fallback: create order if not processed by API
      const order = await storage.createOrder({
        customerId: user.id,
        restaurantId,
        orderNumber: `ORD-${Date.now()}`,
        items: JSON.stringify(items),
        subtotal: total.toString(),
        total: total.toString(),
        deliveryAddress: deliveryAddress.address,
        paymentMethod,
        status: 'pending'
      });

      // Send confirmation message
      const confirmationMessage = `✅ Order Confirmed!

Order #${order.id.slice(-6)}
Restaurant: ${webAppData.restaurantName || 'Selected Restaurant'}
Total: $${total.toFixed(2)}
Payment: ${paymentMethod}

Your order is being prepared! We'll notify you with updates.

📍 Delivery Address: ${deliveryAddress.address}
${recipientInfo ? `👤 Recipient: ${recipientInfo.name}` : ''}

Estimated delivery time: 25-35 minutes`;

      await ctx.reply(confirmationMessage);
      
    } catch (error) {
      console.error('Error processing web app data:', error);
      await ctx.reply('❌ Sorry, there was an error processing your order. Please try again.');
    }
  });

  // Handle 'help' command
  bot.help(async (ctx) => {
    const helpMessage = `🤖 BeU Delivery Bot Commands:

/start - Get started with BeU Delivery
/order - Browse restaurants and order food
/orders - View your order history
/help - Show this help message

Need more help? Contact our support team!`;

    await ctx.reply(helpMessage);
  });
}

// Export function to get customer session (for API usage)
export function getCustomerSession(telegramUserId: string): CustomerSession | undefined {
  return customerSessions.get(telegramUserId);
}

// Broadcast message to all customers
export async function broadcastToAllCustomers(broadcastData: {
  title: string;
  message: string;
  imageUrl?: string | null;
  messageType: string;
  timestamp: Date;
}) {
  try {
    // Get all customer users from storage
    const customers = await storage.getUsersByRole('customer');
    
    if (customers.length === 0) {
      console.log('No customers found to broadcast to');
      return;
    }

    console.log(`Broadcasting to ${customers.length} customers`);

    // Get the customer bot instance
    const { getCustomerBot } = await import('./bot');
    const customerBot = getCustomerBot();

    if (!customerBot) {
      console.error('Customer bot not available for broadcasting');
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

    // Broadcast to all customers
    for (const customer of customers) {
      if (customer.telegramUserId) {
        try {
          if (broadcastData.imageUrl) {
            // Send with image
            await customerBot.telegram.sendPhoto(
              customer.telegramUserId,
              { url: `${process.env.REPLIT_DOMAIN || 'http://localhost:5000'}${broadcastData.imageUrl}` },
              { caption: formattedMessage }
            );
          } else {
            // Send text only
            await customerBot.telegram.sendMessage(customer.telegramUserId, formattedMessage);
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Failed to send message to customer ${customer.telegramUserId}:`, error);
        }
      }
    }

    console.log('Broadcast completed');
  } catch (error) {
    console.error('Error broadcasting to customers:', error);
    throw error;
  }
}
