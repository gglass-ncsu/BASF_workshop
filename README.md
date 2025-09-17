# BASF AI Workshop - Google Cloud Environment

A cloud-hosted workshop environment for "AI for Agricultural Marketers: Crafting a High-Value Narrative for Growth" using Claude AI APIs.

## 🎯 Workshop Overview

This environment provides an easy-to-use interface for workshop participants to interact with Claude AI using pre-configured prompt templates based on the workshop curriculum. Participants can practice:

- **Creative Ideation**: Brainstorming marketing content and campaign themes
- **Analytical Reasoning**: Analyzing competitor data and market insights  
- **Strategic Planning**: Developing innovation portfolio strategies
- **Stakeholder Communication**: Crafting compelling investor narratives

## 🏗️ Architecture

- **Frontend**: Responsive web interface with Tailwind CSS
- **Backend**: Node.js/Express server with Claude API integration
- **Hosting**: Google Cloud Run (serverless, auto-scaling)
- **Security**: API keys stored in Google Secret Manager
- **CI/CD**: Google Cloud Build for automated deployment

## 🚀 Quick Setup

### Prerequisites

1. **Google Cloud Account** with billing enabled
2. **Google Cloud CLI** installed ([install guide](https://cloud.google.com/sdk/docs/install))
3. **GitHub Account** for repository hosting
4. **Claude API Key** from Anthropic

### Option 1: GitHub CI/CD Deployment (Recommended)

1. **Set up GitHub deployment:**
   ```bash
   ./setup-github-cicd.sh
   ```

2. **Create GitHub repository and add secrets:**
   - Create a new repository on GitHub
   - Add `GCP_PROJECT_ID` and `GCP_SERVICE_ACCOUNT_KEY` secrets
   - Push your code to the `main` branch

3. **Automatic deployment:** GitHub Actions will automatically deploy your app with any commit!

### Option 2: Direct Google Cloud Deployment

1. **Run the setup script:**
   ```bash
   ./setup-secrets.sh
   ```
   
2. **Manual deployment** - good for quick testing

## 🎨 Workshop Templates

The environment includes pre-configured templates for each workshop exercise:

### 1. Internal Sales Pitch
- **Purpose**: Craft compelling value propositions for Seeds and Traits division
- **System Persona**: Investment banking analyst and marketing strategist
- **Use Case**: Internal stakeholder preparation for IPO

### 2. Competitor Analysis
- **Purpose**: Analyze competitor financial reports and market position
- **System Persona**: Agricultural sector financial analyst
- **Use Case**: Strategic intelligence and market positioning

### 3. Skeptical Farmer Perspective
- **Purpose**: Understand customer objections and concerns
- **System Persona**: Experienced, cautious farmer
- **Use Case**: Product development and marketing refinement

### 4. Innovation Portfolio Strategy
- **Purpose**: Justify R&D investment priorities
- **System Persona**: Head of Innovation Portfolio
- **Use Case**: Board presentations and strategic planning

### 5. Moonshot Ideas
- **Purpose**: Generate breakthrough innovation concepts
- **System Persona**: Creative innovation strategist
- **Use Case**: Long-term strategic visioning

## 💻 Local Development

If you want to run the environment locally for testing:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set environment variable:**
   ```bash
   export CLAUDE_API_KEY="your_api_key_here"
   ```

3. **Start the server:**
   ```bash
   npm run dev
   ```

4. **Visit:** http://localhost:8080

## 🔒 Security Features

- **API Key Protection**: Claude API keys stored in Google Secret Manager
- **HTTPS Enforcement**: All traffic encrypted in transit
- **Content Security Policy**: Protection against XSS attacks
- **Input Validation**: Server-side validation of all user inputs
- **Rate Limiting**: Built-in protection against abuse

## 🛠️ Customization

### Adding New Templates

To add workshop-specific templates, edit the `promptTemplates` object in `server.js`:

```javascript
const promptTemplates = {
  'your-template': {
    system: "Your system prompt here...",
    template: "Your user prompt template here..."
  }
};
```

### Styling Changes

The UI uses Tailwind CSS. Modify `public/index.html` for layout changes or `public/app.js` for functionality updates.

### Environment Configuration

Key environment variables:
- `CLAUDE_API_KEY`: Your Anthropic API key
- `PROJECT_ID`: Google Cloud project ID
- `PORT`: Server port (default: 8080)

## 📊 Monitoring

Monitor your deployment through:
- **Google Cloud Console**: Cloud Run service metrics
- **Application Logs**: `gcloud logs tail basf-ai-workshop`
- **Health Check**: Visit `/health` endpoint

## 🆘 Troubleshooting

### Common Issues

1. **API Key Error**: Ensure Claude API key is correctly stored in Secret Manager
2. **Build Failed**: Check that all required APIs are enabled
3. **Access Denied**: Verify IAM permissions for Cloud Build and Cloud Run

### Support Commands

```bash
# Check service status
gcloud run services describe basf-ai-workshop --region=us-central1

# View logs
gcloud logs tail basf-ai-workshop

# Update secret
echo "new_api_key" | gcloud secrets versions add claude-api-key --data-file=-

# Redeploy
gcloud builds submit --config cloudbuild.yaml .
```

## 💡 Workshop Tips

1. **Start with Templates**: Encourage participants to use pre-configured templates first
2. **Add Context**: Use the context input for reports, data, or additional information
3. **Iterate**: Participants can refine prompts based on AI responses
4. **Share Results**: Copy/paste interesting responses for group discussion

## 📝 Cost Optimization

- **Cloud Run**: Pay only for actual usage (requests and compute time)
- **Container Registry**: Minimal storage costs for container images
- **Secret Manager**: $0.06 per 10,000 secret access operations
- **Claude API**: Pay per token usage based on your Anthropic plan

## 🔄 Updates & CI/CD

### With GitHub CI/CD (Recommended)

**Automatic Deployment:**
- Push to `main` branch → Automatic production deployment
- Create pull request → Automatic preview environment
- Merge/close PR → Automatic cleanup

**Workflow Features:**
- ✅ **Automated Testing**: Security audit, linting, health checks
- ✅ **Preview Environments**: Each PR gets its own temporary environment
- ✅ **Production Deployment**: Automatic deployment to main service
- ✅ **Cleanup**: Preview environments automatically cleaned up
- ✅ **Status Updates**: Comments on PRs with preview URLs

### Manual Updates

To update manually:
```bash
gcloud builds submit --config cloudbuild.yaml .
```

### GitHub Repository Secrets

Add these secrets to your GitHub repository (Settings > Secrets > Actions):

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `GCP_PROJECT_ID` | Your Google Cloud Project ID | `my-workshop-project` |
| `GCP_SERVICE_ACCOUNT_KEY` | Service account JSON key | `{"type": "service_account"...}` |

---

**Created for BASF Agricultural Solutions**  
*AI for Agricultural Marketers Workshop*
