const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/data', require('./routes/data'));
app.use('/api/trading', require('./routes/trading'));

// Health check endpoint
app.get('/health', (req, res) => {
  const apiKeys = {
    TAAPI_API_KEY: !!process.env.TAAPI_API_KEY,
    LUNARCRUSH_API_KEY: !!process.env.LUNARCRUSH_API_KEY,
    CRYPTORANK_API_KEY: !!process.env.CRYPTORANK_API_KEY,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    DATABASE_URL: !!process.env.DATABASE_URL
  };

  const allConfigured = Object.values(apiKeys).every(Boolean);

  res.status(200).json({ 
    status: allConfigured ? 'OK' : 'PARTIAL',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    apiKeys,
    allConfigured
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;