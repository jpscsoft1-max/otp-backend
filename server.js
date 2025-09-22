require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');

const app = express();
app.use(cors());
app.use(express.json());

// Cache token for 5 minutes (short-lived for testing)
const tokenCache = new NodeCache({ stdTTL: 5 * 60 });
const otpMap = new Map();

// MessageCentral credentials
const CUSTOMER_ID = process.env.CUSTOMER_ID; // e.g., 'C-0E536C63037446A'
const KEY = process.env.KEY; // Base64 password from MessageCentral
const API_BASE_URL = 'https://cpaas.messagecentral.com';

// ✅ Generate fresh token
async function getAuthToken() {
  let token = tokenCache.get('mcToken');
  if (token) return token;

  try {
    const res = await axios.get(`${API_BASE_URL}/auth/v1/authentication/token`, {
      params: {
        country: 'IN',
        customerId: CUSTOMER_ID,
        key: KEY,
        scope: 'NEW',
      },
      headers: { accept: '*/*' },
    });

    token = res.data.token;
    tokenCache.set('mcToken', token);
    console.log('✅ New MessageCentral token generated');
    return token;
  } catch (err) {
    console.error('❌ Error generating token:', err.response?.data || err.message);
    throw new Error('Failed to generate MessageCentral token');
  }
}

// ✅ Send OTP endpoint
app.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required' });

  console.log('📨 Sending OTP to:', phone);

  try {
    const token = await getAuthToken();

    const sendResponse = await axios.post(
      `${API_BASE_URL}/verification/v3/send`,
      null, // Body is empty
      {
        params: {
          countryCode: '91',
          customerId: CUSTOMER_ID,
          flowType: 'SMS',
          mobileNumber: phone, // 10-digit
        },
        headers: { authToken: token },
      }
    );

    const verificationId = sendResponse.data?.data?.verificationId;
    if (!verificationId) throw new Error('No verificationId returned');

    // Store verificationId and token for this phone
    otpMap.set(phone, { verificationId, token });
    setTimeout(() => otpMap.delete(phone), 5 * 60 * 1000); // expires in 5 mins

    console.log('✅ OTP sent. verificationId:', verificationId);
    res.json({ success: true, message: 'OTP sent', verificationId });
  } catch (err) {
    console.error('❌ Error sending OTP:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// ✅ Verify OTP endpoint
// ✅ Verify OTP endpoint
app.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  const entry = otpMap.get(phone);

  if (!entry) return res.status(401).json({ success: false, message: 'OTP expired or not sent' });

  try {
    const { verificationId, token } = entry;

    const verifyResponse = await axios.get(
      `${API_BASE_URL}/verification/v3/validateOtp`,
      {
        params: {
          countryCode: '91',
          mobileNumber: phone,
          verificationId,
          customerId: CUSTOMER_ID,
          code: otp,
        },
        headers: { authToken: token },
      }
    );

    const verificationStatus = verifyResponse.data?.data?.verificationStatus;

    if (verificationStatus === 'VERIFICATION_COMPLETED' || verificationStatus === 'SUCCESS') {
      otpMap.delete(phone);
      console.log('✅ OTP verified successfully');
      res.json({ success: true, message: 'OTP verified' });
    } else {
      console.log('❌ OTP verification failed, response:', verifyResponse.data);
      res.status(401).json({ success: false, message: 'Invalid OTP' });
    }
  } catch (err) {
    console.error('❌ Error verifying OTP:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
});

// Health check
app.get('/', (req, res) => res.send('🚀 Backend is running ✅'));

app.listen(3001, () => console.log('🚀 Server running on port 3001'));
