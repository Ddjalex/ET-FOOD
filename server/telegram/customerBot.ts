import { Telegraf, Context } from 'telegraf';
import { storage } from '../storage';

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

    const welcomeMessage = `🍕 Welcome to BeU Delivery!

Hello ${firstName}! I'm Enbela, your food delivery assistant.

Ready to order some delicious food?`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🛒 Browse Restaurants', web_app: { url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/customer` } }],
        [{ text: '📋 My Orders', callback_data: 'my_orders' }]
      ]
    };

    await ctx.reply(welcomeMessage, { reply_markup: keyboard });
  });
  // Order food command
  bot.command('order', async (ctx) => {
    const keyboard = {
      inline_keyboard: [
        [{ text: '🛒 Browse Restaurants', web_app: { url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/customer` } }]
      ]
    };

    await ctx.reply('🍕 Ready to order? Browse our restaurants or share your location for nearby options:', { reply_markup: keyboard });
  });

  // Orders command
  bot.command('orders', async (ctx) => {
    const telegramUserId = ctx.from?.id.toString();
    
    if (!telegramUserId) {
      return ctx.reply('Unable to identify user. Please try again.');
    }

    try {
      const user = await storage.getUserByTelegramId(telegramUserId);
      if (!user) {
        return ctx.reply('Please register first by using /start command.');
      }

      const orders = await storage.getOrdersByCustomer(user.id);
      
      if (orders.length === 0) {
        return ctx.reply('📋 You have no orders yet. Start by ordering some delicious food! Use /order command.');
      }

      let ordersList = '📋 Your Recent Orders:\n\n';
      orders.slice(0, 10).forEach((order, index) => {
        const statusEmoji = getStatusEmoji(order.status || 'pending');
        ordersList += `${index + 1}. ${statusEmoji} Order #${order.orderNumber}\n`;
        ordersList += `   Status: ${order.status}\n`;
        ordersList += `   Total: ₹${order.total}\n`;
        ordersList += `   Date: ${new Date(order.createdAt!).toLocaleDateString()}\n\n`;
      });

      await ctx.reply(ordersList);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      await ctx.reply('Sorry, unable to fetch your orders. Please try again later.');
    }
  });

  // Handle location sharing
  bot.on('location', async (ctx) => {
    const location = ctx.message.location;
    const telegramUserId = ctx.from?.id.toString();

    if (!telegramUserId || !location) {
      return ctx.reply('Unable to process location. Please try again.');
    }

    try {
      // Update user location (you might want to store this for delivery)
      await ctx.reply(`📍 Location received! 
Latitude: ${location.latitude}
Longitude: ${location.longitude}

Now you can browse restaurants in your area:`, {
        reply_markup: {
          inline_keyboard: [[
            { text: '🛒 Browse Nearby Restaurants', web_app: { url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/customer?lat=${location.latitude}&lng=${location.longitude}` } }
          ]]
        }
      });
    } catch (error) {
      console.error('Error processing location:', error);
      await ctx.reply('Sorry, unable to process your location. Please try again later.');
    }
  });

  // Handle contact sharing
  bot.on('contact', async (ctx) => {
    const contact = ctx.message.contact;
    const telegramUserId = ctx.from?.id.toString();

    if (!telegramUserId || !contact) {
      return ctx.reply('Unable to process contact. Please try again.');
    }

    try {
      // Update user phone number
      const user = await storage.getUserByTelegramId(telegramUserId);
      if (user) {
        await storage.upsertUser({
          ...user,
          phoneNumber: contact.phone_number,
        });
        
        await ctx.reply('📞 Phone number updated successfully! You can now place orders.');
      }
    } catch (error) {
      console.error('Error processing contact:', error);
      await ctx.reply('Sorry, unable to process your contact. Please try again later.');
    }
  });
}

// Helper function to get status emoji
function getStatusEmoji(status: string): string {
  const statusMap: { [key: string]: string } = {
    'pending': '⏳',
    'confirmed': '✅',
    'preparing': '👨‍🍳',
    'ready': '📦',
    'assigned': '🚗',
    'picked_up': '🏃‍♂️',
    'delivered': '✅',
    'cancelled': '❌'
  };
  return statusMap[status] || '📋';
}
