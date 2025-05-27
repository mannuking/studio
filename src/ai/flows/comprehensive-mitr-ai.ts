'use server';

/**
 * @fileOverview Comprehensive MITR AI system integrating all analysis modules
 * Orchestrates emotion analysis, wearables data, context management, and safety assessment
 * to provide holistic therapeutic responses.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { analyzeEmotions, type EmotionAnalysisInput, type EmotionAnalysisOutput } from './emotion-analysis';
import { analyzeWearablesData, type WearablesDataInput, type WearablesAnalysisOutput } from './wearables-analysis';
import { manageContext, type ContextManagementInput, type ContextManagementOutput } from './enhanced-context-management';

// Response cache with time-based expiration and better cleanup
const responseCache = new Map<string, {response: ComprehensiveMitrOutput, timestamp: number}>();
const CACHE_EXPIRY_MS = 3 * 60 * 1000; // Reduced to 3 minutes for faster cache turnover

// Enhanced cache key generator with better hashing
function generateCacheKey(input: ComprehensiveMitrInput): string {
  // Create a more efficient cache key with minimal data
  const keyData = {
    message: input.userMessage.slice(0, 100), // Limit message length for key
    historyLength: input.conversationHistory?.length || 0,
    hasImage: !!input.imageData,
    hasAudio: !!input.audioFeatures,
    hasWearables: !!input.wearablesData,
  };
  
  // Simple hash to reduce key size
  const keyString = JSON.stringify(keyData);
  let hash = 0;
  for (let i = 0; i < keyString.length; i++) {
    const char = keyString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `cache_${Math.abs(hash)}`;
}

// Optimized cache cleanup function
function cleanupExpiredCache(): void {
  const now = Date.now();
  const expiredKeys: string[] = [];
  
  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > CACHE_EXPIRY_MS) {
      expiredKeys.push(key);
    }
  }
  
  expiredKeys.forEach(key => responseCache.delete(key));
  
  // Log cleanup if in development
  if (process.env.NODE_ENV === 'development' && expiredKeys.length > 0) {
    console.log(`🧹 Cleaned up ${expiredKeys.length} expired cache entries`);
  }
}

// Check if we have a valid cached response
function getCachedResponse(input: ComprehensiveMitrInput): ComprehensiveMitrOutput | null {
  const key = generateCacheKey(input);
  const cached = responseCache.get(key);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_EXPIRY_MS) {
    return cached.response;
  }
  
  return null;
}

// Save response to cache with optimized cleanup
function cacheResponse(input: ComprehensiveMitrInput, output: ComprehensiveMitrOutput): void {
  const key = generateCacheKey(input);
  responseCache.set(key, {
    response: output,
    timestamp: Date.now()
  });
  
  // Run cleanup every 10th cache operation to maintain performance
  if (responseCache.size % 10 === 0) {
    cleanupExpiredCache();
  }
}

// Separate function for cache cleanup - REMOVED, replaced with cleanupExpiredCache above

// Comprehensive MITR AI input schema
const ComprehensiveMitrInputSchema = z.object({
  // User interaction data
  userMessage: z.string().describe('Current user message'),
  conversationHistory: z.array(z.object({
    speaker: z.string(),
    message: z.string(),
    timestamp: z.string(),
    emotions: z.record(z.number()).optional(),
    intent: z.string().optional(),
  })).optional(),
  
  // Multimodal data
  imageData: z.string().optional().describe('Base64 encoded camera image'),
  audioFeatures: z.object({
    pitch: z.number().optional(),
    energy: z.number().optional(),
    spectralCentroid: z.number().optional(),
    mfcc: z.array(z.number()).optional(),
    duration: z.number().optional(),
  }).optional(),
  
  // Wearables data
  wearablesData: z.object({
    heartRate: z.object({
      current: z.number().optional(),
      resting: z.number().optional(),
      variability: z.number().optional(),
    }).optional(),
    sleep: z.object({
      duration: z.number().optional(),
      quality: z.number().optional(),
    }).optional(),
    activity: z.object({
      steps: z.number().optional(),
      activeMinutes: z.number().optional(),
    }).optional(),
    stress: z.object({
      level: z.number().optional(),
    }).optional(),
    timestamp: z.string(),
  }).optional(),
  
  // User profile and preferences
  userProfile: z.object({
    therapeuticGoals: z.array(z.string()).optional(),
    triggers: z.array(z.string()).optional(),
    copingStrategies: z.array(z.string()).optional(),
    preferences: z.record(z.any()).optional(),
  }).optional(),
  
  // Session context
  sessionContext: z.object({
    sessionId: z.string().optional(),
    sessionPhase: z.string().optional(),
    duration: z.number().optional(),
  }).optional(),
});

export type ComprehensiveMitrInput = z.infer<typeof ComprehensiveMitrInputSchema>;

// Comprehensive MITR AI output schema
const ComprehensiveMitrOutputSchema = z.object({
  // AI response
  response: z.string().describe('Therapeutic response to user'),
  
  // Analysis results
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
  }).optional(),
  
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

export type ComprehensiveMitrOutput = z.infer<typeof ComprehensiveMitrOutputSchema>;

// Main therapeutic response generation prompt
const therapeuticResponsePrompt = ai.definePrompt({
  name: 'therapeuticResponse',
  input: {
    schema: z.object({
      userMessage: z.string(),
      emotionAnalysis: z.string(),
      healthAnalysis: z.string().optional(),
      contextualGuidance: z.string(),
      safetyFactors: z.string(),
    })
  },  output: {
    schema: z.object({
      response: z.string(),
      interventions: z.object({
        immediate: z.array(z.string()),
        session: z.array(z.string()),
        longTerm: z.array(z.string()),
      }),
      safetyAssessment: z.object({
        riskLevel: z.string(),
        concerns: z.array(z.string()),
        actions: z.array(z.string()),
        followUp: z.boolean(),
      }),
    })
  },
  model: 'googleai/gemini-1.5-flash', // Using faster model for better response time
  prompt: `You are Mitr AI, an advanced therapeutic AI companion. Generate a comprehensive therapeutic response based on multimodal analysis.

User Message: "{{{userMessage}}}"

Emotion Analysis:
{{{emotionAnalysis}}}

{{#if healthAnalysis}}
Health Analysis:
{{{healthAnalysis}}}
{{/if}}

Contextual Guidance:
{{{contextualGuidance}}}

Safety Factors:
{{{safetyFactors}}}

As Mitr AI, provide:

1. Therapeutic Response:
   - Empathetic, warm, and supportive tone
   - Address the user's emotional state directly
   - Incorporate insights from all analysis modalities
   - Use evidence-based therapeutic techniques
   - Maintain appropriate boundaries
   - Show genuine care and understanding

2. Intervention Recommendations:
   - Immediate: Actions for the next few minutes/hours
   - Session: Techniques to explore in this conversation
   - Long-term: Strategies for ongoing development

3. Safety Assessment:
   - Risk level evaluation (low/medium/high/critical)
   - Specific safety concerns if any
   - Recommended safety actions
   - Whether follow-up is needed

Guidelines:
- Prioritize user safety above all else
- Be authentic and human-like in your responses
- Validate emotions while providing hope
- Use the user's name if known
- Reference previous conversations when relevant
- Adapt your language to the user's communication style
- If health data indicates concerning patterns, address them sensitively
- Always maintain therapeutic boundaries
- Encourage professional help when appropriate

Your response should feel like talking to a caring, knowledgeable friend who happens to be a skilled therapist.`,
});

// Safety assessment prompt
const safetyAssessmentPrompt = ai.definePrompt({
  name: 'safetyAssessment',
  input: {
    schema: z.object({
      userMessage: z.string(),
      emotionData: z.string(),
      healthData: z.string().optional(),
      conversationHistory: z.string().optional(),
    })
  },
  output: {
    schema: z.object({
      riskLevel: z.string(),
      concerns: z.array(z.string()),
      actions: z.array(z.string()),
      followUp: z.boolean(),
      urgentIntervention: z.boolean(),    })
  },
  model: 'googleai/gemini-1.5-flash', // Using faster model for better response time
  prompt: `Assess safety and risk factors based on user data:

User Message: "{{{userMessage}}}"

Emotion Data: {{{emotionData}}}

{{#if healthData}}
Health Data: {{{healthData}}}
{{/if}}

{{#if conversationHistory}}
Recent Conversation: {{{conversationHistory}}}
{{/if}}

Assess for:
1. Suicide risk indicators
2. Self-harm potential
3. Severe mental health crisis
4. Substance abuse concerns
5. Domestic violence indicators
6. Severe health emergencies
7. Psychotic symptoms
8. Severe depression or anxiety

Risk Levels:
- Low: Normal therapeutic conversation
- Medium: Elevated distress, monitor closely
- High: Significant risk factors present, immediate support needed
- Critical: Imminent danger, emergency intervention required

Provide specific safety concerns and recommended actions.`,
});

// Main comprehensive MITR AI flow
const comprehensiveMitrFlow = ai.defineFlow(
  {
    name: 'comprehensiveMitrFlow',
    inputSchema: ComprehensiveMitrInputSchema,
    outputSchema: ComprehensiveMitrOutputSchema,  },
  async (input: ComprehensiveMitrInput) => {
    const timestamp = new Date().toISOString();
    
    // Check cache first
    const cachedResponse = getCachedResponse(input);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Use Promise.all to run independent analyses in parallel
    // This significantly reduces waiting time by running operations concurrently
    const [emotionAnalysis, healthAnalysis] = await Promise.all([
      // 1. Analyze emotions from multimodal data (in parallel)
      (async () => {
        try {
          if (!input.imageData && !input.audioFeatures && !input.userMessage) {
            return null; // Skip analysis if no data is available
          }
          
          const emotionInput: EmotionAnalysisInput = {
            imageData: input.imageData,
            audioFeatures: input.audioFeatures,
            textContent: input.userMessage,
            // Minimize conversation history for performance
            conversationHistory: input.conversationHistory
              ?.slice(-2) // Only use last 2 messages for context
              ?.map((msg: any) => `${msg.speaker}: ${msg.message}`)
              .join('\n'),
          };
          return await analyzeEmotions(emotionInput);
        } catch (error) {
          console.error('Emotion analysis failed:', error);
          return null; // Return null instead of throwing to avoid blocking other analyses
        }
      })(),
      
      // 2. Analyze wearables data if available (in parallel)
      (async () => {
        if (!input.wearablesData) {
          return null; // Skip analysis if no data is available
        }
        
        try {
          const wearablesInput: WearablesDataInput = {
            ...input.wearablesData,
            timestamp: input.wearablesData.timestamp,
          };
          return await analyzeWearablesData(wearablesInput);
        } catch (error) {
          console.error('Wearables analysis failed:', error);
          return null;
        }
      })()
    ]);    // Run context management and safety assessment in parallel for improved response time
    const [contextualGuidance, safetyResult] = await Promise.all([
      // 3. Manage context and get therapeutic guidance (in parallel)
      (async () => {
        try {
          const contextInput: ContextManagementInput = {
            currentMessage: input.userMessage,
            conversationHistory: input.conversationHistory?.slice(-3) || [], // Limit history for performance
            userProfile: input.userProfile,
            emotionalContext: emotionAnalysis?.fusedEmotions ? {
              currentEmotion: emotionAnalysis.fusedEmotions.primary,
              emotionIntensity: emotionAnalysis.fusedEmotions.confidence,
              distressLevel: emotionAnalysis.fusedEmotions.distressLevel,
            } : undefined,
            healthContext: healthAnalysis ? {
              wellnessScore: healthAnalysis.overallWellness.score,
              stressLevel: healthAnalysis.mentalHealth.stressLevel,
              sleepQuality: healthAnalysis.physicalHealth.sleepQuality,
              activityLevel: healthAnalysis.physicalHealth.activityLevel,
            } : undefined,
          };
          return await manageContext(contextInput);
        } catch (error) {
          console.error('Context management failed:', error);
          return null;
        }
      })(),
      
      // 4. Assess safety (in parallel)
      safetyAssessmentPrompt({
        userMessage: input.userMessage,
        emotionData: emotionAnalysis ? JSON.stringify({
          primary: emotionAnalysis.fusedEmotions.primary,
          confidence: emotionAnalysis.fusedEmotions.confidence,
          distressLevel: emotionAnalysis.fusedEmotions.distressLevel,
        }) : 'No emotion data',
        healthData: healthAnalysis ? JSON.stringify({
          wellnessScore: healthAnalysis.overallWellness.score,
          stressLevel: healthAnalysis.mentalHealth.stressLevel,
        }) : undefined,
        conversationHistory: input.conversationHistory
          ?.slice(-1) // Reduce to just the last message for better performance
          .map((msg: any) => `${msg.speaker}: ${msg.message}`)
          .join('\n'),
      })
    ]);    // 5. Generate therapeutic response
    const responseResult = await therapeuticResponsePrompt({
      userMessage: input.userMessage,
      emotionAnalysis: emotionAnalysis ? JSON.stringify({
        primary: emotionAnalysis.fusedEmotions.primary,
        confidence: emotionAnalysis.fusedEmotions.confidence,
        distressLevel: emotionAnalysis.fusedEmotions.distressLevel,
        recommendations: emotionAnalysis.recommendations.slice(0, 1) // Limit to just 1 recommendation for performance
      }) : 'No emotion analysis available',
      healthAnalysis: healthAnalysis ? JSON.stringify({
        wellnessScore: healthAnalysis.overallWellness.score,
        stressLevel: healthAnalysis.mentalHealth.stressLevel,
        alerts: healthAnalysis.alerts.slice(0, 1) // Limit to most important alert
      }) : undefined,
      contextualGuidance: contextualGuidance ? JSON.stringify({
        therapeuticIntent: contextualGuidance.therapeuticIntent,
        contextualFactors: {
          urgencyLevel: contextualGuidance.contextualFactors.urgencyLevel,
          sessionPhase: contextualGuidance.contextualFactors.sessionPhase
        }
      }) : 'No contextual guidance available',
      safetyFactors: JSON.stringify({
        riskLevel: safetyResult.output?.riskLevel,
        concerns: safetyResult.output?.concerns.slice(0, 1), // Limit to top concern only
        actions: safetyResult.output?.actions.slice(0, 1), // Limit to top action
        followUp: safetyResult.output?.followUp,
      }),
    });

    // 6. Compile comprehensive response
    const result: ComprehensiveMitrOutput = {
      response: responseResult.output?.response || 'I apologize, but I encountered an issue generating a response. Please try again.',
      
      emotionAnalysis: {
        primary: emotionAnalysis?.fusedEmotions?.primary || 'neutral',
        confidence: emotionAnalysis?.fusedEmotions?.confidence || 0.5,
        distressLevel: emotionAnalysis?.fusedEmotions?.distressLevel || 0.3,
        recommendations: emotionAnalysis?.recommendations || [],
      },
      
      healthAnalysis: healthAnalysis ? {
        wellnessScore: healthAnalysis.overallWellness.score,
        stressLevel: healthAnalysis.mentalHealth.stressLevel,
        alerts: healthAnalysis.alerts,
        recommendations: healthAnalysis.recommendations.immediate,
      } : undefined,
      
      contextualInsights: {
        therapeuticIntent: contextualGuidance?.therapeuticIntent?.primary || 'emotional_support',
        urgencyLevel: contextualGuidance?.contextualFactors?.urgencyLevel || 'low',
        sessionPhase: contextualGuidance?.contextualFactors?.sessionPhase || 'exploration',
        therapeuticAlliance: contextualGuidance?.contextualFactors?.therapeuticAlliance || 70,
      },
      
      avatarControl: emotionAnalysis?.avatarExpression ? {
        expression: emotionAnalysis.avatarExpression.expression,
        intensity: emotionAnalysis.avatarExpression.intensity,
        duration: emotionAnalysis.avatarExpression.duration,
        emotionalState: 'supportive',
      } : {
        expression: 'empathetic',
        intensity: 0.7,
        duration: 5,
        emotionalState: 'supportive',
      },
      
      interventions: responseResult.output?.interventions || {
        immediate: ['Take a deep breath', 'Ground yourself in the present moment'],
        session: ['Explore your feelings', 'Practice mindfulness'],
        longTerm: ['Develop coping strategies', 'Build emotional resilience'],
      },
      
      safetyAssessment: {
        riskLevel: safetyResult.output?.riskLevel || 'low',
        concerns: safetyResult.output?.concerns || [],
        actions: safetyResult.output?.actions || [],
        followUp: safetyResult.output?.followUp || false,
      },
      
      metadata: {
        analysisTimestamp: timestamp,
        confidenceScore: (
          (emotionAnalysis?.fusedEmotions?.confidence || 0.5) +
          (contextualGuidance?.therapeuticIntent?.confidence || 0.5)
        ) / 2,
        dataQuality: {
          emotional: emotionAnalysis ? 0.8 : 0.3,
          health: healthAnalysis ? 0.9 : 0.0,
          contextual: contextualGuidance ? 0.8 : 0.5,
        },
      },
    };

    // Cache the response before returning
    cacheResponse(input, result);

    return result;
  }
);

export async function processComprehensiveMitrRequest(input: ComprehensiveMitrInput): Promise<ComprehensiveMitrOutput> {
  // Check for cached response first
  const cacheKey = generateCacheKey(input);
  const cached = responseCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_EXPIRY_MS) {
    console.log('Using cached response');
    return cached.response;
  }
  
  // If not cached, proceed with the full analysis
  const result = await comprehensiveMitrFlow(input);
  
  // Cache the result (this internally handles cleanup when needed)
  cacheResponse(input, result);
  
  return result;
}
