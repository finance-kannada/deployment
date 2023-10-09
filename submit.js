const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const path = require('path');
// const bcrypt = require('bcrypt');
const { GridFsStorage } = require('multer-gridfs-storage');
const multer = require('multer');
const { GridFSBucket } = require('mongodb');
const crypto = require('crypto'); 
const Grid = require('gridfs-stream');
const { Readable } = require('stream');
// Add this line

const app = express();
const PORT = 3000;

// MongoDB Atlas connection URL
const mongoURI = 'mongodb+srv://financekannada44:Q!1werty@cluster0.f2gitkn.mongodb.net/?retryWrites=true&w=majority';

// Connect to MongoDB Atlas
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// Middleware to parse request body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Define a schema for the registration data
const registrationSchema = new mongoose.Schema(
  {
    nameInput: String,
    dobInput: Date,
    sexInput: String,
    emailInput: {
      type: String,
      unique: true,
    },
    phoneInput: String,
    houseInput: String,
    streetInput: String,
    areaInput: String,
    cityInput: String,
    stateInput: String,
    landmarkInput: String,
    usernameInput: String,
    passwordInput: String,
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
  },
  { timestamps: true }
);

// Create a model based on the schema
const Registration = mongoose.model('Registration', registrationSchema);

// Configure nodemailer with your email service credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  port: 465,
  host: 'smtp.gmail.com',
  auth: {
    user: 'financekannada44@gmail.com',
    pass: 'pwfzmlcmmxxvzwep',
  },
});

// Generate a verification token
const generateVerificationToken = (email) => {
  const secret = '<your-secret-key>';
  const token = jwt.sign({ email }, secret, { expiresIn: '3h' });
  return token;
};

