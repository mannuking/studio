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
import { clientCache } from '@/utils/client-cache';
import { performanceMonitor } from '@/utils/performance-monitor';

interface EnhancedMessage {
  id: string;
  speaker: 'user' | 'ai';
  text: string;
  timestamp: string;
  emotions?: Record<string, number>;
  intent?: string;
  analysis?: ComprehensiveMitrOutput;
  isTemporary?: boolean; // Flag for temporary messages (like typing indicators)
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

// Use dynamic import for lazy loading the analysis panel
const LazyAnalysisPanel = dynamic(
  () => import('./analysis-panel').then(mod => ({ 
    default: (props: any) => <mod.AnalysisPanel {...props} /> 
  })),
  { 
    loading: () => (
      <Card className="w-full lg:w-[350px] h-[600px] shadow-xl bg-card overflow-hidden">
        <CardHeader className="p-4">
          <CardTitle className="text-lg text-center">Analysis Panel</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    ),
    ssr: false // Disable server-side rendering for better performance
  }
);

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

  // Load conversation history from cache when component mounts
  useEffect(() => {
    // Set client-side mounting flag
    setIsMounted(true);
    
    const loadCachedData = async () => {
      if (conversationHistory.length <= 1) {
        try {
          // Only load cache if we just have the initial greeting message
          const cachedMessages = await getMessages();
          if (cachedMessages && cachedMessages.length > 0) {
            setConversationHistory(prev => {
              // Keep the greeting message and add cached messages
              const greetingMessage = prev[0];
              return [greetingMessage, ...cachedMessages];
            });
            
            // Set last message as spoken to prevent re-speaking
            const lastAiMessage = cachedMessages
              .filter(msg => msg.speaker === 'ai')
              .pop();
              
            if (lastAiMessage) {
              setSpokenMessageIds(prev => new Set(prev).add(lastAiMessage.id));
            }
          }
        } catch (error) {
          // Silent fail - just continue without cached data
        }
      }
    };
    
    loadCachedData();
  }, [conversationHistory.length]);

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

