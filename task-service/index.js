// ✅ Load environment variables (optional .env support)
require('dotenv').config();

// ✅ Import dependencies
const express = require('express');
const mongoose = require('mongoose');

// ✅ Initialize Express app
const app = express();

// ✅ Configuration
const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI;

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Connect to MongoDB
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ✅ Define Task Schema
const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  userId: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Task = mongoose.model('Task', TaskSchema);

// ✅ Health check route
app.get('/', (req, res) => {
  res.send('🚀 Task Service is running!');
});

// ✅ Get all tasks
app.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (error) {
    console.error('❌ Error fetching tasks:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// ✅ Create a new task
app.post('/tasks', async (req, res) => {
  try {
    const { title, description, userId } = req.body;

    // Validation check
    if (!title || !description || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and userId are required',
      });
    }

    // Create new task
    const task = new Task({ title, description, userId });
    await task.save();

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    console.error('❌ Error creating task:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server of task-service is running on http://localhost:${PORT}`);
});
