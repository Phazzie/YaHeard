# DigitalOcean App Platform Deployment Guide

This guide covers deploying the Multi-AI Transcription Engine to DigitalOcean App Platform.

## Prerequisites

1. DigitalOcean account
2. Fork of this repository in your GitHub account
3. At least one AI service API key (OpenAI, AssemblyAI, Deepgram, ElevenLabs, or Gemini)

## Quick Deployment

### Option 1: Deploy via DigitalOcean Control Panel

1. **Fork the repository** to your GitHub account

2. **Go to DigitalOcean App Platform**:
   - Log into your DigitalOcean account
   - Navigate to Apps → Create App

3. **Connect your repository**:
   - Choose GitHub as your source
   - Select your forked repository
   - Choose the `main` branch

4. **Upload App Spec**:
   - Choose "Edit App Spec"
   - Copy the contents of `.do/app.yaml` from this repository
   - Paste it into the App Spec editor

5. **Configure Environment Variables**:
   - In the App Spec, update the environment variables section with your actual API keys
   - At minimum, set one of: `OPENAI_API_KEY`, `ASSEMBLYAI_API_KEY`, `DEEPGRAM_API_KEY`, `ELEVENLABS_API_KEY`, or `GEMINI_API_KEY`

6. **Deploy**:
   - Click "Create Resources"
   - Wait for the build and deployment to complete

### Option 2: Deploy via doctl CLI

1. **Install doctl** (DigitalOcean CLI):
   ```bash
   # macOS
   brew install doctl
   
   # Ubuntu/Debian
   snap install doctl
   
   # Or download from: https://github.com/digitalocean/doctl/releases
   ```

2. **Authenticate doctl**:
   ```bash
   doctl auth init
   ```

3. **Update the App Spec**:
   - Copy `.do/app.yaml` to `.do/app-production.yaml`
   - Edit `.do/app-production.yaml` and add your actual API keys
   - Update the GitHub repository reference to your fork

4. **Deploy**:
   ```bash
   doctl apps create --spec .do/app-production.yaml
   ```

## Environment Variables

Set these in your DigitalOcean App Platform environment:

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Optional* | OpenAI API key for Whisper |
| `ASSEMBLYAI_API_KEY` | Optional* | AssemblyAI API key |
| `DEEPGRAM_API_KEY` | Optional* | Deepgram API key |
| `ELEVENLABS_API_KEY` | Optional* | ElevenLabs API key |
| `GEMINI_API_KEY` | Optional* | Google Gemini API key |
| `NODE_ENV` | Auto-set | Set to `production` |
| `PORT` | Auto-set | Set to `3000` |

*At least one API key is required for the application to function.

## App Configuration

The `.do/app.yaml` file configures:

- **Runtime**: Node.js 20.x
- **Instance Size**: Basic XXS (512MB RAM, 1 vCPU) - can be upgraded
- **Build Command**: `npm run build`
- **Run Command**: `node build/index.js`
- **Port**: 3000
- **Auto-deploy**: Enabled on push to main branch

## Scaling

To handle more traffic:

1. **Increase instance size**:
   - Edit your app in the DigitalOcean control panel
   - Go to Settings → Resources
   - Choose a larger instance size (Basic XS, S, M, etc.)

2. **Add more instances**:
   - Increase the `instance_count` in your app spec
   - Note: In-memory rate limiting will need to be replaced with Redis for multiple instances

## Monitoring

DigitalOcean App Platform provides:

- **Real-time logs**: View application logs in the console
- **Metrics**: CPU, memory, and request metrics
- **Alerts**: Set up alerts for high resource usage
- **Health checks**: Automatic health monitoring

## Troubleshooting

### Build Failures
- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility (requires 20.x)

### Runtime Errors
- Check environment variables are set correctly
- Verify at least one AI service API key is provided
- Review application logs in the DigitalOcean console

### Performance Issues
- Monitor resource usage in the DigitalOcean dashboard
- Consider upgrading instance size or adding more instances
- Replace in-memory rate limiting with Redis for production

## Cost Estimation

DigitalOcean App Platform pricing (as of 2024):

- **Basic XXS**: $5/month (512MB RAM, 1 vCPU)
- **Basic XS**: $12/month (1GB RAM, 1 vCPU)
- **Basic S**: $25/month (2GB RAM, 1 vCPU)

Plus:
- Bandwidth: $0.01/GB after free tier
- Build minutes: Free for public repos, $0.007/minute for private

## Next Steps

After deployment:

1. **Test the application** with sample audio files
2. **Set up custom domain** (optional)
3. **Configure alerts** for monitoring
4. **Consider Redis** for production rate limiting if scaling beyond one instance
5. **Add structured logging** for better observability

## Support

For DigitalOcean App Platform specific issues:
- [DigitalOcean Documentation](https://docs.digitalocean.com/products/app-platform/)
- [DigitalOcean Community](https://www.digitalocean.com/community/)
- [Support Tickets](https://cloud.digitalocean.com/support/tickets)

For application-specific issues:
- Check the main repository README.md
- Review the DEPLOYMENT.md file
- Check GitHub issues