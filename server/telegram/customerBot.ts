import { Telegraf, Context } from 'telegraf';
import { storage } from '../storage';

export async function setupCustomerBot(bot: Telegraf) {
  // Order food command
  bot.command('order', async (ctx) => {
    const keyboard = {
      inline_keyboard: [
        [{ text: '🛒 Browse Restaurants', web_app: { url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/customer` } }],
        [{ text: '📍 Share Location', request_location: true }]
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
        const statusEmoji = getStatusEmoji(order.status);
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

function getStatusEmoji(status: string): string {
  const statusEmojis: { [key: string]: string } = {
    'pending': '⏳',
    'confirmed': '✅',
    'preparing': '👨‍🍳',
    'ready': '🍽️',
    'assigned': '🚗',
    'picked_up': '📦',
    'delivered': '✅',
    'cancelled': '❌'
  };

  return statusEmojis[status] || '📋';
}
