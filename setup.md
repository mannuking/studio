# MITR AI Setup Guide

## Prerequisites

1. **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
2. **Google AI API Key** - Get from [Google AI Studio](https://aistudio.google.com/)
3. **Git** - For cloning the repository

## Installation Steps

### 1. Install Dependencies

```bash
# Install all required packages
npm install

# If you encounter any issues, try:
npm install --legacy-peer-deps
```

### 2. Environment Setup

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local and add your Google AI API key
# GOOGLE_GENAI_API_KEY=your_actual_api_key_here
```

### 3. TypeScript Configuration

The project should work with the existing TypeScript configuration. If you encounter issues:

```bash
# Check TypeScript
npx tsc --noEmit

# If there are module resolution issues, try:
npm install @types/react @types/react-dom @types/node --save-dev
```

### 4. Start Development Servers

You need to run TWO servers:

**Terminal 1 - Next.js App:**
```bash
npm run dev
```

**Terminal 2 - AI Flows Server:**
```bash
npm run genkit:dev
```

### 5. Access the Application

- **Main App**: http://localhost:9002
- **Genkit UI**: http://localhost:4000 (for AI flow debugging)

## Troubleshooting

### Common Issues

1. **"Cannot find module 'react'"**
   ```bash
   npm install react react-dom @types/react @types/react-dom
   ```

2. **"Cannot find module 'zod'"**
   ```bash
   npm install zod
   ```

3. **"Cannot find module 'lucide-react'"**
   ```bash
   npm install lucide-react
   ```

4. **Genkit server not starting**
   ```bash
   npm install -g genkit-cli
   npm install genkit @genkit-ai/googleai @genkit-ai/flow
   ```

### Environment Variables

Make sure your `.env.local` file contains:

```env
GOOGLE_GENAI_API_KEY=your_actual_google_ai_api_key
NEXT_PUBLIC_APP_URL=http://localhost:9002
```

### Port Configuration

- Next.js runs on port 9002 (configured in package.json)
- Genkit runs on port 4000 (default)
- Make sure these ports are available

## Features to Test

1. **Therapeutic Chat**
   - Type messages and get AI responses
   - Enable emotion analysis toggle
   - Try voice input (click microphone)
   - Enable camera for facial analysis

2. **Health Dashboard**
   - Switch to "Health Dashboard" tab
   - Click "Start Monitoring" 
   - View real-time health metrics
   - Check health alerts

3. **Multimodal Analysis**
   - Enable all analysis features
   - Send a message
   - View analysis results in the right panel

## Development Notes

- The app uses mock data for wearables/health metrics
- Speech recognition requires HTTPS in production
- Camera access requires user permission
- All AI processing happens through Google's Gemini models

## Getting Help

If you encounter issues:

1. Check the browser console for errors
2. Check both terminal outputs for error messages
3. Verify your Google AI API key is valid
4. Ensure all dependencies are installed correctly

## Next Steps

Once the app is running:

1. Test the chat interface
2. Try different analysis features
3. Monitor the health dashboard
4. Check the Genkit UI for AI flow debugging
5. Review the comprehensive analysis results 
