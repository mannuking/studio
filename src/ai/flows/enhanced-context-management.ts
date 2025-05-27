'use server';

/**
 * @fileOverview Enhanced context management system for MITR AI
 * Implements semantic embeddings, similarity search, and therapeutic knowledge base
 * for contextual relevance and adaptive therapeutic responses.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Context management input schema
const ContextManagementInputSchema = z.object({
  currentMessage: z.string().describe('Current user message'),
  conversationHistory: z.array(z.object({
    speaker: z.string(),
    message: z.string(),
    timestamp: z.string(),
    emotions: z.record(z.number()).optional(),
    intent: z.string().optional(),
  })).describe('Full conversation history with metadata'),
  userProfile: z.object({
    preferences: z.record(z.any()).optional(),
    therapeuticGoals: z.array(z.string()).optional(),
    triggers: z.array(z.string()).optional(),
    copingStrategies: z.array(z.string()).optional(),
    sessionHistory: z.array(z.string()).optional(),
  }).optional(),
  emotionalContext: z.object({
    currentEmotion: z.string().optional(),
    emotionIntensity: z.number().optional(),
    emotionTrend: z.string().optional(),
    distressLevel: z.number().optional(),
  }).optional(),
  healthContext: z.object({
    wellnessScore: z.number().optional(),
    stressLevel: z.number().optional(),
    sleepQuality: z.number().optional(),
    activityLevel: z.number().optional(),
  }).optional(),
});

export type ContextManagementInput = z.infer<typeof ContextManagementInputSchema>;

// Context management output schema
const ContextManagementOutputSchema = z.object({
  relevantContext: z.array(z.object({
    content: z.string(),
    relevanceScore: z.number(),
    source: z.string(),
    timestamp: z.string().optional(),
  })).describe('Most relevant context from history and knowledge base'),
  therapeuticIntent: z.object({
    primary: z.string().describe('Primary therapeutic intent'),
    secondary: z.array(z.string()).describe('Secondary therapeutic intents'),
    confidence: z.number().describe('Confidence in intent classification'),
  }),
  responseStrategy: z.object({
    approach: z.string().describe('Therapeutic approach to use'),
    tone: z.string().describe('Recommended tone for response'),
    techniques: z.array(z.string()).describe('Specific therapeutic techniques to employ'),
    avoidances: z.array(z.string()).describe('Things to avoid in response'),
  }),
  contextualFactors: z.object({
    emotionalState: z.string(),
    urgencyLevel: z.string().describe('low, medium, high, critical'),
    sessionPhase: z.string().describe('opening, exploration, intervention, closure'),
    therapeuticAlliance: z.number().describe('Strength of therapeutic relationship 0-100'),
  }),
  knowledgeBaseMatches: z.array(z.object({
    topic: z.string(),
    content: z.string(),
    relevanceScore: z.number(),
    category: z.string(),
  })).describe('Relevant therapeutic knowledge and techniques'),
  adaptivePrompt: z.string().describe('Contextually adapted prompt for response generation'),
});

export type ContextManagementOutput = z.infer<typeof ContextManagementOutputSchema>;

// Intent classification prompt
const intentClassificationPrompt = ai.definePrompt({
  name: 'intentClassification',
  input: { 
    schema: z.object({
      message: z.string(),
      conversationContext: z.string().optional(),
    })
  },
  output: {
    schema: z.object({
      primary: z.string(),
      secondary: z.array(z.string()),
      confidence: z.number(),
    })
  },
  model: 'googleai/gemini-2.5-flash-preview-05-20',
  prompt: `Classify the therapeutic intent of this user message:

Message: "{{{message}}}"

{{#if conversationContext}}
Conversation Context: {{{conversationContext}}}
{{/if}}

Therapeutic Intent Categories:
- emotional_support: Seeking comfort, validation, empathy
- problem_solving: Looking for solutions, strategies, advice
- self_reflection: Exploring thoughts, feelings, behaviors
- crisis_intervention: Immediate help, safety concerns
- goal_setting: Establishing objectives, planning
- skill_building: Learning coping strategies, techniques
- relationship_issues: Interpersonal problems, communication
- trauma_processing: Dealing with past traumatic experiences
- anxiety_management: Handling worry, fear, panic
- depression_support: Addressing sadness, hopelessness
- stress_management: Coping with pressure, overwhelm
- behavioral_change: Modifying habits, patterns
- mindfulness_practice: Present-moment awareness, meditation
- grief_processing: Dealing with loss, bereavement
- identity_exploration: Understanding self, values, purpose
- information_seeking: Asking questions, learning
- session_management: Opening, closing, scheduling
- small_talk: Casual conversation, rapport building

Provide:
1. Primary intent (most likely)
2. Secondary intents (other possible intents)
3. Confidence score (0-1)`,
});

// Therapeutic knowledge base (simplified - in production would be a vector database)
const therapeuticKnowledgeBase = [
  {
    topic: "Active Listening",
    content: "Reflect back what you hear, validate emotions, ask open-ended questions, avoid judgment",
    category: "communication_techniques",
    keywords: ["listening", "validation", "empathy", "understanding"]
  },
  {
    topic: "Cognitive Behavioral Therapy",
    content: "Help identify thought patterns, challenge negative thinking, explore behavior-emotion connections",
    category: "therapeutic_approaches",
    keywords: ["thoughts", "thinking", "behavior", "patterns", "negative"]
  },
  {
    topic: "Mindfulness Techniques",
    content: "Guide breathing exercises, present-moment awareness, body scans, non-judgmental observation",
    category: "coping_strategies",
    keywords: ["mindfulness", "breathing", "present", "awareness", "meditation"]
  },
  {
    topic: "Crisis Intervention",
    content: "Assess safety, provide immediate support, connect to resources, create safety plan",
    category: "crisis_management",
    keywords: ["crisis", "safety", "emergency", "harm", "suicide", "danger"]
  },
  {
    topic: "Anxiety Management",
    content: "Teach grounding techniques, progressive muscle relaxation, exposure therapy principles",
    category: "anxiety_support",
    keywords: ["anxiety", "worry", "fear", "panic", "nervous", "stressed"]
  },
  {
    topic: "Depression Support",
    content: "Validate feelings, encourage small steps, behavioral activation, hope instillation",
    category: "depression_support",
    keywords: ["depression", "sad", "hopeless", "empty", "worthless", "tired"]
  },
  {
    topic: "Trauma-Informed Care",
    content: "Create safety, avoid re-traumatization, respect autonomy, build trust gradually",
    category: "trauma_support",
    keywords: ["trauma", "abuse", "ptsd", "flashbacks", "triggers", "safety"]
  },
  {
    topic: "Motivational Interviewing",
    content: "Explore ambivalence, enhance motivation, support self-efficacy, avoid confrontation",
    category: "change_facilitation",
    keywords: ["motivation", "change", "ambivalence", "goals", "commitment"]
  }
];

// Context analysis and management prompt
const contextAnalysisPrompt = ai.definePrompt({
  name: 'contextAnalysis',
  input: { schema: ContextManagementInputSchema },
  output: { schema: ContextManagementOutputSchema },
  model: 'googleai/gemini-2.5-flash-preview-05-20',
  prompt: `Analyze conversation context and provide therapeutic guidance:

Current Message: "{{{currentMessage}}}"

{{#if conversationHistory}}
Conversation History:
{{#each conversationHistory}}
{{{speaker}}}: {{{message}}} ({{timestamp}})
{{#if emotions}}Emotions: {{{emotions}}}{{/if}}
{{#if intent}}Intent: {{{intent}}}{{/if}}
{{/each}}
{{/if}}

{{#if userProfile}}
User Profile:
{{#if userProfile.therapeuticGoals}}Goals: {{{userProfile.therapeuticGoals}}}{{/if}}
{{#if userProfile.triggers}}Triggers: {{{userProfile.triggers}}}{{/if}}
{{#if userProfile.copingStrategies}}Coping Strategies: {{{userProfile.copingStrategies}}}{{/if}}
{{/if}}

{{#if emotionalContext}}
Emotional Context:
- Current Emotion: {{{emotionalContext.currentEmotion}}}
- Intensity: {{{emotionalContext.emotionIntensity}}}
- Trend: {{{emotionalContext.emotionTrend}}}
- Distress Level: {{{emotionalContext.distressLevel}}}
{{/if}}

{{#if healthContext}}
Health Context:
- Wellness Score: {{{healthContext.wellnessScore}}}
- Stress Level: {{{healthContext.stressLevel}}}
- Sleep Quality: {{{healthContext.sleepQuality}}}
- Activity Level: {{{healthContext.activityLevel}}}
{{/if}}

As a therapeutic AI, analyze this context and provide:

1. Relevant Context Extraction:
   - Identify most relevant previous conversations
   - Extract key themes and patterns
   - Note emotional progression
   - Highlight therapeutic milestones

2. Therapeutic Intent Classification:
   - Primary intent of current message
   - Secondary possible intents
   - Confidence in classification

3. Response Strategy:
   - Appropriate therapeutic approach
   - Recommended tone and style
   - Specific techniques to use
   - Things to avoid

4. Contextual Factors:
   - Current emotional state assessment
   - Urgency level determination
   - Session phase identification
   - Therapeutic alliance strength

5. Knowledge Base Integration:
   - Relevant therapeutic concepts
   - Applicable techniques and interventions
   - Evidence-based approaches

6. Adaptive Prompt Generation:
   - Create a contextually-aware prompt for response generation
   - Include relevant history and therapeutic considerations
   - Specify approach and techniques to use

Focus on therapeutic effectiveness, safety, and building rapport.`,
});

// Similarity search function (simplified - would use vector embeddings in production)
function findRelevantKnowledge(message: string, emotionalContext?: any): typeof therapeuticKnowledgeBase {
  const messageLower = message.toLowerCase();
  const relevantKnowledge = therapeuticKnowledgeBase.filter(item => {
    return item.keywords.some(keyword => messageLower.includes(keyword));
  });

  // Add emotional context matching
  if (emotionalContext?.currentEmotion) {
    const emotionKeywords = {
      'anxious': ['anxiety', 'worry', 'fear'],
      'sad': ['depression', 'sad', 'hopeless'],
      'angry': ['anger', 'frustration', 'irritation'],
      'stressed': ['stress', 'overwhelm', 'pressure'],
      'confused': ['confusion', 'uncertainty', 'clarity'],
      'hopeful': ['hope', 'optimism', 'positive'],
    };

    const emotionKeys = emotionKeywords[emotionalContext.currentEmotion as keyof typeof emotionKeywords] || [];
    const emotionMatches = therapeuticKnowledgeBase.filter(item =>
      emotionKeys.some(key => item.keywords.includes(key))
    );

    relevantKnowledge.push(...emotionMatches);
  }

  // Remove duplicates and score by relevance
  const uniqueKnowledge = Array.from(new Set(relevantKnowledge));
  return uniqueKnowledge.slice(0, 5); // Return top 5 matches
}

// Main context management flow
const contextManagementFlow = ai.defineFlow(
  {
    name: 'contextManagementFlow',
    inputSchema: ContextManagementInputSchema,
    outputSchema: ContextManagementOutputSchema,
  },
  async (input) => {
    // Classify intent
    const conversationContext = input.conversationHistory
      ?.slice(-5) // Last 5 messages for context
      .map(msg => `${msg.speaker}: ${msg.message}`)
      .join('\n');

    const { output: intentResult } = await intentClassificationPrompt({
      message: input.currentMessage,
      conversationContext,
    });

    // Find relevant knowledge
    const relevantKnowledge = findRelevantKnowledge(
      input.currentMessage,
      input.emotionalContext
    );

    // Perform full context analysis
    const { output: contextResult } = await contextAnalysisPrompt(input);

    // Ensure contextResult is not null
    if (!contextResult) {
      throw new Error('Context analysis failed to produce results');
    }

    // Ensure intentResult is not null
    if (!intentResult) {
      throw new Error('Intent classification failed to produce results');
    }

    // Enhance with knowledge base matches
    contextResult.knowledgeBaseMatches = relevantKnowledge.map(item => ({
      topic: item.topic,
      content: item.content,
      relevanceScore: 0.8, // Simplified scoring
      category: item.category,
    }));

    // Override intent with our classification
    contextResult.therapeuticIntent = intentResult;

    return contextResult;
  }
);

export async function manageContext(input: ContextManagementInput): Promise<ContextManagementOutput> {
  return contextManagementFlow(input);
} 
