// ✅ Load environment variables (optional .env support)
require('dotenv').config();

// ✅ Import dependencies
const express = require('express');
const mongoose = require('mongoose');

// ✅ Initialize Express app
const app = express();

// ✅ Configuration
const PORT = process.env.PORT || 3005;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/users';

// ✅ Middleware (body parser built into Express)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Define User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
});

// ✅ Create User Model
const User = mongoose.model('User', userSchema);

// ✅ Connect to MongoDB
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ------------------------------------------------------------
// ✅ POST route → Create a new user
// ------------------------------------------------------------
app.post('/users', async (req, res) => {
  try {
    const { name, email } = req.body;

    // Validation check
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required',
      });
    }

    // Create new user
    const user = new User({ name, email });
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User added successfully',
      user,
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// ------------------------------------------------------------
// ✅ GET route → Fetch all users
// ----------------------------------------------------------
app.get('/users', async (req, res) => {
  try {
    const users = await User.find();

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No users found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// ------------------------------------------------------------
// ✅ Start Server
// ------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// ------------------------------------------------------------
// 📝 Future Notes
// ------------------------------------------------------------
// 🔹 Add GET /users/:id → Fetch single user by ID
// 🔹 Add PUT /users/:id → Update user details
// 🔹 Add DELETE /users/:id → Remove a user
// 🔹 Add validation middleware (Joi or express-validator)
// 🔹 Add centralized error handling and logging
// 🔹 Secure routes with authentication (JWT)
// 🔹 Deploy with Docker + MongoDB Atlas
