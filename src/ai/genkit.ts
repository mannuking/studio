import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Create a performance-optimized AI client with better caching and timeout handling
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-flash', // Using a faster model for improved response time
  defaultOptions: {
    maxRetries: 1, // Reduced from 2 to 1 for faster failure
    timeout: 12000, // Reduced from 15s to 12s for quicker timeout
    temperature: 0.7, // Slightly lower temperature for more consistent responses
    maxOutputTokens: 512, // Limit output tokens to reduce response time
    stream: true, // Enable streaming for faster perceived response time
  }
});
