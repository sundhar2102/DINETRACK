const http = require('http');

const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

async function runPaymentTest() {
  console.log('🧪 Starting Reservation Bill & Online Payment Test...\n');

  // 1. Login Customer
  const customerLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'alex@smarttable.com', password: 'Password123!' });

  if (customerLogin.status !== 200) {
    throw new Error('Customer login failed: ' + JSON.stringify(customerLogin.body));
  }
  const token = customerLogin.body.data.token;
  console.log('✅ 1. Customer authenticated successfully');

  // 2. Fetch a restaurant
  const restRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/restaurants/nearby?lat=13.0604&lng=80.2437',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const restaurant = restRes.body.data[0];
  console.log(`✅ 2. Found restaurant: ${restaurant.name} (ID: ${restaurant.id})`);

  // 3. Create Reservation with Pre-Ordered Food
  const bookingPayload = {
    restaurantId: restaurant.id,
    guestCount: 2,
    reservationDate: '2026-08-25',
    reservationTime: '19:30',
    specialRequests: 'Window seat preferred',
    preOrderItems: [
      { id: 'item_1', name: 'Paneer Butter Masala', price: 280, quantity: 2 },
      { id: 'item_2', name: 'Butter Naan', price: 60, quantity: 4 }
    ]
  };

  const createBookingRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/reservations',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, bookingPayload);

  if (createBookingRes.status !== 201) {
    throw new Error('Create reservation failed: ' + JSON.stringify(createBookingRes.body));
  }
  const reservation = createBookingRes.body.data;
  console.log(`✅ 3. Reservation created (ID: ${reservation.id})`);

  // 4. Fetch Reservation Details via GET /api/reservations/:id
  const getBookingRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/reservations/${reservation.id}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  console.log('GET /api/reservations/:id response:', getBookingRes.status, getBookingRes.body);
  const details = getBookingRes.body.data;
  console.log('✅ 4. Retrieved Reservation Details:');
  console.log(`   - Order ID: ${details.order_id}`);
  console.log(`   - Subtotal: ₹${details.subtotal}`);
  console.log(`   - Tax (5% GST): ₹${details.tax}`);
  console.log(`   - Total Amount: ₹${details.total_amount}`);
  console.log(`   - Pre-Ordered Items Count: ${details.items ? details.items.length : 0}`);
  console.log(`   - Payment Status: ${details.payment_status}`);

  if (details.items.length !== 2) throw new Error('Expected 2 items in order');
  if (details.subtotal !== 800) throw new Error(`Expected subtotal 800, got ${details.subtotal}`);
  if (details.total_amount !== 840) throw new Error(`Expected total 840, got ${details.total_amount}`);
  if (details.payment_status !== 'NOT_PAID') throw new Error(`Expected NOT_PAID, got ${details.payment_status}`);

  // 5. Create Payment Order
  const createPaymentRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/payments/create-order',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { reservationId: reservation.id });

  if (createPaymentRes.status !== 200) {
    throw new Error('Create payment order failed: ' + JSON.stringify(createPaymentRes.body));
  }
  const paymentOrder = createPaymentRes.body.data;
  console.log('✅ 5. Razorpay Payment Order Created:');
  console.log(`   - Gateway Order ID: ${paymentOrder.gatewayOrderId}`);
  console.log(`   - Key ID: ${paymentOrder.keyId}`);
  console.log(`   - Amount: ₹${paymentOrder.amount} (${paymentOrder.amountInPaise} paise)`);

  // 6. Verify Payment
  const verifyRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/payments/verify',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    reservationId: reservation.id,
    orderId: details.order_id,
    razorpayOrderId: paymentOrder.gatewayOrderId,
    razorpayPaymentId: `pay_test_${Date.now()}`,
    paymentMethod: 'ONLINE_UPI'
  });

  if (verifyRes.status !== 200) {
    throw new Error('Verify payment failed: ' + JSON.stringify(verifyRes.body));
  }
  console.log(`✅ 6. Payment verified successfully! Txn Ref: ${verifyRes.body.data.transactionReference}`);

  // 7. Refresh Reservation Details
  const refreshedBookingRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/reservations/${reservation.id}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const refreshed = refreshedBookingRes.body.data;
  console.log('✅ 7. Refreshed Reservation Details:');
  console.log(`   - Payment Status: ${refreshed.payment_status}`);
  console.log(`   - Transaction Reference: ${refreshed.transaction_reference}`);
  console.log(`   - Paid At: ${refreshed.paid_at}`);

  if (refreshed.payment_status !== 'SUCCESS') {
    throw new Error('Expected payment_status SUCCESS, got ' + refreshed.payment_status);
  }

  // 8. Test Security: Another user cannot create payment or verify
  const ownerLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'owner@sangeetha.com', password: 'Password123!' });
  const otherToken = ownerLogin.body.data.token;

  const unauthorizedPay = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/payments/create-order',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${otherToken}`
    }
  }, { reservationId: reservation.id });

  if (unauthorizedPay.status === 403) {
    console.log('✅ 8. Security verified: Other user blocked with 403 Forbidden');
  } else {
    throw new Error(`Expected 403 Forbidden for unauthorized payment, got ${unauthorizedPay.status}`);
  }

  console.log('\n🎉 ALL RESERVATION BILL & PAYMENT TESTS PASSED!\n');
}

runPaymentTest().catch(err => {
  console.error('❌ Test Failed:', err);
  process.exit(1);
});
