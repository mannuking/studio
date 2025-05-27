"use client";

import React, { type FormEvent } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Send as SendIcon, 
  User, 
  Bot, 
  Mic, 
  MicOff, 
  Camera, 
  Heart,
  Brain,
  Activity,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { processComprehensiveMitrRequest, type ComprehensiveMitrInput, type ComprehensiveMitrOutput } from '@/ai/flows/comprehensive-mitr-ai';
import { captureImageFromVideo, extractAudioFeatures, generateMockWearablesData } from '@/utils/multimodal-helpers';
import { useToast } from '@/hooks/use-toast';

interface EnhancedMessage {
  id: string;
  speaker: 'user' | 'ai';
  text: string;
  timestamp: string;
  emotions?: Record<string, number>;
  intent?: string;
  analysis?: ComprehensiveMitrOutput;
}

interface AnalysisData {
  emotion: {
    primary: string;
    confidence: number;
    distressLevel: number;
  };
  health?: {
    wellnessScore: number;
    stressLevel: number;
    alerts: Array<{ type: string; severity: string; message: string; }>;
  };
  facial?: {
    emotions: Record<string, number>;
    engagement: number;
    attention: number;
    timestamp: string;
  };
  voice?: {
    volume: number;
    pitch: number;
    tone: string;
    speechRate: number;
    clarity: number;
    timestamp: string;
  };
  context: {
    intent: string;
    urgency: string;
    alliance: number;
  };
  safety: {
    riskLevel: string;
    concerns: string[];
  };
}

