const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  }
}));
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static('public'));

// Initialize Google Secret Manager client
const secretClient = new SecretManagerServiceClient();
let anthropic;

// Initialize Claude client with API key from Secret Manager
async function initClaude() {
  try {
    const projectId = process.env.PROJECT_ID;
    if (!projectId) {
      console.log('PROJECT_ID not set, using environment variable for API key');
      const apiKey = process.env.CLAUDE_API_KEY;
      if (!apiKey) {
        console.error('CLAUDE_API_KEY environment variable not set');
        throw new Error('CLAUDE_API_KEY environment variable not set');
      }
      anthropic = new Anthropic({ apiKey });
      console.log('Claude client initialized with environment variable');
      return;
    }

    console.log(`Attempting to fetch Claude API key from Secret Manager for project: ${projectId}`);
    const name = `projects/${projectId}/secrets/claude-api-key/versions/latest`;
    const [version] = await secretClient.accessSecretVersion({ name });
    const apiKey = version.payload.data.toString();
    anthropic = new Anthropic({ apiKey });
    console.log('Claude client initialized with Secret Manager API key');
  } catch (error) {
    console.error('Failed to initialize Claude client from Secret Manager:', error.message);
    // Fallback to environment variable
    const apiKey = process.env.CLAUDE_API_KEY;
    if (apiKey) {
      anthropic = new Anthropic({ apiKey });
      console.log('Claude client initialized with environment variable fallback');
    } else {
      console.error('No API key available for Claude - neither Secret Manager nor environment variable');
      throw new Error('No API key available for Claude');
    }
  }
}

// Workshop prompt templates
const promptTemplates = {
  'internal-sales-pitch': {
    system: "You are a world-class marketing strategist and investment banking analyst. Your mission is to craft a compelling, persuasive narrative for internal stakeholders preparing for the BASF Agricultural Solutions. You specialize in translating technical innovation, sustainability leadership, and market positioning into powerful value propositions that resonate with sophisticated investors. Your focus is on the Seeds and Traits division, highlighting its unique strengths and future growth potential.",
    template: "Develop a value proposition for our Seeds and Traits division to be used internally. Highlight our key differentiators in innovation, sustainability, and market position. Frame this as a story about future growth and profitability. Generate three potential taglines for our internal pitch."
  },
  'competitor-analysis': {
    system: "You are a financial analyst specializing in the agricultural sector. You are objective, data-driven, and skilled at extracting key insights from corporate reports.",
    template: "Analyze the provided competitor report step-by-step. First, identify the competitor's stated strengths and weaknesses for the quarter. Second, summarize their financial performance in key areas like revenue and profit margins. Third, extract any mentions of their pipeline or future outlook. Finally, list three strategic questions this report raises for our own Seeds and Traits division."
  },
  'skeptical-farmer': {
    system: "Act as a skeptical farmer considering BASF's product portfolio. You have years of experience in agriculture and are cautious about new products and marketing claims.",
    template: "Review the provided product portfolio information. What are your biggest questions and concerns as a farmer? What would convince you to try these products?"
  },
  'innovation-portfolio': {
    system: "You are the Head of the Innovation Portfolio for BASF Agricultural Solutions. You need to make strategic investment decisions.",
    template: "A board member has asked you to justify your top 3 investment priorities for next year. Write a memo outlining your choices and the rationale behind them, considering market size, competitive advantage, and sustainability goals."
  },
  'moonshot-ideas': {
    system: "You are a creative innovation strategist focused on breakthrough technologies in agriculture.",
    template: "Brainstorm five 'moonshot' ideas for BASF's Seeds and Traits division that could revolutionize farming in the next 10 years. For each idea, briefly describe what it is and the value it could create."
  }
};

// API endpoint for Claude interactions
app.post('/api/chat', async (req, res) => {
  try {
    const { systemPrompt, userPrompt, context } = req.body;
    
    if (!userPrompt) {
      return res.status(400).json({ error: 'User prompt is required' });
    }

    // Check if Claude is initialized
    if (!anthropic) {
      return res.status(503).json({ 
        error: 'Claude AI service is not available',
        details: 'The AI service is initializing or misconfigured. Please try again in a moment.'
      });
    }

    // Prepare the user message, optionally including context
    let finalUserMessage = userPrompt;
    if (context) {
      finalUserMessage = `${userPrompt}\n\nAdditional Context: ${context}`;
    }

    // Prepare the system prompt (use provided or default)
    const finalSystemPrompt = systemPrompt || 'You are a helpful AI assistant specializing in agricultural marketing and business strategy.';

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      system: finalSystemPrompt,
      messages: [
        {
          role: 'user',
          content: finalUserMessage
        }
      ]
    });

    res.json({
      response: response.content[0].text,
      systemPrompt: finalSystemPrompt,
      userPrompt: finalUserMessage
    });

  } catch (error) {
    console.error('Claude API error details:', {
      message: error.message,
      status: error.status,
      type: error.type,
      error: error.error,
      headers: error.headers
    });
    
    // More specific error handling
    if (error.status === 400) {
      res.status(400).json({ 
        error: 'Invalid request to Claude API',
        details: `Bad request: ${error.message}`,
        type: error.type || 'validation_error'
      });
    } else if (error.status === 401) {
      res.status(401).json({ 
        error: 'Authentication failed',
        details: 'Invalid or missing API key for Claude'
      });
    } else if (error.status === 429) {
      res.status(429).json({ 
        error: 'Rate limit exceeded',
        details: 'Too many requests to Claude API. Please try again later.'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to get response from Claude',
        details: error.message,
        status: error.status || 'unknown'
      });
    }
  }
});

// Get available prompt templates
app.get('/api/templates', (req, res) => {
  const templates = Object.keys(promptTemplates).map(key => ({
    id: key,
    name: key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: promptTemplates[key].template.substring(0, 100) + '...'
  }));
  
  res.json(templates);
});

// Get individual template data
app.get('/api/template/:id', (req, res) => {
  const templateId = req.params.id;
  const template = promptTemplates[templateId];
  
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  
  res.json({
    id: templateId,
    name: templateId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    system: template.system,
    template: template.template
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: port,
    claude_initialized: !!anthropic
  };
  res.json(healthStatus);
});

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize and start server
async function startServer() {
  // Start the server first, then initialize Claude in the background
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`BASF AI Workshop server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Project ID: ${process.env.PROJECT_ID || 'not set'}`);
  });

  // Initialize Claude in the background (don't block server startup)
  initClaude().catch(error => {
    console.error('Failed to initialize Claude client:', error.message);
    console.log('Server will continue running but Claude features will be unavailable');
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });
}

startServer();