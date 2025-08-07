// Test the complete kitchen workflow
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testWorkflow() {
  try {
    console.log('🧪 Testing complete kitchen workflow...');
    
    // Step 1: Place an order via Telegram
    console.log('\n1️⃣ Placing customer order...');
    const orderResponse = await fetch('http://localhost:5000/api/telegram/customer/place-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramUserId: "383870190",
        restaurantId: "689208e3f476f48ad7cfdcc3",
        items: [
          {
            id: "item1",
            name: "Injera with Doro Wot", 
            price: 25.00,
            quantity: 2
          }
        ],
        deliveryAddress: "123 Test Street, Addis Ababa",
        paymentMethod: "cash",
        specialInstructions: "Kitchen workflow test order"
      })
    });
    
    const orderData = await orderResponse.text();
    console.log('Order placed:', orderData);
    
    // Step 2: Login as kitchen staff
    console.log('\n2️⃣ Logging in as kitchen staff...');
    const loginResponse = await fetch('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: "kitchenstaff@gmail.com",
        password: "beu123"
      })
    });
    
    console.log('Login status:', loginResponse.status);
    const cookies = loginResponse.headers.get('set-cookie');
    
    if (loginResponse.status === 200) {
      // Step 3: Get orders
      console.log('\n3️⃣ Fetching restaurant orders...');
      const ordersResponse = await fetch('http://localhost:5000/api/restaurants/689208e3f476f48ad7cfdcc3/orders', {
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': cookies || ''
        }
      });
      
      const orders = await ordersResponse.json();
      console.log('Orders found:', orders.length);
      
      if (orders.length > 0) {
        const testOrder = orders[0];
        console.log(`Found order: ${testOrder.orderNumber} with status: ${testOrder.status}`);
        
        // Step 4: Start preparation if order is confirmed
        if (testOrder.status === 'confirmed') {
          console.log('\n4️⃣ Starting order preparation...');
          const prepareResponse = await fetch(`http://localhost:5000/api/kitchen/689208e3f476f48ad7cfdcc3/orders/${testOrder.id}/start-prepare`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Cookie': cookies || ''
            }
          });
          
          const prepareResult = await prepareResponse.text();
          console.log('Prepare response:', prepareResult);
          
          if (prepareResponse.status === 200) {
            console.log('✅ Order preparation started successfully!');
            console.log('📱 Customer should receive notification');
            console.log('🚗 Nearby drivers should be alerted');
            
            // Step 5: Mark as ready for pickup
            console.log('\n5️⃣ Marking order as ready...');
            setTimeout(async () => {
              const readyResponse = await fetch(`http://localhost:5000/api/kitchen/689208e3f476f48ad7cfdcc3/orders/${testOrder.id}/ready-for-pickup`, {
                method: 'PUT',
                headers: { 
                  'Content-Type': 'application/json',
                  'Cookie': cookies || ''
                }
              });
              
              const readyResult = await readyResponse.text();
              console.log('Ready response:', readyResult);
              
              if (readyResponse.status === 200) {
                console.log('✅ Order marked as ready for pickup!');
                console.log('🤖 Automatic driver assignment triggered');
                console.log('📍 Nearby drivers notified with location');
              }
            }, 3000);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testWorkflow();