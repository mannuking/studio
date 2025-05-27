/**
 * Analysis panel component for the Enhanced Chat Interface
 * Extracted as a separate component for better code organization and lazy loading
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Heart,
  Brain,
  Activity,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

// Define the types needed for the Analysis Panel
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

interface AnalysisPanelProps {
  currentAnalysis: AnalysisData | null;
  isAnalyzing: boolean;
  enableEmotionAnalysis: boolean;
  enableHealthAnalysis: boolean;
  enableFacialAnalysis: boolean;
  enableVoiceAnalysis: boolean;
  setEnableEmotionAnalysis: (value: boolean) => void;
  setEnableHealthAnalysis: (value: boolean) => void;
  setEnableFacialAnalysis: (value: boolean) => void;
  setEnableVoiceAnalysis: (value: boolean) => void;
}

export function AnalysisPanel({
  currentAnalysis,
  isAnalyzing,
  enableEmotionAnalysis,
  enableHealthAnalysis,
  enableFacialAnalysis,
  enableVoiceAnalysis,
  setEnableEmotionAnalysis,
  setEnableHealthAnalysis,
  setEnableFacialAnalysis,
  setEnableVoiceAnalysis
}: AnalysisPanelProps) {
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
    <Card className="w-full lg:w-[350px] h-[600px] shadow-xl bg-card overflow-hidden">
      <CardHeader className="p-4">
        <CardTitle className="text-lg text-center">Analysis Panel</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-5 overflow-y-auto h-[calc(100%-4rem)]">
        {isAnalyzing ? (
          <div className="space-y-5">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ) : currentAnalysis ? (
          <>
            {/* Emotion Analysis */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center">
                  <Brain className="w-4 h-4 mr-1 text-primary" /> Emotion Analysis
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={enableEmotionAnalysis}
                    onChange={(e) => setEnableEmotionAnalysis(e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{currentAnalysis.emotion.primary}</span>
                  <span className="text-xs text-muted-foreground">{Math.round(currentAnalysis.emotion.confidence * 100)}% confidence</span>
                </div>
                <Progress value={currentAnalysis.emotion.confidence * 100} className="h-2 mb-2" />
                <div className="text-xs flex justify-between">
                  <span>Distress Level: {Math.round(currentAnalysis.emotion.distressLevel * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Health Analysis */}
            {currentAnalysis.health && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium flex items-center">
                    <Heart className="w-4 h-4 mr-1 text-red-500" /> Health Analysis
                  </h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={enableHealthAnalysis}
                      onChange={(e) => setEnableHealthAnalysis(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="p-2 bg-muted rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Wellness Score</span>
                    <span className="text-xs text-muted-foreground">{currentAnalysis.health.wellnessScore}/100</span>
                  </div>
                  <Progress value={currentAnalysis.health.wellnessScore} className="h-2 mb-2" />
                  <div className="text-xs flex justify-between">
                    <span>Stress Level: {currentAnalysis.health.stressLevel}/10</span>
                  </div>

                  {currentAnalysis.health.alerts.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium">Alerts:</p>
                      {currentAnalysis.health.alerts.map((alert, index) => (
                        <div key={index} className="flex items-start gap-1 text-xs">
                          {alert.severity === 'high' && <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />}
                          {alert.severity === 'medium' && <Info className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />}
                          {alert.severity === 'low' && <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />}
                          <span>{alert.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Facial Analysis */}
            {currentAnalysis.facial && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium flex items-center">
                    <Activity className="w-4 h-4 mr-1 text-blue-500" /> Facial Analysis
                  </h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={enableFacialAnalysis}
                      onChange={(e) => setEnableFacialAnalysis(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="p-2 bg-muted rounded-lg">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Engagement: {Math.round(currentAnalysis.facial.engagement)}%</span>
                    <span>Attention: {Math.round(currentAnalysis.facial.attention)}%</span>
                  </div>
                  <Progress value={currentAnalysis.facial.engagement} className="h-2 mb-2" />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(currentAnalysis.facial.emotions).map(([emotion, value]) => (
                      <Badge key={emotion} variant="secondary" className="text-xs">
                        {emotion}: {Math.round(value * 100)}%
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Voice Analysis */}
            {currentAnalysis.voice && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium flex items-center">
                    <Activity className="w-4 h-4 mr-1 text-purple-500" /> Voice Analysis
                  </h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={enableVoiceAnalysis}
                      onChange={(e) => setEnableVoiceAnalysis(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="p-2 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div>Volume: {Math.round(currentAnalysis.voice.volume * 100)}%</div>
                    <div>Pitch: {Math.round(currentAnalysis.voice.pitch)} Hz</div>
                    <div>Tone: {currentAnalysis.voice.tone}</div>
                    <div>Clarity: {Math.round(currentAnalysis.voice.clarity * 100)}%</div>
                  </div>
                </div>
              </div>
            )}

            {/* Safety Assessment */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1 text-amber-500" /> Safety Assessment
              </h3>
              <div className="p-2 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`${getRiskLevelColor(currentAnalysis.safety.riskLevel)} text-xs`}>
                    {currentAnalysis.safety.riskLevel.toUpperCase()} Risk
                  </Badge>
                </div>
                {currentAnalysis.safety.concerns.length > 0 && (
                  <div className="text-xs mt-1">
                    <p className="font-medium">Concerns:</p>
                    <ul className="list-disc list-inside">
                      {currentAnalysis.safety.concerns.map((concern, index) => (
                        <li key={index}>{concern}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Intent Analysis */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center">
                <Brain className="w-4 h-4 mr-1 text-indigo-500" /> Therapeutic Context
              </h3>
              <div className="p-2 bg-muted rounded-lg">
                <div className="text-xs space-y-1">
                  <div><span className="font-medium">Intent:</span> {currentAnalysis.context.intent}</div>
                  <div><span className="font-medium">Urgency:</span> {currentAnalysis.context.urgency}</div>
                  <div><span className="font-medium">Alliance:</span> {Math.round(currentAnalysis.context.alliance * 100)}%</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No analysis data available yet. Send a message to begin analysis.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
