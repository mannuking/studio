'use server';

/**
 * @fileOverview Ultra-fast MITR AI system that skips all expensive analysis
 * Direct therapeutic responses with minimal processing for maximum speed
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Fast MITR AI input schema - simplified to only what's essential
const FastMitrInputSchema = z.object({
  // User message - only essential data
  userMessage: z.string().describe('Current user message'),
  conversationHistory: z.array(z.object({
    speaker: z.string(),
    message: z.string(),
    timestamp: z.string(),
  })).optional(),
});

export type FastMitrInput = z.infer<typeof FastMitrInputSchema>;

// Fast MITR AI output schema - maintains structure for UI compatibility
const FastMitrOutputSchema = z.object({
  // AI response
  response: z.string().describe('Therapeutic response to user'),
  
  // Simple analysis results for UI display
  emotionAnalysis: z.object({
    primary: z.string(),
    confidence: z.number(),
    distressLevel: z.number(),
    recommendations: z.array(z.string()),
  }),
  
  healthAnalysis: z.object({
    wellnessScore: z.number(),
    stressLevel: z.number(),
    alerts: z.array(z.object({
      type: z.string(),
      severity: z.string(),
      message: z.string(),
    })),
    recommendations: z.array(z.string()),
  }),
  
  contextualInsights: z.object({
    therapeuticIntent: z.string(),
    urgencyLevel: z.string(),
    sessionPhase: z.string(),
    therapeuticAlliance: z.number(),
  }),
  
  // Avatar control
  avatarControl: z.object({
    expression: z.string(),
    intensity: z.number(),
    duration: z.number(),
    emotionalState: z.string(),
  }),
  
  // Intervention recommendations
  interventions: z.object({
    immediate: z.array(z.string()),
    session: z.array(z.string()),
    longTerm: z.array(z.string()),
  }),
  
  // Safety assessment
  safetyAssessment: z.object({
    riskLevel: z.string().describe('low, medium, high, critical'),
    concerns: z.array(z.string()),
    actions: z.array(z.string()),
    followUp: z.boolean(),
  }),
  
  // Metadata
  metadata: z.object({
    analysisTimestamp: z.string(),
    confidenceScore: z.number(),
    dataQuality: z.object({
      emotional: z.number(),
      health: z.number(),
      contextual: z.number(),
    }),
  }),
});

export type FastMitrOutput = z.infer<typeof FastMitrOutputSchema>;

// Ultra-fast direct therapeutic response prompt
const fastTherapistPrompt = ai.definePrompt({
  name: 'fastTherapist',
  input: {
    schema: z.object({
      userMessage: z.string(),
      conversationHistory: z.string().optional(),
    })
  },
  output: {
    schema: z.object({
      response: z.string(),
    })
  },
  model: 'googleai/gemini-2.5-flash-preview-05-20',
  prompt: `You are Mitr AI, a fast, direct, and helpful therapeutic AI companion. Respond quickly and helpfully to the user's message.

User Message: "{{{userMessage}}}"

{{#if conversationHistory}}
Previous conversation:
{{{conversationHistory}}}
{{/if}}

As Mitr AI, provide a direct, practical and supportive response that addresses the user's needs. Be warm and empathetic but get straight to the point.

Important: Keep your response concise and action-oriented.`,
});

// Fast MITR AI flow - ultra optimized for speed
const fastMitrFlow = ai.defineFlow(
  {
    name: 'fastMitrFlow',
    inputSchema: FastMitrInputSchema,
    outputSchema: FastMitrOutputSchema,
  },
  async (input: FastMitrInput) => {
    const timestamp = new Date().toISOString();
    
    // Get the recent conversation history for context (limit to 3 messages)
    const recentConversation = input.conversationHistory
      ? input.conversationHistory
          .slice(-3)
          .map(msg => `${msg.speaker}: ${msg.message}`)
          .join('\n')
      : undefined;
    
    // Single prompt call for maximum speed - only essential data
    const responseResult = await fastTherapistPrompt({
      userMessage: input.userMessage,
      conversationHistory: recentConversation,
    });

    // Create static data for UI display - no analysis needed
    return {
      response: responseResult.output?.response || 'I understand. How can I help you today?',
      
      emotionAnalysis: {
        primary: 'neutral',
        confidence: 0.8,
        distressLevel: 0.3,
        recommendations: ['Focus on the present', 'Express your feelings'],
      },
      
      healthAnalysis: {
        wellnessScore: 75,
        stressLevel: 35,
        alerts: [],
        recommendations: ['Take regular breaks', 'Stay hydrated'],
      },
      
      contextualInsights: {
        therapeuticIntent: 'supportive_listening',
        urgencyLevel: 'low',
        sessionPhase: 'exploration',
        therapeuticAlliance: 75,
      },
      
      avatarControl: {
        expression: 'empathetic',
        intensity: 0.7,
        duration: 3,
        emotionalState: 'attentive',
      },
      
      interventions: {
        immediate: ['Take a deep breath', 'Ground yourself in the present moment'],
        session: ['Express your feelings', 'Practice mindfulness'],
        longTerm: ['Develop coping strategies', 'Build emotional resilience'],
      },
      
      safetyAssessment: {
        riskLevel: 'low',
        concerns: [],
        actions: [],
        followUp: false,
      },
      
      metadata: {
        analysisTimestamp: timestamp,
        confidenceScore: 0.8,
        dataQuality: {
          emotional: 0.7,
          health: 0.7,
          contextual: 0.7,
        },
      },
    };
  }
);

export async function processFastMitrRequest(input: FastMitrInput): Promise<FastMitrOutput> {
  return fastMitrFlow(input);
}