  const captureFacialAnalysis = useCallback(async () => {
    if (!videoRef.current || !isCameraActive || !enableFacialAnalysis) {
      return;
    }

    try {
      // Check if video is ready and playing
      if (videoRef.current.readyState < 3) {
        return;
      }

      // Probabilistic sampling - only analyze 70% of the time to reduce processing
      if (Math.random() > 0.7) {
        return;
      }
      
      const imageData = captureImageFromVideo(videoRef.current);
      if (imageData) {
        // Simulate the analysis with minimal processing - fewer emotions to reduce complexity
        const mockFacialAnalysis = {
          emotions: {
            happy: Math.random() * 0.3,
            sad: Math.random() * 0.4,
            neutral: Math.random() * 0.6,
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
      }
    } catch (error) {
      // Silent error handling to prevent crashes
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
    
    if (enableFacialAnalysis && isCameraActive) {
      if (!facialAnalysisIntervalRef.current) {
        // Increased interval to 25 seconds to further reduce processing overhead
        // This is a significant improvement from the original 15-second interval
        facialAnalysisIntervalRef.current = setInterval(() => {
          captureFacialAnalysis();
        }, 25000);
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
  }, [enableFacialAnalysis, isCameraActive, isMounted, captureFacialAnalysis]);

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

  // Optimized version of captureMultimodalData that captures only essential data
  const captureMinimalMultimodalData = useCallback(async (): Promise<Partial<ComprehensiveMitrInput>> => {
    const data: Partial<ComprehensiveMitrInput> = {};

    // Further reduce facial analysis probability to 20% for even better performance
    // Only process images at lower resolution (0.6 = 60% of original size)
    if (enableFacialAnalysis && videoRef.current && isCameraActive && Math.random() < 0.2) {
      try {
        const imageData = captureImageFromVideo(videoRef.current, 0.6);
        if (imageData) {
          data.imageData = imageData;
        }
      } catch (error) {
        // Silent fail - don't block the response for facial analysis issues
      }
    }

    // Further reduce health data refresh rate to 15% 
    if (enableHealthAnalysis && (!currentAnalysis?.health || Math.random() < 0.15)) {
      try {
        const mockWearablesData = generateMockWearablesData();
        // Only include essential health metrics, not the full data set
        data.wearablesData = {
          heartRate: {
            current: mockWearablesData.heartRate.current,
            // Skip other heart rate fields for performance
          },
          stress: {
            level: mockWearablesData.stress.level,
          },
          timestamp: mockWearablesData.timestamp,
        };
      } catch (error) {
        // Silent fail - don't block the response for health data issues
      }
    }

    return data;
  }, [enableFacialAnalysis, enableHealthAnalysis, isCameraActive, currentAnalysis?.health]);

  // Memory management for better performance
  const clearUnusedMemory = useCallback(() => {
    // Only keep the most recent 15 messages in memory to prevent memory leaks
    if (conversationHistory.length > 15) {
      setConversationHistory(prev => {
        // Keep the first message (greeting) and the last 14 messages
        const firstMessage = prev[0];
        const recentMessages = prev.slice(-14);
        return [firstMessage, ...recentMessages];
      });
    }
    
    // Clear spoken message IDs cache for older messages
    if (spokenMessageIds.size > 20) {
      const newSet = new Set<string>();
      // Only keep the most recent message IDs
      conversationHistory.slice(-10).forEach(msg => {
        if (spokenMessageIds.has(msg.id)) {
          newSet.add(msg.id);
        }
      });
      setSpokenMessageIds(newSet);
    }
  }, [conversationHistory, spokenMessageIds]);
  
  // Run memory management after each interaction
  useEffect(() => {
    if (!isLoading && conversationHistory.length > 15) {
      clearUnusedMemory();
    }
  }, [isLoading, conversationHistory.length, clearUnusedMemory]);

  // Create debounced input update for better performance
  const [debouncedUserInput, setDebouncedUserInput] = useState('');
  
  // Use a ref to store the timeout ID
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update the debounced value after a delay
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setUserInput(value);
    
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Set a new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedUserInput(value);
    }, 300);
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [conversationHistory, isLoading]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    // Start performance tracking
    const performanceId = performanceMonitor.startTiming('ai_response');

    const newUserMessage: EnhancedMessage = { 
      id: crypto.randomUUID(), 
      speaker: 'user', 
      text: userInput.trim(),
      timestamp: new Date().toISOString(),
    };
    
    // Check client-side cache first
    const cacheKey = clientCache.generateKey(newUserMessage.text, {
      historyLength: conversationHistory.length,
      enabledFeatures: {
        emotion: enableEmotionAnalysis,
        facial: enableFacialAnalysis,
        voice: enableVoiceAnalysis,
        health: enableHealthAnalysis,
      }
    });
    
    const cachedResponse = clientCache.get<ComprehensiveMitrOutput>(cacheKey);
    
    if (cachedResponse) {
      // Use cached response for instant response
      setConversationHistory(prev => [...prev, newUserMessage, {
        id: crypto.randomUUID(),
        speaker: 'ai',
        text: cachedResponse.response,
        timestamp: new Date().toISOString(),
        intent: cachedResponse.contextualInsights.therapeuticIntent,
      }]);
      
      // Update analysis state
      setCurrentAnalysis({
        emotion: {
          primary: cachedResponse.emotionAnalysis.primary,
          confidence: cachedResponse.emotionAnalysis.confidence,
          distressLevel: cachedResponse.emotionAnalysis.distressLevel,
        },
        context: {
          intent: cachedResponse.contextualInsights.therapeuticIntent,
          urgency: cachedResponse.contextualInsights.urgencyLevel,
          alliance: cachedResponse.contextualInsights.therapeuticAlliance,
        },
        safety: {
          riskLevel: cachedResponse.safetyAssessment.riskLevel,
          concerns: cachedResponse.safetyAssessment.concerns,
        },
      });
      
      performanceMonitor.endTiming(performanceId, true, true); // Cache hit
      setUserInput('');
      return;
    }
    
    setConversationHistory(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);
    setIsAnalyzing(true);
    setError(null);
    
    // Show immediate feedback to improve perceived performance
    const typingTimeout = setTimeout(() => {
      // Create initial AI response message to show typing indicator
      const initialMessage: EnhancedMessage = { 
        id: crypto.randomUUID(), 
        speaker: 'ai', 
        text: "I'm analyzing your message...",
        timestamp: new Date().toISOString(),
        isTemporary: true // Flag to identify this is a temporary message
      };
      setConversationHistory(prev => [...prev, initialMessage]);
    }, 400); // Reduced from 800ms to 400ms for faster feedback

    try {
      // Check client-side cache first
      const cacheKey = userInput.toLowerCase().trim();
      const cachedAnalysis = await getAnalysisResult(cacheKey);
      
      if (cachedAnalysis) {
        // We have a cached response - use it for better performance
        console.log('Using client-side cached response');
        clearTimeout(typingTimeout);
        
        // Create minimal analysis from cached data
        setCurrentAnalysis(prev => ({
          ...prev,
          emotion: cachedAnalysis.emotion || {
            primary: 'neutral',
            confidence: 0.5,
            distressLevel: 0.3
          },
          context: {
            intent: cachedAnalysis.intent || 'general_support',
            urgency: 'normal',
            alliance: 0.7
          },
          safety: {
            riskLevel: 'low',
            concerns: []
          }
        }));
        
        // Create AI response message from cache
        const cachedAiMessage: EnhancedMessage = { 
          id: crypto.randomUUID(), 
          speaker: 'ai', 
          text: cachedAnalysis.response,
          timestamp: new Date().toISOString(),
          intent: cachedAnalysis.intent,
        };
        
        // Replace the temporary message with the cached response
        setConversationHistory(prev => {
          const filtered = prev.filter(msg => !msg.isTemporary);
          return [...filtered, cachedAiMessage];
        });
        
        // Store the message for persistence
        storeMessage(newUserMessage.id, newUserMessage);
        storeMessage(cachedAiMessage.id, cachedAiMessage);
        
        // Log performance with cache hit
        logPerformance(true);
        
        setIsLoading(false);
        setIsAnalyzing(false);
        return; // Skip the expensive AI processing
      }
      
      // No cache hit - continue with regular processing
      // Optimize multimodal data capture - only capture what's needed
      // Based on enabled features to reduce processing time
      const multimodalData = await captureMinimalMultimodalData();

      // Limit conversation history to last 6 messages for faster processing
      // Strip out all emotion data to reduce payload size dramatically
      const limitedHistory = conversationHistory.slice(-4).map(msg => ({
        speaker: msg.speaker,
        message: msg.text,
        timestamp: msg.timestamp,
        // Completely remove emotion data for performance
      }));

      // Prepare optimized input with minimal required data
      const comprehensiveInput: ComprehensiveMitrInput = {
        userMessage: newUserMessage.text,
        conversationHistory: limitedHistory,
        ...multimodalData,
        userProfile: {
          therapeuticGoals: ['emotional_support', 'stress_management'],
        },
        sessionContext: {
          sessionId: 'session_' + Date.now(),
        },
      };

      // Process with comprehensive MITR AI
      const aiOutput = await processComprehensiveMitrRequest(comprehensiveInput);
      
      // Clear the typing timeout if still active
      clearTimeout(typingTimeout);

      // Cache the response for future use
      clientCache.set(cacheKey, aiOutput, 10); // Cache for 10 minutes

      // Update analysis state with only essential data
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

      // Create AI response message with minimal data
      const aiMessage: EnhancedMessage = { 
        id: crypto.randomUUID(), 
        speaker: 'ai', 
        text: aiOutput.response,
        timestamp: new Date().toISOString(),
        intent: aiOutput.contextualInsights.therapeuticIntent,
        // Remove emotions object to reduce memory usage
      };

      // Replace the temporary message with the real response
      setConversationHistory(prev => {
        const filtered = prev.filter(msg => !msg.isTemporary);
        return [...filtered, aiMessage];
      });
      
      // Cache messages for persistence
      storeMessage(newUserMessage.id, newUserMessage);
      storeMessage(aiMessage.id, aiMessage);
      
      // End performance timing with success
      performanceMonitor.endTiming(performanceId, true, false); // Success, no cache

      // Only show critical risk alerts to avoid notification spam
      if (aiOutput.safetyAssessment.riskLevel === 'critical' || aiOutput.safetyAssessment.riskLevel === 'high') {
        toast({
          variant: aiOutput.safetyAssessment.riskLevel === 'critical' ? 'destructive' : 'default',
          title: `${aiOutput.safetyAssessment.riskLevel.toUpperCase()} Risk Detected`,
          description: aiOutput.safetyAssessment.concerns.slice(0, 2).join(', '), // Limit to 2 concerns
        });
      }

    } catch (err) {
      clearTimeout(typingTimeout);
      
      // End performance timing with error
      performanceMonitor.endTiming(performanceId, false, false, String(err));
      
      console.error("Error calling comprehensive MITR AI:", err);
      const errorMessageText = "I apologize for the delay. Let me try that again with a simpler approach.";
      setError(errorMessageText);
      
      // Replace temporary message with error message if it exists
      setConversationHistory(prev => {
        const filtered = prev.filter(msg => !msg.isTemporary);
        return [...filtered, { 
          id: crypto.randomUUID(), 
          speaker: 'ai', 
          text: errorMessageText,
          timestamp: new Date().toISOString(),
        }];
      });
    } finally {
      setIsLoading(false);
      setIsAnalyzing(false);
      
      // Final performance logging for error cases
      if (performanceMetricsRef.current.endTime === 0) {
        logPerformance(false);
      }
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

  // Performance monitoring
  const performanceMetricsRef = useRef<{
    startTime: number;
    endTime: number;
    responseTime: number;
    messageCount: number;
    cacheHits: number;
    cacheMisses: number;
  }>({
    startTime: 0,
    endTime: 0,
    responseTime: 0,
    messageCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
  });
  
  // Log performance metrics
  const logPerformance = useCallback((isCacheHit: boolean = false) => {
    const metrics = performanceMetricsRef.current;
    metrics.endTime = performance.now();
    metrics.responseTime = metrics.endTime - metrics.startTime;
    metrics.messageCount++;
    
    if (isCacheHit) {
      metrics.cacheHits++;
    } else {
      metrics.cacheMisses++;
    }
    
    console.log(`Response performance metrics:
      - Response time: ${metrics.responseTime.toFixed(2)}ms
      - Total messages: ${metrics.messageCount}
      - Cache hits: ${metrics.cacheHits}
      - Cache misses: ${metrics.cacheMisses}
      - Cache hit rate: ${(metrics.cacheHits / metrics.messageCount * 100).toFixed(1)}%
    `);
  }, []);

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

      {/* Analysis Panel - Only render when needed to improve performance */}
      {isMounted && (
        <LazyAnalysisPanel
          currentAnalysis={currentAnalysis}
          isAnalyzing={isAnalyzing}
          enableEmotionAnalysis={enableEmotionAnalysis}
          enableHealthAnalysis={enableHealthAnalysis}
          enableFacialAnalysis={enableFacialAnalysis}
          enableVoiceAnalysis={enableVoiceAnalysis}
          setEnableEmotionAnalysis={setEnableEmotionAnalysis}
          setEnableHealthAnalysis={setEnableHealthAnalysis}
          setEnableFacialAnalysis={setEnableFacialAnalysis}
          setEnableVoiceAnalysis={setEnableVoiceAnalysis}
        />
      )}
      {!isMounted && (
        <Card className="w-full lg:w-[350px] h-[600px] shadow-xl bg-card overflow-hidden">
          <CardHeader className="p-4">
            <CardTitle className="text-lg text-center">Analysis Panel</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
