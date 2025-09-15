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
        throw new Error('CLAUDE_API_KEY environment variable not set');
      }
      anthropic = new Anthropic({ apiKey });
      return;
    }

    const name = `projects/${projectId}/secrets/claude-api-key/versions/latest`;
    const [version] = await secretClient.accessSecretVersion({ name });
    const apiKey = version.payload.data.toString();
    anthropic = new Anthropic({ apiKey });
    console.log('Claude client initialized with Secret Manager API key');
  } catch (error) {
    console.error('Failed to initialize Claude client:', error.message);
    // Fallback to environment variable
    const apiKey = process.env.CLAUDE_API_KEY;
    if (apiKey) {
      anthropic = new Anthropic({ apiKey });
      console.log('Claude client initialized with environment variable');
    } else {
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
    const { message, promptType, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let systemPrompt = '';
    let userMessage = message;

    // Use template if specified
    if (promptType && promptTemplates[promptType]) {
      systemPrompt = promptTemplates[promptType].system;
      if (context) {
        userMessage = `${promptTemplates[promptType].template}\n\nContext: ${context}\n\nUser Input: ${message}`;
      } else {
        userMessage = `${promptTemplates[promptType].template}\n\nUser Input: ${message}`;
      }
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    });

    res.json({
      response: response.content[0].text,
      promptType: promptType || 'custom'
    });

  } catch (error) {
    console.error('Claude API error:', error);
    res.status(500).json({ 
      error: 'Failed to get response from Claude',
      details: error.message 
    });
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize and start server
async function startServer() {
  try {
    await initClaude();
    app.listen(port, () => {
      console.log(`BASF AI Workshop server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();