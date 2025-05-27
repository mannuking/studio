/**
 * @fileOverview Client-side multimodal utility functions
 * These functions handle image capture, audio processing, and data generation
 * for the MITR AI multimodal analysis system.
 */

import type { ComprehensiveMitrInput } from '@/ai/flows/comprehensive-mitr-ai';

// Helper function to extract audio features from audio data (placeholder)
export function extractAudioFeatures(audioData: ArrayBuffer): ComprehensiveMitrInput['audioFeatures'] {
  // This would use actual audio processing libraries like Web Audio API
  // For now, return mock features
  return {
    pitch: 150 + Math.random() * 100,
    energy: Math.random(),
    spectralCentroid: 1000 + Math.random() * 2000,
    mfcc: Array.from({ length: 13 }, () => Math.random() * 2 - 1),
    duration: 2 + Math.random() * 8,
  };
}

// Helper function to capture image from video element
export function captureImageFromVideo(videoElement: HTMLVideoElement): string | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(videoElement, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (error) {
    console.error('Failed to capture image from video:', error);
    return null;
  }
}

// Helper function to extract conversation patterns (simplified)
export function extractConversationPatterns(history?: Array<{
  message: string;
  speaker: string;
  timestamp: string;
  emotions?: Record<string, number>;
  intent?: string;
}>) {
  if (!history) return [];

  const patterns = [];

  // Extract emotional patterns
  const emotionalMessages = history.filter(msg => msg.emotions);
  if (emotionalMessages.length > 0) {
    patterns.push({
      type: 'emotional_pattern',
      description: 'User shows varying emotional states throughout conversation',
      relevance: 0.8,
    });
  }

  // Extract topic patterns
  const topics = history.map(msg => msg.intent).filter(Boolean);
  const uniqueTopics = [...new Set(topics)];
  if (uniqueTopics.length > 1) {
    patterns.push({
      type: 'topic_diversity',
      description: `Conversation covers multiple topics: ${uniqueTopics.join(', ')}`,
      relevance: 0.7,
    });
  }

  return patterns;
}

// Helper function to simulate wearables data for testing
export function generateMockWearablesData() {
  return {
    heartRate: {
      current: 72 + Math.random() * 20,
      resting: 60 + Math.random() * 10,
      max: 180 + Math.random() * 20,
      variability: 30 + Math.random() * 40,
      trend: Array.from({ length: 24 }, () => 60 + Math.random() * 30),
    },
    sleep: {
      duration: 6 + Math.random() * 3,
      quality: 60 + Math.random() * 40,
      deepSleep: 1 + Math.random() * 2,
      remSleep: 1 + Math.random() * 2,
      efficiency: 75 + Math.random() * 25,
      disturbances: Math.floor(Math.random() * 5),
    },
    activity: {
      steps: 5000 + Math.random() * 10000,
      calories: 1800 + Math.random() * 800,
      activeMinutes: 30 + Math.random() * 90,
      sedentaryMinutes: 300 + Math.random() * 200,
      exerciseType: ['walking', 'running', 'cycling', 'swimming'][Math.floor(Math.random() * 4)],
      intensity: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)],
    },
    stress: {
      level: Math.random() * 100,
      trend: Array.from({ length: 12 }, () => Math.random() * 100),
      recoveryTime: 10 + Math.random() * 50,
      stressEvents: Math.floor(Math.random() * 8),
    },
    environment: {
      temperature: 20 + Math.random() * 10,
      humidity: 40 + Math.random() * 40,
      airQuality: 50 + Math.random() * 50,
      noiseLevel: 40 + Math.random() * 40,
      lightExposure: 100 + Math.random() * 900,
    },
    biometrics: {
      bloodOxygen: 95 + Math.random() * 5,
      skinTemperature: 36 + Math.random() * 2,
      respiratoryRate: 12 + Math.random() * 8,
      bloodPressure: {
        systolic: 110 + Math.random() * 30,
        diastolic: 70 + Math.random() * 20,
      },
    },
    timestamp: new Date().toISOString(),
    deviceType: 'smartwatch' as const,
  };
} 
