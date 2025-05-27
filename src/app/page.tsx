"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EnhancedChatInterface } from '@/components/mitr-ai/enhanced-chat-interface';
import { HealthDashboard } from '@/components/mitr-ai/health-dashboard';
import { 
  MessageCircle, 
  Heart, 
  Brain, 
  Activity, 
  Shield, 
  Sparkles,
  Mic,
  Camera,
  Watch
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              MITR AI
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-6">
            Your Comprehensive Therapeutic Companion
          </p>
          
          {/* Feature Highlights */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
              <Brain className="w-4 h-4" />
              Emotion Analysis
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
              <Mic className="w-4 h-4" />
              Voice Recognition
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
              <Camera className="w-4 h-4" />
              Facial Analysis
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
              <Watch className="w-4 h-4" />
              Health Monitoring
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
              <Shield className="w-4 h-4" />
              Safety Assessment
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
              <Sparkles className="w-4 h-4" />
              AI-Powered Insights
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Therapeutic Chat
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Health Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-6">
            <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  Enhanced Therapeutic Interface
                </CardTitle>
                <p className="text-muted-foreground">
                  Engage in meaningful conversations with multimodal analysis including emotion recognition, 
                  voice analysis, facial expression detection, and real-time health monitoring.
                </p>
              </CardHeader>
              <CardContent className="flex justify-center">
                <EnhancedChatInterface />
              </CardContent>
            </Card>

            {/* Features Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Brain className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Emotion AI</h3>
                      <p className="text-sm text-muted-foreground">Real-time emotion detection</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Activity className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Voice Analysis</h3>
                      <p className="text-sm text-muted-foreground">Speech pattern insights</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <Camera className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Facial Recognition</h3>
                      <p className="text-sm text-muted-foreground">Expression analysis</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-full">
                      <Shield className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Safety Monitor</h3>
                      <p className="text-sm text-muted-foreground">Risk assessment</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-600" />
                  Comprehensive Health Monitoring
                </CardTitle>
                <p className="text-muted-foreground">
                  Monitor your physical and mental wellness with real-time data from wearable devices, 
                  sleep tracking, activity monitoring, and stress analysis.
                </p>
              </CardHeader>
              <CardContent className="flex justify-center">
                <HealthDashboard />
              </CardContent>
            </Card>

            {/* Health Features Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-full">
                      <Heart className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Heart Rate</h3>
                      <p className="text-sm text-muted-foreground">Continuous monitoring</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Sleep Tracking</h3>
                      <p className="text-sm text-muted-foreground">Quality analysis</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Activity className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Activity Goals</h3>
                      <p className="text-sm text-muted-foreground">Progress tracking</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-full">
                      <Brain className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Stress Analysis</h3>
                      <p className="text-sm text-muted-foreground">Mental wellness</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-muted-foreground">
            MITR AI - Empowering mental health through advanced AI technology
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Built with Next.js, TypeScript, and Google Genkit AI
          </p>
        </div>
      </div>
    </div>
  );
}