export function EnhancedChatInterface() {
  const [userInput, setUserInput] = useState('');
  const [conversationHistory, setConversationHistory] = useState<EnhancedMessage[]>([
    { 
      id: crypto.randomUUID(), 
      speaker: 'ai', 
      text: "Hello! I'm Mitr AI, your comprehensive therapeutic companion. I can analyze your emotions, voice, facial expressions, and even health data to provide personalized support. How are you feeling today?",
      timestamp: new Date().toISOString(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Analysis toggles
  const [enableEmotionAnalysis, setEnableEmotionAnalysis] = useState(true);
  const [enableHealthAnalysis, setEnableHealthAnalysis] = useState(true);
  const [enableVoiceAnalysis, setEnableVoiceAnalysis] = useState(true);
  const [enableFacialAnalysis, setEnableFacialAnalysis] = useState(true);
  
  // Client-side mounting state to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const facialAnalysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Effect to set mounted state for client-side rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- Speech Synthesis (Voice Output for AI messages) ---
  const [spokenMessageIds, setSpokenMessageIds] = useState(new Set<string>());

  useEffect(() => {
    const latestAiMessage = conversationHistory.filter(msg => msg.speaker === 'ai').pop();

    if (latestAiMessage && !spokenMessageIds.has(latestAiMessage.id)) {
      if ('speechSynthesis' in window && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(latestAiMessage.text);
        
        const speak = () => {
          window.speechSynthesis.cancel();
          const voices = window.speechSynthesis.getVoices();
          let selectedVoice: SpeechSynthesisVoice | null = null;

          const femaleVoices = voices.filter(voice =>
            voice.lang.startsWith('en-') &&
            (voice.name.toLowerCase().includes('female') ||
             voice.name.toLowerCase().includes('woman') ||
             voice.name.toLowerCase().includes('zira') ||
             voice.name.toLowerCase().includes('samantha') ||
             (voice.name.toLowerCase().includes('google') && voice.lang === 'en-US'))
          );

          if (femaleVoices.length > 0) {
            selectedVoice = femaleVoices.find(v => v.name.toLowerCase().includes('google')) || femaleVoices[0];
          } else {
            selectedVoice = voices.find(voice => voice.lang.startsWith('en-') && voice.default) ||
                            voices.find(voice => voice.lang.startsWith('en-')) ||
                            null;
          }
          
          utterance.voice = selectedVoice;
          
          utterance.onend = () => {
            setSpokenMessageIds(prev => new Set(prev).add(latestAiMessage.id));
          };
          utterance.onerror = (event) => {
            console.error("Speech synthesis error:", event);
            toast({ variant: "destructive", title: "Speech Error", description: "Could not play voice response."});
            setSpokenMessageIds(prev => new Set(prev).add(latestAiMessage.id));
          };
          window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length === 0) {
          window.speechSynthesis.onvoiceschanged = speak;
        } else {
          speak();
        }
      } else {
        setSpokenMessageIds(prev => new Set(prev).add(latestAiMessage.id));
      }
    }
    return () => {
      if ('speechSynthesis' in window && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [conversationHistory, spokenMessageIds, toast]);

  // --- Speech Recognition (Voice Input) ---
  const [isListening, setIsListening] = useState(false);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [microphonePermission, setMicrophonePermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const noSpeechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        setSpeechSupported(true);
        const recognitionInstance = new SpeechRecognitionAPI();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';

        let finalTranscript = '';
        let interimTranscript = '';
        let hasDetectedSpeech = false;

        recognitionInstance.addEventListener('start', () => {
          console.log('Speech recognition started');
          setIsListening(true);
          
          // Set a timeout to show helpful message if no speech is detected
          noSpeechTimeoutRef.current = setTimeout(() => {
            if (isListening) {
              toast({
                title: "Can't hear you",
                description: "Please speak clearly into your microphone. I'm listening...",
              });
              
              // Set another timeout to stop listening if still no speech
              speechTimeoutRef.current = setTimeout(() => {
                if (speechRecognitionRef.current && isListening) {
                  speechRecognitionRef.current.stop();
                  toast({
                    title: "Listening stopped",
                    description: "No speech detected. Click the microphone to try again.",
                  });
                }
              }, 5000); // Stop after 5 more seconds
            }
          }, 3000); // Show message after 3 seconds of no speech
        });

        recognitionInstance.onresult = (event) => {
          // Clear timeouts since we detected speech
          if (noSpeechTimeoutRef.current) {
            clearTimeout(noSpeechTimeoutRef.current);
            noSpeechTimeoutRef.current = null;
          }
          if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
            speechTimeoutRef.current = null;
          }

          hasDetectedSpeech = true;
          finalTranscript = '';
          interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setUserInput(prev => {
              const newInput = prev ? prev + ' ' + finalTranscript.trim() : finalTranscript.trim();
              return newInput;
            });
            
            // Show success feedback only for substantial input
            if (finalTranscript.trim().length > 2) {
              toast({
                title: "Speech detected",
                description: `Heard: "${finalTranscript.trim()}"`,
              });
            }
          } else if (interimTranscript) {
            // Show that we're detecting speech even if not final
            console.log('Interim speech detected:', interimTranscript);
          }
        };

        recognitionInstance.onerror = (event) => {
          // Clear timeouts on error
          if (noSpeechTimeoutRef.current) {
            clearTimeout(noSpeechTimeoutRef.current);
            noSpeechTimeoutRef.current = null;
          }
          if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
            speechTimeoutRef.current = null;
          }
          
          switch (event.error) {
            case 'no-speech':
              // Handle no-speech silently - this is now handled in onend
              console.log('No speech detected, ending session...');
              setIsListening(false);
              break;
            case 'audio-capture':
              console.error('Audio capture error:', event.error);
              toast({ 
                variant: "destructive", 
                title: "Microphone Error", 
                description: "Microphone is not available. Please check your microphone connection." 
              });
              setIsListening(false);
              break;
            case 'not-allowed':
              console.error('Permission denied:', event.error);
              toast({ 
                variant: "destructive", 
                title: "Permission Denied", 
                description: "Microphone permission was denied. Please enable it in your browser settings." 
              });
              setMicrophonePermission('denied');
              setIsListening(false);
              break;
            case 'network':
              console.error('Network error:', event.error);
              toast({ 
                variant: "destructive", 
                title: "Network Error", 
                description: "Network error occurred during speech recognition." 
              });
              setIsListening(false);
              break;
            case 'aborted':
              console.log('Speech recognition aborted');
              setIsListening(false);
              break;
            default:
              console.error('Speech recognition error:', event.error);
              toast({ 
                variant: "destructive", 
                title: "Speech Error", 
                description: `Speech recognition error: ${event.error}` 
              });
              setIsListening(false);
          }
        };

        recognitionInstance.onend = () => {
          console.log('Speech recognition ended');
          
          // Clear any remaining timeouts
          if (noSpeechTimeoutRef.current) {
            clearTimeout(noSpeechTimeoutRef.current);
            noSpeechTimeoutRef.current = null;
          }
          if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
            speechTimeoutRef.current = null;
          }
          
          // Check if we detected any speech during the session
          if (!hasDetectedSpeech && isListening) {
            toast({
              title: "No speech detected",
              description: "I didn't hear anything. Please try speaking again.",
            });
          }
          
          // Reset for next session
          hasDetectedSpeech = false;
          setIsListening(false);
        };

        speechRecognitionRef.current = recognitionInstance;
      } else {
        setSpeechSupported(false);
        console.log('Speech recognition not supported');
      }
    }

    // Check microphone permission
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then((result) => {
        setMicrophonePermission(result.state as 'granted' | 'denied' | 'prompt');
        result.onchange = () => {
          setMicrophonePermission(result.state as 'granted' | 'denied' | 'prompt');
        };
      });
    }

    // Cleanup function
    return () => {
      if (noSpeechTimeoutRef.current) {
        clearTimeout(noSpeechTimeoutRef.current);
        noSpeechTimeoutRef.current = null;
      }
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
      }
    };
  }, [toast]);

  const handleToggleListening = async () => {
    if (!speechRecognitionRef.current || !speechSupported) {
      toast({ 
        variant: "destructive", 
        title: "Not Supported", 
        description: "Speech recognition is not supported by your browser." 
      });
      return;
    }

    if (isListening) {
      try {
        speechRecognitionRef.current.stop();
        
        // Clear timeouts when manually stopping
        if (noSpeechTimeoutRef.current) {
          clearTimeout(noSpeechTimeoutRef.current);
          noSpeechTimeoutRef.current = null;
        }
        if (speechTimeoutRef.current) {
          clearTimeout(speechTimeoutRef.current);
          speechTimeoutRef.current = null;
        }
        
        setIsListening(false);
      } catch (e) {
        console.error("Error stopping speech recognition:", e);
        setIsListening(false);
      }
    } else {
      try {
        // Request microphone permission first
        if (microphonePermission === 'prompt') {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop()); // Stop the test stream
            setMicrophonePermission('granted');
          } catch (e) {
            setMicrophonePermission('denied');
            toast({ 
              variant: "destructive", 
              title: "Microphone Access", 
              description: "Please allow microphone access to use voice input." 
            });
            return;
          }
        }

        if (microphonePermission === 'denied') {
          toast({ 
            variant: "destructive", 
            title: "Permission Required", 
            description: "Microphone permission is required. Please enable it in your browser settings." 
          });
          return;
        }

        speechRecognitionRef.current.start();
        toast({
          title: "Listening",
          description: "Speak now... I'm listening to your voice.",
        });
      } catch (e) {
        console.error("Error starting speech recognition:", e);
        toast({ 
          variant: "destructive", 
          title: "Microphone Error", 
          description: "Could not start voice input. Please check your microphone." 
        });
        setIsListening(false);
      }
    }
  };

  // Camera and facial analysis states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [lastFacialAnalysis, setLastFacialAnalysis] = useState<any>(null);
  const [lastVoiceAnalysis, setLastVoiceAnalysis] = useState<any>(null);

  // Initialize camera when facial analysis is enabled
  const initializeCamera = useCallback(async () => {
    // This check is crucial if the effect calling it might not have the latest isCameraActive
    // However, the toggle effect *should* correctly gate this via !isCameraActive.
    // To be absolutely safe against rapid calls if the state isn't settled for the effect:
    if (videoRef.current && videoRef.current.srcObject) {
        console.log('initializeCamera called, but video already has srcObject. Skipping.');
        // We might still want to ensure isCameraActive is true and toast was shown.
        // For now, assume if srcObject is set, it was initialized.
        return;
    }
    console.log('initializeCamera running full logic...');

    try {
      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('videoRef.current.srcObject has been set.');
        
        // Attempt to play the video explicitly
        try {
          await videoRef.current.play();
          console.log('Video explicitly played successfully via videoRef.current.play().');
        } catch (e) {
          console.error('Explicit play() call failed. This might be due to autoplay policies or other issues:', e);
          // As a fallback, some browsers might need a user interaction or specific event
          // We can also try playing on 'canplay' or 'loadedmetadata' if direct play fails
          videoRef.current.oncanplay = () => {
            console.log('Video oncanplay event triggered. Attempting to play again...');
            videoRef.current?.play().catch(playError => console.error('Play attempt from oncanplay failed:', playError));
          };
        }
      }

      setCameraStream(stream);
      setIsCameraActive(true);

      toast({
        title: "Camera Activated",
        description: "Facial analysis is now active. Your expressions will be analyzed every 7 seconds.",
      });

      console.log('Camera initialized successfully, isCameraActive set to true.');
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        variant: "destructive",
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
      });
      setIsCameraActive(false); // Ensure camera is marked inactive on error
    }
  }, [toast, setCameraStream, setIsCameraActive]); // Stable dependencies

  // Stop camera and cleanup
  const stopCamera = useCallback(() => {
    console.log('stopCamera called...');
    if (videoRef.current && videoRef.current.srcObject) {
      const currentStream = videoRef.current.srcObject as MediaStream;
      currentStream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      console.log('Video stream tracks stopped and srcObject nulled from videoRef.');
    }

    // Stop tracks from cameraStream state as a fallback, then clear it.
    setCameraStream(prevStream => {
      if (prevStream) {
        prevStream.getTracks().forEach(track => track.stop());
        console.log('Tracks from previous cameraStream state stopped.');
      }
      return null;
    });

    setIsCameraActive(false);
    setLastFacialAnalysis(null); // Reset facial analysis data
    console.log('Camera stopped and states reset (isCameraActive: false, cameraStream: null).');
  }, [setCameraStream, setIsCameraActive, setLastFacialAnalysis]); // Stable dependencies

  // Capture and analyze facial expression
  const captureFacialAnalysis = useCallback(async () => {
    if (!videoRef.current || !isCameraActive || !enableFacialAnalysis) {
      console.log('Facial analysis conditions not met, skipping...');
      return;
    }

    try {
      // Check if video is ready and playing
      if (videoRef.current.readyState < 3) {
        console.log('Video not ready for capture, skipping...');
        return;
      }

      console.log('Capturing facial analysis at:', new Date().toISOString());
      
      const imageData = captureImageFromVideo(videoRef.current);
      if (imageData) {
        // Here you would typically send to your facial analysis API (Gemini)
        // For now, we'll simulate the analysis
        const mockFacialAnalysis = {
          emotions: {
            happy: Math.random() * 0.3,
            sad: Math.random() * 0.4,
            angry: Math.random() * 0.2,
            surprised: Math.random() * 0.3,
            neutral: Math.random() * 0.6,
            confused: Math.random() * 0.4,
          },
          engagement: Math.random() * 100,
          attention: Math.random() * 100,
          timestamp: new Date().toISOString(),
        };

        setLastFacialAnalysis(mockFacialAnalysis);
        
        // Update current analysis with facial data
        setCurrentAnalysis(prev => prev ? {
          ...prev,
          facial: mockFacialAnalysis
        } : null);

        console.log('Facial analysis completed:', mockFacialAnalysis);
      } else {
        console.log('Failed to capture image from video');
      }
    } catch (error) {
      console.error('Error capturing facial analysis:', error);
    }
  }, [isCameraActive, enableFacialAnalysis]);

  // Effect to handle facial analysis toggle
  useEffect(() => {
    // Only run camera logic if component is mounted on client
    if (!isMounted) return;
    
    console.log(`Facial analysis toggle effect: enableFacialAnalysis=${enableFacialAnalysis}, isCameraActive=${isCameraActive}`);
    if (enableFacialAnalysis && !isCameraActive) {
      console.log('Condition met: Enabling facial analysis - initializing camera...');
      initializeCamera();
    } else if (!enableFacialAnalysis && isCameraActive) {
      console.log('Condition met: Disabling facial analysis - stopping camera...');
      stopCamera();
    }
  }, [enableFacialAnalysis, isCameraActive, isMounted, initializeCamera, stopCamera]);

  // Effect to start/stop facial analysis interval
  useEffect(() => {
    // Only run if component is mounted on client
    if (!isMounted) return;
    
    // Reduced logging to improve performance
    if (enableFacialAnalysis && isCameraActive) {
      if (!facialAnalysisIntervalRef.current) {
        // Increased interval to 15 seconds to reduce processing overhead
        facialAnalysisIntervalRef.current = setInterval(() => {
          captureFacialAnalysis();
        }, 15000);

        // Capture on demand only when needed, not immediately 
        // This reduces unnecessary processing during initialization
      }
    } else {
      if (facialAnalysisIntervalRef.current) {
        clearInterval(facialAnalysisIntervalRef.current);
        facialAnalysisIntervalRef.current = null;
      }
    }

    return () => {
      if (facialAnalysisIntervalRef.current) {
        clearInterval(facialAnalysisIntervalRef.current);
        facialAnalysisIntervalRef.current = null;
      }
    };
  }, [enableFacialAnalysis, isCameraActive, isMounted, captureFacialAnalysis]); // Dependencies are crucial here

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Capture multimodal data
  const captureMultimodalData = useCallback(async (): Promise<Partial<ComprehensiveMitrInput>> => {
    const data: Partial<ComprehensiveMitrInput> = {};

    // Capture image from video if facial analysis is enabled
    if (enableFacialAnalysis && videoRef.current && isCameraActive) {
      try {
        const imageData = captureImageFromVideo(videoRef.current);
        if (imageData) {
          data.imageData = imageData;
        }
      } catch (error) {
        console.error('Failed to capture facial image:', error);
      }
    }

    // Generate mock audio features if voice analysis is enabled
    if (enableVoiceAnalysis) {
      try {
        // Only generate voice analysis when actually needed (not on every call)
        if (isListening || Math.random() < 0.1) { // 10% chance when not listening
          const mockAudioFeatures = {
            volume: isListening ? Math.random() * 0.8 + 0.2 : 0,
            pitch: isListening ? Math.random() * 200 + 100 : 0,
            tone: isListening ? ['confident', 'calm', 'excited', 'nervous'][Math.floor(Math.random() * 4)] : 'silent',
            speechRate: isListening ? Math.random() * 0.5 + 0.5 : 0,
            clarity: isListening ? Math.random() * 0.4 + 0.6 : 0,
            timestamp: new Date().toISOString(),
          };
          data.audioFeatures = extractAudioFeatures(new ArrayBuffer(0));
          setLastVoiceAnalysis(mockAudioFeatures);
        }
      } catch (error) {
        console.error('Failed to extract audio features:', error);
      }
    }

    // Generate mock wearables data if health analysis is enabled
    if (enableHealthAnalysis) {
      try {
        const mockWearablesData = generateMockWearablesData();
        data.wearablesData = {
          heartRate: mockWearablesData.heartRate,
          sleep: mockWearablesData.sleep,
          activity: mockWearablesData.activity,
          stress: mockWearablesData.stress,
          timestamp: mockWearablesData.timestamp,
        };
      } catch (error) {
        console.error('Failed to generate wearables data:', error);
      }
    }

    return data;
  }, [enableFacialAnalysis, enableVoiceAnalysis, enableHealthAnalysis, isListening, isCameraActive]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [conversationHistory, isLoading]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const newUserMessage: EnhancedMessage = { 
      id: crypto.randomUUID(), 
      speaker: 'user', 
      text: userInput.trim(),
      timestamp: new Date().toISOString(),
    };
    
    setConversationHistory(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);
    setIsAnalyzing(true);
    setError(null);

    try {
      // Capture multimodal data
      const multimodalData = await captureMultimodalData();

      // Prepare comprehensive input
      const comprehensiveInput: ComprehensiveMitrInput = {
        userMessage: newUserMessage.text,
        conversationHistory: conversationHistory.map(msg => ({
          speaker: msg.speaker,
          message: msg.text,
          timestamp: msg.timestamp,
          emotions: msg.emotions,
          intent: msg.intent,
        })),
        ...multimodalData,
        userProfile: {
          therapeuticGoals: ['emotional_support', 'stress_management'],
          copingStrategies: ['mindfulness', 'breathing_exercises'],
        },
        sessionContext: {
          sessionId: 'session_' + Date.now(),
          sessionPhase: 'exploration',
          duration: conversationHistory.length * 2, // Rough estimate
        },
      };

      // Process with comprehensive MITR AI
      const aiOutput = await processComprehensiveMitrRequest(comprehensiveInput);

      // Update analysis state
      setCurrentAnalysis({
        emotion: {
          primary: aiOutput.emotionAnalysis.primary,
          confidence: aiOutput.emotionAnalysis.confidence,
          distressLevel: aiOutput.emotionAnalysis.distressLevel,
        },
        health: aiOutput.healthAnalysis ? {
          wellnessScore: aiOutput.healthAnalysis.wellnessScore,
          stressLevel: aiOutput.healthAnalysis.stressLevel,
          alerts: aiOutput.healthAnalysis.alerts,
        } : undefined,
        facial: lastFacialAnalysis ? {
          emotions: lastFacialAnalysis.emotions,
          engagement: lastFacialAnalysis.engagement,
          attention: lastFacialAnalysis.attention,
          timestamp: lastFacialAnalysis.timestamp,
        } : undefined,
        voice: lastVoiceAnalysis ? {
          volume: lastVoiceAnalysis.volume,
          pitch: lastVoiceAnalysis.pitch,
          tone: lastVoiceAnalysis.tone,
          speechRate: lastVoiceAnalysis.speechRate,
          clarity: lastVoiceAnalysis.clarity,
          timestamp: lastVoiceAnalysis.timestamp,
        } : undefined,
        context: {
          intent: aiOutput.contextualInsights.therapeuticIntent,
          urgency: aiOutput.contextualInsights.urgencyLevel,
          alliance: aiOutput.contextualInsights.therapeuticAlliance,
        },
        safety: {
          riskLevel: aiOutput.safetyAssessment.riskLevel,
          concerns: aiOutput.safetyAssessment.concerns,
        },
      });

      // Create AI response message
      const aiMessage: EnhancedMessage = { 
        id: crypto.randomUUID(), 
        speaker: 'ai', 
        text: aiOutput.response,
        timestamp: new Date().toISOString(),
        emotions: aiOutput.emotionAnalysis ? { [aiOutput.emotionAnalysis.primary]: aiOutput.emotionAnalysis.confidence } : undefined,
        intent: aiOutput.contextualInsights.therapeuticIntent,
        analysis: aiOutput,
      };

      setConversationHistory(prev => [...prev, aiMessage]);

      // Show alerts if any
      if (aiOutput.safetyAssessment.riskLevel !== 'low') {
        toast({
          variant: aiOutput.safetyAssessment.riskLevel === 'critical' ? 'destructive' : 'default',
          title: `${aiOutput.safetyAssessment.riskLevel.toUpperCase()} Risk Detected`,
          description: aiOutput.safetyAssessment.concerns.join(', '),
        });
      }

    } catch (err) {
      console.error("Error calling comprehensive MITR AI:", err);
      const errorMessageText = "Sorry, I couldn't process your message right now. Please try again later.";
      setError(errorMessageText);
      const errorMessage: EnhancedMessage = { 
        id: crypto.randomUUID(), 
        speaker: 'ai', 
        text: errorMessageText,
        timestamp: new Date().toISOString(),
      };
      setConversationHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsAnalyzing(false);
    }
  };

  const handleSubmitForm = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto">
      {/* Main Chat Interface */}
      <Card className="flex-1 min-w-0 shadow-xl bg-card flex flex-col h-[500px] lg:h-[600px]">
        <CardHeader className="flex-shrink-0 p-4">
          <CardTitle className="text-xl text-center text-primary-foreground bg-primary py-3 rounded-lg">
            Enhanced Mitr AI Conversation
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden p-4 relative">
          <ScrollArea className="h-full w-full pr-2">
            <div className="space-y-4">
              {conversationHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2.5 animate-fadeIn ${
                    msg.speaker === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.speaker === 'ai' && <Bot className="w-6 h-6 text-primary flex-shrink-0 mb-1" aria-label="AI icon" />}
                  <div
                    className={`p-3 rounded-xl max-w-[85%] lg:max-w-[80%] shadow ${
                      msg.speaker === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-accent text-accent-foreground rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                    {msg.emotions && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(msg.emotions).map(([emotion, confidence]) => (
                          <Badge key={emotion} variant="secondary" className="text-xs">
                            {emotion}: {Math.round(confidence * 100)}%
                          </Badge>
                        ))}
                      </div>
                    )}
                    {msg.intent && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {msg.intent}
                      </Badge>
                    )}
                  </div>
                  {msg.speaker === 'user' && <User className="w-6 h-6 text-muted-foreground flex-shrink-0 mb-1" aria-label="User icon" />}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-end gap-2.5 justify-start animate-fadeIn">
                  <Bot className="w-6 h-6 text-primary flex-shrink-0 mb-1" />
                  <div className="p-3 rounded-xl bg-accent text-accent-foreground max-w-[85%] lg:max-w-[80%] shadow rounded-bl-none">
                    <p className="text-sm italic">
                      {isAnalyzing ? 'Analyzing your emotions, voice, and health data...' : 'Mitr AI is thinking...'}
                    </p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {/* Camera Feed - Only visible when facial analysis is enabled */}
          {enableFacialAnalysis && isMounted && (
            <div className="absolute bottom-4 right-4 w-24 h-24 overflow-hidden border-2 border-primary shadow-lg bg-black" style={{ zIndex: 9999 }}>
              <video
                ref={videoRef}
                className="w-full h-full"
                autoPlay
                muted
                playsInline
                style={{ border: '2px solid limegreen' }}
              />
              {isCameraActive && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ zIndex: 10000 }}></div>
              )}
              {!isCameraActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75" style={{ zIndex: 10000 }}>
                  <Camera className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
          )}
          
          {/* Camera placeholder for SSR */}
          {enableFacialAnalysis && !isMounted && (
            <div className="absolute bottom-4 right-4 w-24 h-24 overflow-hidden border-2 border-primary shadow-lg" style={{ zIndex: 9999 }}>
              <Skeleton className="w-full h-full" />
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 border-t flex-shrink-0">
          <form onSubmit={handleSubmitForm} className="flex w-full items-center gap-2">
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={isListening ? "🎤 Listening... Speak now!" : "Type your message or click the mic to speak..."}
              className="flex-grow resize-none rounded-full py-2 px-4 min-h-[44px] max-h-[100px]"
              rows={1}
              onKeyDown={handleKeyDown}
              disabled={isLoading || isListening}
              aria-label="Your message"
            />
            <Button 
              type="button" 
              size="icon" 
              variant="ghost" 
              onClick={handleToggleListening} 
              disabled={isLoading || !speechSupported} 
              className={`rounded-full w-11 h-11 flex-shrink-0 hover:bg-accent ${
                isListening ? 'bg-red-100 hover:bg-red-200' : 
                microphonePermission === 'denied' ? 'opacity-50' : ''
              }`}
              aria-label={isListening ? "Stop listening" : "Start listening with microphone"}
            >
              {isListening ? (
                <div className="relative">
                  <MicOff className="w-5 h-5 text-destructive" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              ) : (
                <Mic className={`w-5 h-5 ${
                  microphonePermission === 'denied' ? 'text-muted-foreground' : 
                  speechSupported ? 'text-primary' : 'text-muted-foreground'
                }`} />
              )}
            </Button>
            <Button 
              type="submit" 
              size="icon" 
              className="rounded-full w-11 h-11 bg-primary hover:bg-primary/90 flex-shrink-0" 
              disabled={isLoading || !userInput.trim() || isListening} 
              aria-label="Send message"
            >
              <SendIcon className="w-5 h-5" />
            </Button>
          </form>
        </CardFooter>
        {error && <p className="text-xs text-destructive text-center px-4 pb-2 flex-shrink-0">{error}</p>}
      </Card>

      {/* Analysis Panel */}
      <Card className="w-full lg:w-80 lg:min-w-[320px] shadow-xl bg-card flex flex-col h-[400px] lg:h-[600px]">
        <CardHeader className="flex-shrink-0 p-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Live Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden p-3">
          <ScrollArea className="h-full">
            <div className="space-y-3 pr-2">
              {/* Analysis Toggles */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Analysis Features</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={enableEmotionAnalysis ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEnableEmotionAnalysis(!enableEmotionAnalysis)}
                    className="text-xs h-7"
                  >
                    <Brain className="w-3 h-3 mr-1" />
                    Emotion
                  </Button>
                  <Button
                    variant={enableHealthAnalysis ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEnableHealthAnalysis(!enableHealthAnalysis)}
                    className="text-xs h-7"
                  >
                    <Heart className="w-3 h-3 mr-1" />
                    Health
                  </Button>
                  <Button
                    variant={enableVoiceAnalysis ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEnableVoiceAnalysis(!enableVoiceAnalysis)}
                    className="text-xs h-7"
                  >
                    <Mic className="w-3 h-3 mr-1" />
                    Voice
                  </Button>
                  <Button
                    variant={enableFacialAnalysis ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEnableFacialAnalysis(!enableFacialAnalysis)}
                    className="text-xs h-7"
                  >
                    <Camera className="w-3 h-3 mr-1" />
                    Facial
                  </Button>
                </div>
              </div>

              {/* Current Analysis Results */}
              {currentAnalysis && (
                <>
                  {/* Emotion Analysis */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Emotional State
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Primary Emotion:</span>
                        <Badge variant="secondary" className="text-xs">{currentAnalysis.emotion.primary}</Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Confidence</span>
                          <span>{Math.round(currentAnalysis.emotion.confidence * 100)}%</span>
                        </div>
                        <Progress value={currentAnalysis.emotion.confidence * 100} className="h-1.5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Distress Level</span>
                          <span>{Math.round(currentAnalysis.emotion.distressLevel * 100)}%</span>
                        </div>
                        <Progress value={currentAnalysis.emotion.distressLevel * 100} className="h-1.5" />
                      </div>
                    </div>
                  </div>

                  {/* Health Analysis */}
                  {currentAnalysis.health && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        Health Metrics
                      </h4>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Wellness Score</span>
                            <span>{Math.round(currentAnalysis.health.wellnessScore)}/100</span>
                          </div>
                          <Progress value={currentAnalysis.health.wellnessScore} className="h-1.5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Stress Level</span>
                            <span>{Math.round(currentAnalysis.health.stressLevel)}/100</span>
                          </div>
                          <Progress value={currentAnalysis.health.stressLevel} className="h-1.5" />
                        </div>
                        {currentAnalysis.health.alerts.length > 0 && (
                          <div className="space-y-1">
                            {currentAnalysis.health.alerts.map((alert, index) => (
                              <Alert key={index} className="p-2">
                                <AlertTriangle className="w-3 h-3" />
                                <AlertDescription className="text-xs">
                                  {alert.message}
                                </AlertDescription>
                              </Alert>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Facial Analysis */}
                  {currentAnalysis.facial && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        Facial Analysis
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs">Emotions:</span>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(currentAnalysis.facial.emotions).map(([emotion, confidence]) => (
                              <Badge key={emotion} variant="secondary" className="text-xs">
                                {emotion}: {Math.round(confidence * 100)}%
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Engagement</span>
                            <span>{Math.round(currentAnalysis.facial.engagement)}%</span>
                          </div>
                          <Progress value={currentAnalysis.facial.engagement} className="h-1.5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Attention</span>
                            <span>{Math.round(currentAnalysis.facial.attention)}%</span>
                          </div>
                          <Progress value={currentAnalysis.facial.attention} className="h-1.5" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Voice Analysis */}
                  {currentAnalysis.voice && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Mic className="w-4 h-4" />
                        Voice Metrics
                      </h4>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Volume</span>
                            <span>{Math.round(currentAnalysis.voice.volume * 100)}%</span>
                          </div>
                          <Progress value={currentAnalysis.voice.volume * 100} className="h-1.5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Pitch</span>
                            <span>{Math.round(currentAnalysis.voice.pitch)} Hz</span>
                          </div>
                          <Progress value={currentAnalysis.voice.pitch} className="h-1.5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Tone</span>
                            <span>{currentAnalysis.voice.tone}</span>
                          </div>
                          <Progress value={currentAnalysis.voice.tone === 'confident' ? 100 : 0} className="h-1.5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Speech Rate</span>
                            <span>{Math.round(currentAnalysis.voice.speechRate * 100)}%</span>
                          </div>
                          <Progress value={currentAnalysis.voice.speechRate * 100} className="h-1.5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Clarity</span>
                            <span>{Math.round(currentAnalysis.voice.clarity * 100)}%</span>
                          </div>
                          <Progress value={currentAnalysis.voice.clarity * 100} className="h-1.5" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Context Analysis */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Context
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Intent:</span>
                        <Badge variant="outline" className="text-xs">{currentAnalysis.context.intent}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Urgency:</span>
                        <Badge variant="outline" className="text-xs">{currentAnalysis.context.urgency}</Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Therapeutic Alliance</span>
                          <span>{currentAnalysis.context.alliance}%</span>
                        </div>
                        <Progress value={currentAnalysis.context.alliance} className="h-1.5" />
                      </div>
                    </div>
                  </div>

                  {/* Safety Assessment */}
                  <div className="space-y-2 pb-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      {currentAnalysis.safety.riskLevel === 'low' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                      )}
                      Safety
                    </h4>
                    <div className="space-y-2">
                      <Badge className={getRiskLevelColor(currentAnalysis.safety.riskLevel)}>
                        {currentAnalysis.safety.riskLevel.toUpperCase()} RISK
                      </Badge>
                      {currentAnalysis.safety.concerns.length > 0 && (
                        <div className="space-y-1">
                          {currentAnalysis.safety.concerns.map((concern, index) => (
                            <Alert key={index} className="p-2">
                              <Info className="w-3 h-3" />
                              <AlertDescription className="text-xs break-words">
                                {concern}
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
} 
