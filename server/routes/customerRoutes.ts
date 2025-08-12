import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

// Check if customer exists by userId
router.get('/customer/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('🔍 GET /customer/:userId called with:', userId);
    
    const customer = await storage.getCustomer(userId);
    
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }
    
    res.json({ 
      success: true, 
      customer 
    });
  } catch (error) {
    console.error('❌ Error fetching customer:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Register new customer (one-time phone number capture)
router.post('/customer/register', async (req, res) => {
  try {
    const { phoneNumber, firstName, lastName, telegramUserId, telegramUsername } = req.body;
    
    console.log('🆕 POST /customer/register called with:', {
      phoneNumber,
      firstName,
      lastName,
      telegramUserId
    });

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Check if customer already exists with this phone number
    const existingCustomer = await storage.getCustomerByPhone(phoneNumber);
    if (existingCustomer) {
      console.log('📱 Customer already exists with phone:', phoneNumber);
      return res.json({
        success: true,
        customer: existingCustomer,
        message: 'Customer already exists'
      });
    }

    // Generate unique userId
    const userId = await storage.generateUniqueUserId();

    // Create new customer
    const customerData = {
      userId,
      phoneNumber,
      firstName: firstName || '',
      lastName: lastName || '',
      telegramUserId: telegramUserId || null,
      telegramUsername: telegramUsername || null,
      isActive: true,
      orderHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newCustomer = await storage.createCustomer(customerData);
    
    console.log('✅ New customer registered:', {
      userId: newCustomer.userId,
      phoneNumber: newCustomer.phoneNumber
    });

    res.status(201).json({
      success: true,
      customer: newCustomer,
      message: 'Customer registered successfully'
    });
  } catch (error) {
    console.error('❌ Error registering customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register customer'
    });
  }
});

// Update customer information
router.put('/customer/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    console.log('🔄 PUT /customer/:userId called:', { userId, updateData });

    const updatedCustomer = await storage.updateCustomer(userId, updateData);
    
    res.json({
      success: true,
      customer: updatedCustomer,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer'
    });
  }
});

// Get customer by phone number (for lookup during registration)
router.get('/customer/phone/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    console.log('🔍 GET /customer/phone/:phoneNumber called with:', phoneNumber);
    
    const customer = await storage.getCustomerByPhone(phoneNumber);
    
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }
    
    res.json({ 
      success: true, 
      customer 
    });
  } catch (error) {
    console.error('❌ Error fetching customer by phone:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

export default router;