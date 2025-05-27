'use server';

/**
 * @fileOverview Wearables data analysis system for MITR AI
 * Analyzes health and wellness data from various wearable devices
 * to provide insights into user's physical and mental state.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input schema for wearables data
const WearablesDataInputSchema = z.object({
  heartRate: z.object({
    current: z.number().optional(),
    resting: z.number().optional(),
    max: z.number().optional(),
    variability: z.number().optional(), // HRV in ms
    trend: z.array(z.number()).optional(), // Last 24h trend
  }).optional(),
  sleep: z.object({
    duration: z.number().optional(), // hours
    quality: z.number().optional(), // 0-100 score
    deepSleep: z.number().optional(), // hours
    remSleep: z.number().optional(), // hours
    efficiency: z.number().optional(), // percentage
    disturbances: z.number().optional(),
  }).optional(),
  activity: z.object({
    steps: z.number().optional(),
    calories: z.number().optional(),
    activeMinutes: z.number().optional(),
    sedentaryMinutes: z.number().optional(),
    exerciseType: z.string().optional(),
    intensity: z.string().optional(), // low, moderate, high
  }).optional(),
  stress: z.object({
    level: z.number().optional(), // 0-100
    trend: z.array(z.number()).optional(),
    recoveryTime: z.number().optional(), // minutes
    stressEvents: z.number().optional(),
  }).optional(),
  environment: z.object({
    temperature: z.number().optional(),
    humidity: z.number().optional(),
    airQuality: z.number().optional(),
    noiseLevel: z.number().optional(),
    lightExposure: z.number().optional(),
  }).optional(),
  biometrics: z.object({
    bloodOxygen: z.number().optional(), // SpO2 percentage
    skinTemperature: z.number().optional(),
    respiratoryRate: z.number().optional(),
    bloodPressure: z.object({
      systolic: z.number(),
      diastolic: z.number(),
    }).optional(),
  }).optional(),
  timestamp: z.string().describe('ISO timestamp of data collection'),
  deviceType: z.string().optional().describe('Type of wearable device'),
});

export type WearablesDataInput = z.infer<typeof WearablesDataInputSchema>;

// Output schema for wearables analysis
const WearablesAnalysisOutputSchema = z.object({
  overallWellness: z.object({
    score: z.number().describe('Overall wellness score 0-100'),
    trend: z.string().describe('improving, stable, declining'),
    primaryConcerns: z.array(z.string()),
  }),
  physicalHealth: z.object({
    cardiovascularHealth: z.number().describe('CV health score 0-100'),
    sleepQuality: z.number().describe('Sleep quality score 0-100'),
    activityLevel: z.number().describe('Activity level score 0-100'),
    recoveryStatus: z.string().describe('excellent, good, fair, poor'),
  }),
  mentalHealth: z.object({
    stressLevel: z.number().describe('Stress level 0-100'),
    fatigueLevel: z.number().describe('Fatigue level 0-100'),
    moodIndicators: z.record(z.number()).describe('Mood indicators from biometrics'),
    cognitiveLoad: z.number().describe('Estimated cognitive load 0-100'),
  }),
  recommendations: z.object({
    immediate: z.array(z.string()).describe('Immediate action recommendations'),
    shortTerm: z.array(z.string()).describe('Short-term lifestyle recommendations'),
    longTerm: z.array(z.string()).describe('Long-term health recommendations'),
  }),
  therapeuticInsights: z.object({
    emotionalState: z.string().describe('Inferred emotional state from biometrics'),
    stressFactors: z.array(z.string()).describe('Identified stress factors'),
    copingCapacity: z.number().describe('Current coping capacity 0-100'),
    interventionNeeded: z.boolean().describe('Whether immediate intervention is needed'),
  }),
  alerts: z.array(z.object({
    type: z.string().describe('Type of alert'),
    severity: z.string().describe('low, medium, high, critical'),
    message: z.string().describe('Alert message'),
    action: z.string().describe('Recommended action'),
  })),
});

export type WearablesAnalysisOutput = z.infer<typeof WearablesAnalysisOutputSchema>;

// Wearables analysis prompt
const wearablesAnalysisPrompt = ai.definePrompt({
  name: 'wearablesAnalysis',
  input: { schema: WearablesDataInputSchema },
  output: { schema: WearablesAnalysisOutputSchema },
  model: 'googleai/gemini-2.5-flash-preview-05-20',
  prompt: `Analyze wearables health data for therapeutic insights and wellness assessment:

{{#if heartRate}}
Heart Rate Data:
- Current: {{{heartRate.current}}} bpm
- Resting: {{{heartRate.resting}}} bpm
- Max: {{{heartRate.max}}} bpm
- HRV: {{{heartRate.variability}}} ms
- 24h Trend: {{{heartRate.trend}}}
{{/if}}

{{#if sleep}}
Sleep Data:
- Duration: {{{sleep.duration}}} hours
- Quality Score: {{{sleep.quality}}}/100
- Deep Sleep: {{{sleep.deepSleep}}} hours
- REM Sleep: {{{sleep.remSleep}}} hours
- Efficiency: {{{sleep.efficiency}}}%
- Disturbances: {{{sleep.disturbances}}}
{{/if}}

{{#if activity}}
Activity Data:
- Steps: {{{activity.steps}}}
- Calories: {{{activity.calories}}}
- Active Minutes: {{{activity.activeMinutes}}}
- Sedentary Minutes: {{{activity.sedentaryMinutes}}}
- Exercise Type: {{{activity.exerciseType}}}
- Intensity: {{{activity.intensity}}}
{{/if}}

{{#if stress}}
Stress Data:
- Level: {{{stress.level}}}/100
- Trend: {{{stress.trend}}}
- Recovery Time: {{{stress.recoveryTime}}} minutes
- Stress Events: {{{stress.stressEvents}}}
{{/if}}

{{#if environment}}
Environmental Data:
- Temperature: {{{environment.temperature}}}°C
- Humidity: {{{environment.humidity}}}%
- Air Quality: {{{environment.airQuality}}}
- Noise Level: {{{environment.noiseLevel}}} dB
- Light Exposure: {{{environment.lightExposure}}} lux
{{/if}}

{{#if biometrics}}
Biometric Data:
- Blood Oxygen: {{{biometrics.bloodOxygen}}}%
- Skin Temperature: {{{biometrics.skinTemperature}}}°C
- Respiratory Rate: {{{biometrics.respiratoryRate}}} bpm
{{#if biometrics.bloodPressure}}
- Blood Pressure: {{{biometrics.bloodPressure.systolic}}}/{{{biometrics.bloodPressure.diastolic}}} mmHg
{{/if}}
{{/if}}

Device: {{{deviceType}}}
Timestamp: {{{timestamp}}}

As a therapeutic AI analyzing health data, provide:

1. Overall Wellness Assessment:
   - Comprehensive wellness score (0-100)
   - Trend analysis (improving/stable/declining)
   - Primary health concerns

2. Physical Health Analysis:
   - Cardiovascular health score based on HR, HRV, BP
   - Sleep quality assessment and impact on mental health
   - Activity level evaluation and recommendations
   - Recovery status assessment

3. Mental Health Indicators:
   - Stress level analysis from HRV, sleep, activity patterns
   - Fatigue assessment from sleep and activity data
   - Mood indicators from biometric patterns
   - Cognitive load estimation

4. Therapeutic Insights:
   - Emotional state inference from physiological data
   - Stress factor identification
   - Current coping capacity assessment
   - Need for immediate therapeutic intervention

5. Recommendations:
   - Immediate actions (next 1-4 hours)
   - Short-term lifestyle changes (next few days)
   - Long-term health improvements (weeks/months)

6. Health Alerts:
   - Any concerning patterns or values
   - Severity assessment
   - Recommended actions

Focus on therapeutic relevance and mental health implications of physical health data.`,
});

// Main wearables analysis flow
const wearablesAnalysisFlow = ai.defineFlow(
  {
    name: 'wearablesAnalysisFlow',
    inputSchema: WearablesDataInputSchema,
    outputSchema: WearablesAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await wearablesAnalysisPrompt(input);
    return output!;
  }
);

export async function analyzeWearablesData(input: WearablesDataInput): Promise<WearablesAnalysisOutput> {
  return wearablesAnalysisFlow(input);
} 
