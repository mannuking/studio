"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Heart, 
  Activity, 
  Moon, 
  Brain, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Zap,
  Target,
  Clock,
  BarChart3
} from 'lucide-react';
import { generateMockWearablesData } from '@/utils/multimodal-helpers';
import type { WearablesDataInput } from '@/ai/flows/wearables-analysis';

interface HealthMetrics {
  heartRate: {
    current: number;
    resting: number;
    max: number;
    zones: {
      fat_burn: number;
      cardio: number;
      peak: number;
    };
  };
  sleep: {
    totalHours: number;
    deepSleep: number;
    remSleep: number;
    lightSleep: number;
    efficiency: number;
    quality: 'poor' | 'fair' | 'good' | 'excellent';
  };
  activity: {
    steps: number;
    distance: number;
    calories: number;
    activeMinutes: number;
    goal: number;
  };
  stress: {
    level: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    recovery: number;
  };
  wellness: {
    score: number;
    energy: number;
    mood: number;
    readiness: number;
  };
}

interface HealthAlert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export function HealthDashboard() {
  const [healthData, setHealthData] = useState<HealthMetrics | null>(null);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate comprehensive health metrics from wearables data
  const generateHealthMetrics = (wearablesData: WearablesDataInput): HealthMetrics => {
    const heartRateZones = {
      fat_burn: Math.round((wearablesData.heartRate?.current || 70) * 0.6),
      cardio: Math.round((wearablesData.heartRate?.current || 70) * 0.7),
      peak: Math.round((wearablesData.heartRate?.current || 70) * 0.85),
    };

    // Map sleep quality number to string
    const getQualityString = (quality?: number): 'poor' | 'fair' | 'good' | 'excellent' => {
      if (!quality) return 'fair';
      if (quality >= 80) return 'excellent';
      if (quality >= 60) return 'good';
      if (quality >= 40) return 'fair';
      return 'poor';
    };

    // Map stress trend
    const getStressTrend = (level?: number): 'increasing' | 'decreasing' | 'stable' => {
      if (!level) return 'stable';
      if (level > 70) return 'increasing';
      if (level < 30) return 'decreasing';
      return 'stable';
    };

    return {
      heartRate: {
        current: wearablesData.heartRate?.current || 70,
        resting: wearablesData.heartRate?.resting || 60,
        max: wearablesData.heartRate?.max || 180,
        zones: heartRateZones,
      },
      sleep: {
        totalHours: wearablesData.sleep?.duration || 7,
        deepSleep: wearablesData.sleep?.deepSleep || 1.5,
        remSleep: wearablesData.sleep?.remSleep || 1.5,
        lightSleep: (wearablesData.sleep?.duration || 7) - (wearablesData.sleep?.deepSleep || 1.5) - (wearablesData.sleep?.remSleep || 1.5),
        efficiency: wearablesData.sleep?.efficiency || 85,
        quality: getQualityString(wearablesData.sleep?.quality),
      },
      activity: {
        steps: wearablesData.activity?.steps || 8000,
        distance: (wearablesData.activity?.steps || 8000) * 0.0008, // Approximate km
        calories: wearablesData.activity?.calories || 2000,
        activeMinutes: wearablesData.activity?.activeMinutes || 60,
        goal: 10000, // Default step goal
      },
      stress: {
        level: wearablesData.stress?.level || 30,
        trend: getStressTrend(wearablesData.stress?.level),
        recovery: Math.max(0, 100 - (wearablesData.stress?.level || 30)),
      },
      wellness: {
        score: Math.round((100 - (wearablesData.stress?.level || 30) + (wearablesData.sleep?.efficiency || 85)) / 2),
        energy: Math.round(100 - (wearablesData.stress?.level || 30) * 0.8),
        mood: Math.round(85 + Math.random() * 15), // Simulated mood score
        readiness: Math.round(((wearablesData.sleep?.efficiency || 85) + (100 - (wearablesData.stress?.level || 30))) / 2),
      },
    };
  };

