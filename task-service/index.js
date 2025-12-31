// ✅ Load environment variables (optional .env support)
require('dotenv').config();

// ✅ Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const amqb = require('amqplib')

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

let channel, connection; // RabbitMQ variables

async function RabbitmqConnectionWithRetries(retries = 5, delay = 5000) {
  while (retries) {
    try {
      // ✅ Correct protocol and container name
      connection = await amqp.connect("amqp://rabbitmq_node");
      channel = await connection.createChannel();

      await channel.assertQueue('task-created');
      console.log("✅ Connected to RabbitMQ successfully");
      return; // Exit function after successful connection

    } catch (error) {
      console.error("❌ RabbitMQ connection error:", error.message);
      retries--;
      console.log(`🔁 Retrying... attempts left: ${retries}`);
      await new Promise(res => setTimeout(res, delay));
    }
  }

  console.error("🚨 Failed to connect to RabbitMQ after multiple attempts.");
}

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
    
    const message = {taskId: task._id, userId , title};

    if(!channel){
      return res.status(503).json({
        message:`Some error while connecting to rabbitMQ`
      })
    }

    channel.sendToQueue("task-created",Buffer.from(
      JSON.stringify(message)
    ));

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
  Rabbitmqconectionwithretries();
});
