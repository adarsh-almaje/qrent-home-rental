const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
let emailVerificationData = {}; // Temporary storage for email verification codes

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

app.get('/owner-register',(req,res)=>{
  res.sendFile(path.join(__dirname, 'views', 'O-register.html'));

}

)
// Send verification email with a random 6-digit code
app.post('/send-code', async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).send('Invalid email format');
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit code
  emailVerificationData[email] = verificationCode; // Save code temporarily

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'avinashkesanur@gmail.com', // Replace with your Gmail
      pass: 'boqv sxtv kbud zvhc',    // Replace with app password
    },
  });

  const mailOptions = {
    to: email,
    subject: 'Email Verification Code',
    text: `Your verification code is: ${verificationCode}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send('Verification code sent');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Failed to send email');
  }
});

// Handle code verification
app.post('/verify-code', (req, res) => {
  const { email, code } = req.body;

  if (emailVerificationData[email] && parseInt(code) === emailVerificationData[email]) {
    delete emailVerificationData[email]; // Clear the data after successful verification
    res.status(200).send('Verification successful');
  } else {
    res.status(400).send('Invalid verification code');
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
