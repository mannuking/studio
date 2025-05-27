import { config } from 'dotenv';
config();

import '@/ai/flows/context-aware-response.ts';
import '@/ai/flows/generate-avatar-flow.ts'; // Added import for the new flow
import '@/ai/flows/emotion-analysis.ts';
import '@/ai/flows/wearables-analysis.ts';
import '@/ai/flows/enhanced-context-management.ts';
import '@/ai/flows/comprehensive-mitr-ai.ts';

import {startFlowsServer} from '@genkit-ai/flow';

startFlowsServer();
