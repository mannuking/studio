'use server';

/**
 * @fileOverview Comprehensive emotion analysis system for MITR AI
 * Handles facial emotion recognition, voice tone analysis, text sentiment analysis,
 * and multimodal fusion to provide unified emotional insights.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input schemas for different modalities
const EmotionAnalysisInputSchema = z.object({
  imageData: z.string().optional().describe('Base64 encoded image data for facial emotion analysis'),
  audioFeatures: z.object({
    pitch: z.number().optional(),
    energy: z.number().optional(),
    spectralCentroid: z.number().optional(),
    mfcc: z.array(z.number()).optional(),
    duration: z.number().optional(),
  }).optional().describe('Audio features extracted from voice'),
  textContent: z.string().optional().describe('Text content for sentiment analysis'),
  conversationHistory: z.string().optional().describe('Previous conversation context'),
});

export type EmotionAnalysisInput = z.infer<typeof EmotionAnalysisInputSchema>;

// Output schema for emotion analysis
const EmotionAnalysisOutputSchema = z.object({
  facialEmotions: z.object({
    primary: z.string().describe('Primary facial emotion detected'),
    confidence: z.number().describe('Confidence score 0-1'),
    emotions: z.object({
      happy: z.number().optional(),
      sad: z.number().optional(),
      angry: z.number().optional(),
      fearful: z.number().optional(),
      surprised: z.number().optional(),
      disgusted: z.number().optional(),
      neutral: z.number().optional(),
      contempt: z.number().optional(),
      excited: z.number().optional(),
      frustrated: z.number().optional(),
      confused: z.number().optional(),
      anxious: z.number().optional(),
      calm: z.number().optional(),
      stressed: z.number().optional(),
    }).describe('All detected emotions with scores'),
    arousal: z.number().describe('Arousal level 0-1'),
    valence: z.number().describe('Valence level 0-1'),
  }).optional(),
  voiceEmotions: z.object({
    primary: z.string().describe('Primary voice emotion detected'),
    confidence: z.number().describe('Confidence score 0-1'),
    emotions: z.object({
      happy: z.number().optional(),
      sad: z.number().optional(),
      angry: z.number().optional(),
      fearful: z.number().optional(),
      surprised: z.number().optional(),
      neutral: z.number().optional(),
      excited: z.number().optional(),
      frustrated: z.number().optional(),
      anxious: z.number().optional(),
      calm: z.number().optional(),
      stressed: z.number().optional(),
      tired: z.number().optional(),
      confident: z.number().optional(),
    }).describe('All detected emotions with scores'),
    stress: z.number().describe('Stress level 0-1'),
    energy: z.number().describe('Energy level 0-1'),
  }).optional(),
  textEmotions: z.object({
    primary: z.string().describe('Primary text emotion detected'),
    confidence: z.number().describe('Confidence score 0-1'),
    emotions: z.object({
      happy: z.number().optional(),
      sad: z.number().optional(),
      angry: z.number().optional(),
      fearful: z.number().optional(),
      surprised: z.number().optional(),
      disgusted: z.number().optional(),
      neutral: z.number().optional(),
      excited: z.number().optional(),
      frustrated: z.number().optional(),
      confused: z.number().optional(),
      anxious: z.number().optional(),
      hopeful: z.number().optional(),
      disappointed: z.number().optional(),
      grateful: z.number().optional(),
      lonely: z.number().optional(),
      overwhelmed: z.number().optional(),
    }).describe('All detected emotions with scores'),
    sentiment: z.number().describe('Sentiment score -1 to 1'),
    intensity: z.number().describe('Emotional intensity 0-1'),
  }).optional(),
  fusedEmotions: z.object({
    primary: z.string().describe('Primary fused emotion from all modalities'),
    confidence: z.number().describe('Overall confidence score 0-1'),
    emotions: z.object({
      happy: z.number().optional(),
      sad: z.number().optional(),
      angry: z.number().optional(),
      fearful: z.number().optional(),
      surprised: z.number().optional(),
      disgusted: z.number().optional(),
      neutral: z.number().optional(),
      excited: z.number().optional(),
      frustrated: z.number().optional(),
      confused: z.number().optional(),
      anxious: z.number().optional(),
      hopeful: z.number().optional(),
      disappointed: z.number().optional(),
      grateful: z.number().optional(),
      lonely: z.number().optional(),
      overwhelmed: z.number().optional(),
    }).describe('Fused emotion scores'),
    arousal: z.number().describe('Overall arousal level 0-1'),
    valence: z.number().describe('Overall valence level 0-1'),
    distressLevel: z.number().describe('Emotional distress assessment 0-1'),
  }),
  recommendations: z.array(z.string()).describe('Therapeutic recommendations based on analysis'),
  avatarExpression: z.object({
    expression: z.string().describe('Recommended avatar expression'),
    intensity: z.number().describe('Expression intensity 0-1'),
    duration: z.number().describe('How long to maintain expression in seconds'),
  }),
});

export type EmotionAnalysisOutput = z.infer<typeof EmotionAnalysisOutputSchema>;

// Facial emotion analysis prompt
const facialEmotionPrompt = ai.definePrompt({
  name: 'facialEmotionAnalysis',
  input: { schema: z.object({ imageData: z.string() }) },
  output: { 
    schema: z.object({
      primary: z.string(),
      confidence: z.number(),
      emotions: z.object({
        happy: z.number().optional(),
        sad: z.number().optional(),
        angry: z.number().optional(),
        fearful: z.number().optional(),
        surprised: z.number().optional(),
        disgusted: z.number().optional(),
        neutral: z.number().optional(),
        contempt: z.number().optional(),
        excited: z.number().optional(),
        frustrated: z.number().optional(),
        confused: z.number().optional(),
        anxious: z.number().optional(),
        calm: z.number().optional(),
        stressed: z.number().optional(),
      }),
      arousal: z.number(),
      valence: z.number(),
    })
  },
  model: 'googleai/gemini-2.5-flash-preview-05-20',
  prompt: `Analyze the facial expression in this image for emotional content. 

Consider these emotions: happy, sad, angry, fearful, surprised, disgusted, neutral, contempt, excited, frustrated, confused, anxious, calm, stressed.

Provide:
1. Primary emotion detected
2. Confidence score (0-1)
3. Scores for all relevant emotions (0-1)
4. Arousal level (0=calm, 1=highly aroused)
5. Valence level (0=negative, 1=positive)

Focus on micro-expressions, eye contact, facial muscle tension, and overall expression quality.

Image: {{{imageData}}}`,
});

// Voice emotion analysis prompt
const voiceEmotionPrompt = ai.definePrompt({
  name: 'voiceEmotionAnalysis',
  input: { 
    schema: z.object({
      audioFeatures: z.object({
        pitch: z.number().optional(),
        energy: z.number().optional(),
        spectralCentroid: z.number().optional(),
        mfcc: z.array(z.number()).optional(),
        duration: z.number().optional(),
      })
    })
  },
  output: {
    schema: z.object({
      primary: z.string(),
      confidence: z.number(),
      emotions: z.object({
        happy: z.number().optional(),
        sad: z.number().optional(),
        angry: z.number().optional(),
        fearful: z.number().optional(),
        surprised: z.number().optional(),
        neutral: z.number().optional(),
        excited: z.number().optional(),
        frustrated: z.number().optional(),
        anxious: z.number().optional(),
        calm: z.number().optional(),
        stressed: z.number().optional(),
        tired: z.number().optional(),
        confident: z.number().optional(),
      }),
      stress: z.number(),
      energy: z.number(),
    })
  },
  model: 'googleai/gemini-2.5-flash-preview-05-20',
  prompt: `Analyze voice emotional content based on these audio features:

Pitch: {{{audioFeatures.pitch}}} Hz (average fundamental frequency)
Energy: {{{audioFeatures.energy}}} (voice energy level)
Spectral Centroid: {{{audioFeatures.spectralCentroid}}} Hz (brightness)
MFCC: {{{audioFeatures.mfcc}}} (mel-frequency cepstral coefficients)
Duration: {{{audioFeatures.duration}}} seconds

Consider these emotions: happy, sad, angry, fearful, surprised, neutral, excited, frustrated, anxious, calm, stressed, tired, confident.

Analyze:
- Pitch variations (high pitch = excitement/stress, low pitch = sadness/calm)
- Energy levels (high energy = excitement/anger, low energy = sadness/fatigue)
- Spectral characteristics (brightness indicates emotional arousal)
- Speaking rate and rhythm patterns

Provide:
1. Primary emotion detected
2. Confidence score (0-1)
3. Scores for all relevant emotions (0-1)
4. Stress level (0=relaxed, 1=highly stressed)
5. Energy level (0=low energy, 1=high energy)`,
});

// Text emotion analysis prompt
const textEmotionPrompt = ai.definePrompt({
  name: 'textEmotionAnalysis',
  input: { 
    schema: z.object({
      textContent: z.string(),
      conversationHistory: z.string().optional(),
    })
  },
  output: {
    schema: z.object({
      primary: z.string(),
      confidence: z.number(),
      emotions: z.object({
        happy: z.number().optional(),
        sad: z.number().optional(),
        angry: z.number().optional(),
        fearful: z.number().optional(),
        surprised: z.number().optional(),
        disgusted: z.number().optional(),
        neutral: z.number().optional(),
        excited: z.number().optional(),
        frustrated: z.number().optional(),
        confused: z.number().optional(),
        anxious: z.number().optional(),
        hopeful: z.number().optional(),
        disappointed: z.number().optional(),
        grateful: z.number().optional(),
        lonely: z.number().optional(),
        overwhelmed: z.number().optional(),
      }),
      sentiment: z.number(),
      intensity: z.number(),
    })
  },
  model: 'googleai/gemini-2.5-flash-preview-05-20',
  prompt: `Analyze the emotional content and sentiment of this text:

Text: "{{{textContent}}}"

{{#if conversationHistory}}
Conversation Context: {{{conversationHistory}}}
{{/if}}

Consider these emotions: happy, sad, angry, fearful, surprised, disgusted, neutral, excited, frustrated, confused, anxious, hopeful, disappointed, grateful, lonely, overwhelmed.

Analyze:
- Word choice and emotional language
- Sentence structure and tone
- Context from conversation history
- Implicit emotional indicators
- Therapeutic relevance (signs of distress, coping, progress)

Provide:
1. Primary emotion detected
2. Confidence score (0-1)
3. Scores for all relevant emotions (0-1)
4. Sentiment score (-1=very negative, 0=neutral, 1=very positive)
5. Emotional intensity (0=mild, 1=very intense)`,
});

// Multimodal fusion prompt
const multimodalFusionPrompt = ai.definePrompt({
  name: 'multimodalFusion',
  input: {
    schema: z.object({
      facialData: z.any().optional(),
      voiceData: z.any().optional(),
      textData: z.any().optional(),
    })
  },
  output: {
    schema: z.object({
      primary: z.string(),
      confidence: z.number(),
      emotions: z.object({
        happy: z.number().optional(),
        sad: z.number().optional(),
        angry: z.number().optional(),
        fearful: z.number().optional(),
        surprised: z.number().optional(),
        disgusted: z.number().optional(),
        neutral: z.number().optional(),
        excited: z.number().optional(),
        frustrated: z.number().optional(),
        confused: z.number().optional(),
        anxious: z.number().optional(),
        hopeful: z.number().optional(),
        disappointed: z.number().optional(),
        grateful: z.number().optional(),
        lonely: z.number().optional(),
        overwhelmed: z.number().optional(),
      }),
      arousal: z.number(),
      valence: z.number(),
      distressLevel: z.number(),
      recommendations: z.array(z.string()),
      avatarExpression: z.object({
        expression: z.string(),
        intensity: z.number(),
        duration: z.number(),
      }),
    })
  },
  model: 'googleai/gemini-2.5-flash-preview-05-20',
  prompt: `Perform multimodal emotion fusion and therapeutic assessment:

{{#if facialData}}
Facial Analysis: {{{facialData}}}
{{/if}}

{{#if voiceData}}
Voice Analysis: {{{voiceData}}}
{{/if}}

{{#if textData}}
Text Analysis: {{{textData}}}
{{/if}}

As a therapeutic AI, fuse these modalities using attention-weighted fusion:
1. Identify the most reliable modality based on confidence scores
2. Look for emotional congruence or incongruence across modalities
3. Weight facial expressions (40%), voice tone (35%), text content (25%)
4. Consider therapeutic context and emotional regulation patterns

Provide:
1. Primary fused emotion
2. Overall confidence score
3. Fused emotion scores for all detected emotions
4. Overall arousal level (0-1)
5. Overall valence level (0-1)
6. Distress level assessment (0=no distress, 1=severe distress)
7. 3-5 therapeutic recommendations
8. Avatar expression recommendation (empathetic, supportive, concerned, encouraging, calm, etc.) with intensity and duration

Focus on therapeutic value and emotional support needs.`,
});

// Main emotion analysis flow
const emotionAnalysisFlow = ai.defineFlow(
  {
    name: 'emotionAnalysisFlow',
    inputSchema: EmotionAnalysisInputSchema,
    outputSchema: EmotionAnalysisOutputSchema,
  },
  async (input) => {
    const results: Partial<EmotionAnalysisOutput> = {};

    // Analyze facial emotions if image data provided
    if (input.imageData) {
      try {
        const { output: facialResult } = await facialEmotionPrompt({
          imageData: input.imageData
        });
        results.facialEmotions = facialResult;
      } catch (error) {
        console.error('Facial emotion analysis failed:', error);
      }
    }

    // Analyze voice emotions if audio features provided
    if (input.audioFeatures) {
      try {
        const { output: voiceResult } = await voiceEmotionPrompt({
          audioFeatures: input.audioFeatures
        });
        results.voiceEmotions = voiceResult;
      } catch (error) {
        console.error('Voice emotion analysis failed:', error);
      }
    }

    // Analyze text emotions if text content provided
    if (input.textContent) {
      try {
        const { output: textResult } = await textEmotionPrompt({
          textContent: input.textContent,
          conversationHistory: input.conversationHistory
        });
        results.textEmotions = textResult;
      } catch (error) {
        console.error('Text emotion analysis failed:', error);
      }
    }

    // Perform multimodal fusion
    const { output: fusionResult } = await multimodalFusionPrompt({
      facialData: results.facialEmotions ? JSON.stringify(results.facialEmotions) : undefined,
      voiceData: results.voiceEmotions ? JSON.stringify(results.voiceEmotions) : undefined,
      textData: results.textEmotions ? JSON.stringify(results.textEmotions) : undefined,
    });

    results.fusedEmotions = {
      primary: fusionResult.primary,
      confidence: fusionResult.confidence,
      emotions: fusionResult.emotions,
      arousal: fusionResult.arousal,
      valence: fusionResult.valence,
      distressLevel: fusionResult.distressLevel,
    };
    results.recommendations = fusionResult.recommendations;
    results.avatarExpression = fusionResult.avatarExpression;

    return results as EmotionAnalysisOutput;
  }
);

export async function analyzeEmotions(input: EmotionAnalysisInput): Promise<EmotionAnalysisOutput> {
  return emotionAnalysisFlow(input);
} 
