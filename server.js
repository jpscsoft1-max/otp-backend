
// require('dotenv').config();

// const express = require('express');
// const cors = require('cors');
// const twilio = require('twilio');

// const app = express();
// app.use(cors());
// app.use(express.json());

// const accountSid = process.env.TWILIO_SID;
// const authToken = process.env.TWILIO_TOKEN;
// const twilioClient = twilio(accountSid, authToken);

// const otpMap = new Map();

// app.post('/send-otp', async (req, res) => {
//   const { phone } = req.body;
//   const otp = Math.floor(100000 + Math.random() * 900000).toString();

//   console.log('Sending OTP to:', phone);

//   try {
//     const msg = await twilioClient.messages.create({
//       body: `Your login OTP is ${otp}`,
//       from: '+12567895845',
//       to: phone
//     });

//     console.log('OTP sent:', msg.sid);

//     otpMap.set(phone, otp);
//     setTimeout(() => otpMap.delete(phone), 5 * 60 * 1000);

//     res.json({ success: true, message: 'OTP sent' });
//   } catch (err) {
//     console.error('Error sending OTP:', err);
//     res.status(500).json({ success: false, message: 'Failed to send OTP', error: err.message });
//   }
// });

// app.post('/verify-otp', (req, res) => {
//   const { phone, otp } = req.body;
//   const validOtp = otpMap.get(phone);

//   if (otp === validOtp) {
//     otpMap.delete(phone);
//     res.json({ success: true, message: 'OTP verified' });
//   } else {
//     res.status(401).json({ success: false, message: 'Invalid OTP' });
//   }
// });

// app.listen(3001, () => console.log('🚀 Server running on port 3001'));
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const twilio = require('twilio');

const app = express();
app.use(cors());
app.use(express.json());

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_TOKEN;
const twilioClient = twilio(accountSid, authToken);

const otpMap = new Map();

app.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  console.log('Sending OTP to:', phone);

  try {
    const msg = await twilioClient.messages.create({
      body: `Your login OTP is ${otp}`,
      from: '+12567895845',
      to: phone
    });

    console.log('OTP sent:', msg.sid);

    otpMap.set(phone, otp);
    setTimeout(() => otpMap.delete(phone), 5 * 60 * 1000);

    res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.status(500).json({ success: false, message: 'Failed to send OTP', error: err.message });
  }
});

app.post('/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  const validOtp = otpMap.get(phone);

  if (otp === validOtp) {
    otpMap.delete(phone);
    res.json({ success: true, message: 'OTP verified' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid OTP' });
  }
});

// ✅ Add this health-check route
app.get('/', (req, res) => {
  res.send('Server is running ✅');
});

app.listen(3001, () => console.log('🚀 Server running on port 3001'));