// Send verification email
const sendVerificationEmail = async (email, verificationToken) => {
  const verificationLink = `http://localhost:3000/verify?token=${verificationToken}`;

  const mailOptions = {
    from: 'financekannada44@gmail.com',
    to: email,
    subject: 'Email Verification',
text: `Please click the following link to verify your email: ${verificationLink}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
  }
};

// Route for registering a new user
app.post('/register', async (req, res) => {
  const {
    nameInput,
    dobInput,
    sexInput,
    emailInput,
    phoneInput,
    houseInput,
    streetInput,
    areaInput,
    cityInput,
    stateInput,
    landmarkInput,
    passwordInput,
  } = req.body;

  try {
    // Check if email already exists
    const existingRegistration = await Registration.findOne({ emailInput });

    if (existingRegistration) {
      // Email already registered
      console.error('Email already registered:', emailInput);
      const errorMessage = 'Email already registered.';
      res.send(`<script>alert("${errorMessage}"); window.location.href = "/Registeration_page.html";</script>`);
    } else {
      // Generate a verification token
      const verificationToken = generateVerificationToken(emailInput);

      // Create a new registration instance
      const registration = new Registration({
        nameInput,
        dobInput,
        sexInput,
        emailInput,
        phoneInput,
        houseInput,
        streetInput,
        areaInput,
        cityInput,
        stateInput,
        landmarkInput,
        passwordInput,
        verificationToken,
      });

      // Save the registration data to the database
      await registration.save();

      // Send the verification email
      await sendVerificationEmail(emailInput, verificationToken);

    const successMessage = 'Verification email sent. Please verify your account.';
    res.send(`<script>alert("${successMessage}"); window.location.href = "/index.html";</script>`);
    }
  } catch (error) {
    console.error('Error registering user:', error);
    // res.status(500).json({ error: 'An error occurred while registering user.' });
    res.send(`<script>alert("An error occurred while registering user."); window.location.href = "/index.html";</script>`);
  }
});


// Route for verifying user email
app.get('/verify', async (req, res) => {
  const { token } = req.query;

  try {
    // Verify the token
    const secret = '<your-secret-key>';
    const decoded = jwt.verify(token, secret);

    // Find the registration record with the given email
    const registration = await Registration.findOne({ emailInput: decoded.email });

    if (registration) {
      // Update the registration record as verified
      registration.isVerified = true;
      registration.verificationToken = undefined;
      await registration.save();

      // res.status(200).json({ message: 'Email verification successful. You can now log in.' });
      const successMessage = 'Email verified.';
      res.send(`<script>alert("${successMessage}"); window.location.href = "/in_home.html";</script>`);
    } else {
      // res.status(404).json({ error: 'Registration not found.' });
      res.send(`<script>alert("Registeration not found"); window.location.href = "/index.html";</script>`);
    }
  } catch (error) {
    console.error('Error verifying email:', error);
    // res.status(500).json({ error: 'An error occurred while verifying email.' });
    res.send(`<script>alert("An error occurred while verifying email."); window.location.href = "/index.html";</script>`);
  }
});

// Delete unverified data after 3 hours
setInterval(async () => {
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

  try {
    // Delete unverified records created before 3 hours ago
    await Registration.deleteMany({ isVerified: false, createdAt: { $lt: threeHoursAgo } });
    console.log('Unverified data deleted successfully.');
  } catch (error) {
    console.error('Error deleting unverified data:', error);
  }
}, 3 * 60 * 60 * 1000); // Run every 3 hours



// Route for user login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Find the user in the database
    if (email === 'admin@gmail.com' && password === 'Qwerty1!'){
      return res.send(`<script>alert("Logged in!!"); window.location.href = "/admin.html";</script>`);
    }

    const user = await Registration.findOne({ emailInput:email });
    
    // If user not found, return an error
    if (!user) {
      return res.send(`<script>alert("User not found");</script>`);
    }

    // Compare the provided password with the stored password using bcrypt
    const isPasswordValid = password=== user.passwordInput;
    console.log(isPasswordValid);
    // If password is incorrect, return an error
    if (!isPasswordValid) {
      return res.send(`<script>document.getElementById('error-msg')="Incorrect username/password combination";</script>`);
    }

    // Password is correct, you can perform further actions here, such as generating a token

    // Return success response
    return res.send(`<script>alert("Logged in!!"); window.location.href = "/in_home.html";</script>`);
  } catch (error) {
    console.error('Error logging in:', error);
    return res.send(`<script>alert("An error occurred while logging in"); window.location.href = "/index.html";</script>`);
  }

});

// MongoDB connection for GridFS
const conn = mongoose.createConnection(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  // Initialize GridFS stream
  let gfs;
  conn.once('open', () => {
    gfs = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'videos' });
  });
  
  // Create storage engine for Multer and GridFS
  const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'videos',
          };
          resolve(fileInfo);
        });
      });
    },
  });
  
  const upload = multer({ storage });
  
  // Route to handle video upload
  app.post('/upload', upload.single('video'), (req, res) => {
    res.json({ file: req.file });
    return res.send(`<script>alert("Uploaded!"); window.location.href = "/in_home.html";</script>`);
  });

    // Route to handle video retrieval
    app.get('/video/:videoId', async (req, res) => {
      const videoId = new mongoose.Types.ObjectId(req.params.videoId);
      const videoStream = gfs.openDownloadStream(videoId);
    
      videoStream.on('error', (err) => {
        console.error('Error streaming video:', err);
        res.status(404).send('Video not found');
      });
    
      res.setHeader('Content-Type', 'video/mp4');
      videoStream.pipe(res);
    });

// API endpoint to serve a specific video by dynamic ID
const VIDEO_ID = '64bcc4da603f71bc9bc395b4';
app.get('/api/video', async (req, res) => {
  const videoId = new mongoose.Types.ObjectId(VIDEO_ID);
  const videoStream = gfs.openDownloadStream(videoId);

  videoStream.on('error', (err) => {
    console.error('Error streaming video:', err);
    res.status(404).send('Video not found');
  });

  res.setHeader('Content-Type', 'video/mp4');
  videoStream.pipe(res);
});

// Grid.mongo = mongoose.mongo;
// gfs = Grid(conn.db);

// // API endpoint to get video by ID
// app.get('/api/video/:id', (req, res) => {
//   const videoId = new mongoose.Types.ObjectId(req.params.id);
//   const videoStream = gfs.createReadStream({ _id: videoId });
//   console.log ('stream endpoint');

//   videoStream.on('error', (err) => {
//     console.error('Error streaming video:', err);
//     res.status(404).send('Video not found');
//   });

//   res.setHeader('Content-Type', 'video/mp4');
//   console.log ('streaming');
//   videoStream.pipe(res);
// });

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
 
// commennt
  
