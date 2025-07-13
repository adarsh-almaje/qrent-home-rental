const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');

const app = express();
let emailVerificationData = {};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

mongoose.connect('mongodb://localhost:27017/rentalDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

const ownerSchema = new mongoose.Schema({
  fname: { type: String, required: true },
  lname: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String, required: true },
  houseImage: { type: String, required: true },
  price: { type: Number, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  role: { type: String, default: "Owner" },
  bhk: { type: Number, required: true }, // Added BHK to schema
});

const Owner = mongoose.model('Owner', ownerSchema);

// Configure Multer for File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Directory where images will be stored
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Unique filename
    },
});

const upload = multer({ storage });
app.post('/register', upload.single('house-image'), async (req, res) => {
  try {
      const { fname, lname, phone, email, address, latitude, longitude, price, password, bhk } = req.body;

      const newOwner = new Owner({
          fname,
          lname,
          phone,
          email,
          address,
          houseImage: req.file ? req.file.path : null, // Save file path
          latitude,
          longitude,
          price,
          password,
          bhk, // Save the BHK value
      });

      await newOwner.save();
      res.send('Registration successful');
  } catch (err) {
      console.error('Error saving data:', err);
      res.status(500).send('Error saving data');
  }
});
app.get('/api/owners', async (req, res) => {
  try {
      const owners = await Owner.find({});
      res.json(owners);
  } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching data');
  }
});

// Serve the Owner's dashboard
app.get('/owners', (req, res) => {
  res.sendFile(path.join(__dirname, 'owners.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

app.get('/owner-register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'O-register.html'));
});


app.get('/owner-registration',(req,res)=>{
  res.sendFile(path.join(__dirname, 'views', 'ownerregister.html'));

})
app.post('/send-code', async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).send('Invalid email format');
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000);
  emailVerificationData[email] = verificationCode;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'avinashkesanur@gmail.com',
      pass: 'boqv sxtv kbud zvhc',
    },
  });

  const mailOptions = {
    to: email,
    subject: 'Verification Code',
    text: `Your verification code is: ${verificationCode}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send('Verification code sent');
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to send email');
  }
});

app.post('/verify-code', (req, res) => {
  const { email, code } = req.body;

  if (emailVerificationData[email] && emailVerificationData[email] == code) {
    delete emailVerificationData[email];
    res.send('Verification successful');
  } else {
    res.status(400).send('Invalid verification code');
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