  // Generate health alerts based on metrics
  const generateHealthAlerts = (metrics: HealthMetrics): HealthAlert[] => {
    const alerts: HealthAlert[] = [];
    const now = new Date().toISOString();

    // Heart rate alerts
    if (metrics.heartRate.current > metrics.heartRate.max * 0.9) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'warning',
        title: 'High Heart Rate',
        message: `Current heart rate (${metrics.heartRate.current} bpm) is approaching maximum`,
        timestamp: now,
        priority: 'high',
      });
    }

    // Sleep alerts
    if (metrics.sleep.totalHours < 6) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'warning',
        title: 'Insufficient Sleep',
        message: `Only ${metrics.sleep.totalHours.toFixed(1)} hours of sleep detected`,
        timestamp: now,
        priority: 'medium',
      });
    }

    if (metrics.sleep.quality === 'poor') {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'info',
        title: 'Poor Sleep Quality',
        message: 'Consider improving sleep hygiene for better rest',
        timestamp: now,
        priority: 'medium',
      });
    }

    // Activity alerts
    if (metrics.activity.steps < metrics.activity.goal * 0.5) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'info',
        title: 'Low Activity',
        message: 'Consider increasing physical activity today',
        timestamp: now,
        priority: 'low',
      });
    }

    // Stress alerts
    if (metrics.stress.level > 80) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'warning',
        title: 'High Stress Level',
        message: 'Consider stress management techniques',
        timestamp: now,
        priority: 'high',
      });
    }

    // Wellness alerts
    if (metrics.wellness.score < 60) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'warning',
        title: 'Low Wellness Score',
        message: 'Focus on rest and recovery',
        timestamp: now,
        priority: 'medium',
      });
    }

    return alerts;
  };

  // Update health data
  const updateHealthData = () => {
    const wearablesData = generateMockWearablesData();
    const metrics = generateHealthMetrics(wearablesData);
    const newAlerts = generateHealthAlerts(metrics);
    
    setHealthData(metrics);
    setAlerts(newAlerts);
    setLastUpdate(new Date().toLocaleTimeString());
  };

  // Toggle monitoring
  const toggleMonitoring = () => {
    if (isMonitoring) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsMonitoring(false);
    } else {
      updateHealthData(); // Initial update
      intervalRef.current = setInterval(updateHealthData, 30000); // Update every 30 seconds
      setIsMonitoring(true);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Initial data load
  useEffect(() => {
    updateHealthData();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-blue-500" />;
    }
  };

  if (!healthData) {
    return (
      <div className="w-full max-w-6xl">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading health data...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Health Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of your health and wellness metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <span className="text-sm text-muted-foreground">
              Last updated: {lastUpdate}
            </span>
          )}
          <Button
            onClick={toggleMonitoring}
            variant={isMonitoring ? "destructive" : "default"}
            className="flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Button>
        </div>
      </div>

      {/* Wellness Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Wellness Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(healthData.wellness.score)}`}>
                  {healthData.wellness.score}
                </p>
              </div>
              <div className={`p-2 rounded-full ${getScoreBgColor(healthData.wellness.score)}`}>
                <Target className="w-6 h-6" />
              </div>
            </div>
            <Progress value={healthData.wellness.score} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Energy Level</p>
                <p className={`text-2xl font-bold ${getScoreColor(healthData.wellness.energy)}`}>
                  {healthData.wellness.energy}
                </p>
              </div>
              <div className={`p-2 rounded-full ${getScoreBgColor(healthData.wellness.energy)}`}>
                <Zap className="w-6 h-6" />
              </div>
            </div>
            <Progress value={healthData.wellness.energy} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Readiness</p>
                <p className={`text-2xl font-bold ${getScoreColor(healthData.wellness.readiness)}`}>
                  {healthData.wellness.readiness}
                </p>
              </div>
              <div className={`p-2 rounded-full ${getScoreBgColor(healthData.wellness.readiness)}`}>
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
            <Progress value={healthData.wellness.readiness} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stress Level</p>
                <p className={`text-2xl font-bold ${getScoreColor(100 - healthData.stress.level)}`}>
                  {healthData.stress.level}
                </p>
              </div>
              <div className={`p-2 rounded-full ${getScoreBgColor(100 - healthData.stress.level)}`}>
                <Brain className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {healthData.stress.trend === 'increasing' && <TrendingUp className="w-4 h-4 text-red-500" />}
              {healthData.stress.trend === 'decreasing' && <TrendingDown className="w-4 h-4 text-green-500" />}
              <span className="text-sm text-muted-foreground capitalize">{healthData.stress.trend}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heart Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Heart Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Current</p>
                <p className="text-2xl font-bold text-red-500">{healthData.heartRate.current}</p>
                <p className="text-xs text-muted-foreground">bpm</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Resting</p>
                <p className="text-xl font-semibold">{healthData.heartRate.resting}</p>
                <p className="text-xs text-muted-foreground">bpm</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Max</p>
                <p className="text-xl font-semibold">{healthData.heartRate.max}</p>
                <p className="text-xs text-muted-foreground">bpm</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Fat Burn Zone</span>
                <Badge variant="secondary">{healthData.heartRate.zones.fat_burn} bpm</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Cardio Zone</span>
                <Badge variant="secondary">{healthData.heartRate.zones.cardio} bpm</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Peak Zone</span>
                <Badge variant="secondary">{healthData.heartRate.zones.peak} bpm</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sleep */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-blue-500" />
              Sleep Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Sleep</p>
                <p className="text-2xl font-bold text-blue-500">{healthData.sleep.totalHours.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">hours</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Efficiency</p>
                <p className="text-xl font-semibold">{healthData.sleep.efficiency}%</p>
                <Badge variant="outline" className="mt-1 capitalize">
                  {healthData.sleep.quality}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Deep Sleep</span>
                <span className="text-sm font-medium">{healthData.sleep.deepSleep.toFixed(1)}h</span>
              </div>
              <Progress value={(healthData.sleep.deepSleep / healthData.sleep.totalHours) * 100} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm">REM Sleep</span>
                <span className="text-sm font-medium">{healthData.sleep.remSleep.toFixed(1)}h</span>
              </div>
              <Progress value={(healthData.sleep.remSleep / healthData.sleep.totalHours) * 100} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Light Sleep</span>
                <span className="text-sm font-medium">{healthData.sleep.lightSleep.toFixed(1)}h</span>
              </div>
              <Progress value={(healthData.sleep.lightSleep / healthData.sleep.totalHours) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              Daily Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Steps</p>
                <p className="text-2xl font-bold text-green-500">{healthData.activity.steps.toLocaleString()}</p>
                <Progress value={(healthData.activity.steps / healthData.activity.goal) * 100} className="mt-2" />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Calories</p>
                <p className="text-xl font-semibold">{healthData.activity.calories}</p>
                <p className="text-xs text-muted-foreground">kcal</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Distance</span>
                <span className="text-sm font-medium">{healthData.activity.distance.toFixed(1)} km</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Active Minutes</span>
                <span className="text-sm font-medium">{healthData.activity.activeMinutes} min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Goal Progress</span>
                <span className="text-sm font-medium">
                  {Math.round((healthData.activity.steps / healthData.activity.goal) * 100)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Health Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No health alerts</p>
                <p className="text-xs text-muted-foreground">All metrics are within normal ranges</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <Alert key={alert.id} className="p-3">
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">{alert.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {alert.priority}
                          </Badge>
                        </div>
                        <AlertDescription className="text-xs mt-1">
                          {alert.message}
                        </AlertDescription>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
