import axios from 'axios';

async function triggerNotification() {
  // This is a mock script to trigger a notification for testing
  // You would need a valid JWT token to run this
  const token = 'YOUR_JWT_TOKEN_HERE';
  
  try {
    const response = await axios.post('http://localhost:3000/api/v1/notifications', {
      title: 'Real Notification',
      message: 'This is a real notification triggered by the new system!',
      type: 'success'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Notification triggered:', response.data);
  } catch (err) {
    console.error('Failed to trigger notification:', err.response?.data || err.message);
  }
}

// triggerNotification();
