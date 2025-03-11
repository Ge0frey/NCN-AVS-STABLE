import express from 'express';
import cors from 'cors';
import config from './config/env';
import routes from './api/routes';

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    features: {
      ncnEnabled: config.FEATURE_FLAG_NCN_ENABLED,
      jitoRestakingEnabled: config.FEATURE_FLAG_JITO_RESTAKING_ENABLED
    }
  });
});

// Start server
app.listen(config.PORT, () => {
  console.log(`Bridge server running on port ${config.PORT}`);
  console.log(`NCN feature enabled: ${config.FEATURE_FLAG_NCN_ENABLED}`);
  console.log(`Jito Restaking feature enabled: ${config.FEATURE_FLAG_JITO_RESTAKING_ENABLED}`);
}); 