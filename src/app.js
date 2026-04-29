const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const documentRouter = require('./routes/documents');

dotenv.config();
const PORT = process.env.PORT || 5001;
const app = express()
  .use(cors())
  .use(express.json())
  .use(express.urlencoded({ extended: true }));

app.use('/api/documents', documentRouter);

async function startServer() {
  try {
    console.log("Starting Mastery service app...");

    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();