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

// Interface definitions (HealthMetrics, HealthAlert)
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

// Helper Functions (defined only once at the top level of the module)
const getScoreColor = (score: number | undefined) => {
  if (score === undefined) return 'text-gray-400';
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const getScoreBgColor = (score: number | undefined) => {
  if (score === undefined) return 'bg-gray-100 text-gray-700';
  if (score >= 80) return 'bg-green-100 text-green-800';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

const getAlertIcon = (type: HealthAlert['type']) => {
  switch (type) {
    case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
    default: return <AlertTriangle className="w-4 h-4 text-blue-500" />;
  }
};

const getSleepStageColor = (stage: keyof HealthMetrics['sleep']) => {
  switch (stage) {
    case 'deepSleep': return 'bg-indigo-600';
    case 'remSleep': return 'bg-purple-600';
    case 'lightSleep': return 'bg-sky-500';
    case 'totalHours': return 'bg-gray-300'; 
    case 'efficiency': return 'bg-gray-300';
    case 'quality': return 'bg-gray-300';
    default: return 'bg-gray-300';
  }
};

const getAlertBorderColor = (type: HealthAlert['type']) => {
  switch (type) {
    case 'error': return 'border-red-500';
    case 'warning': return 'border-yellow-500';
    case 'info': return 'border-blue-500';
    case 'success': return 'border-green-500';
    default: return 'border-gray-300';
  }
};

// Helper Components (defined only once at the top level of the module)
const CardSkeleton = ({ span, fullWidth }: { span?: string; fullWidth?: boolean }) => (
  <Card className={`${span || ''} ${fullWidth ? 'col-span-1 lg:col-span-3' : ''} shadow-lg rounded-xl overflow-hidden animate-pulse`}>
    <CardHeader className="bg-gray-200 h-16" />
    <CardContent className="p-5 space-y-4">
      <div className="h-8 bg-gray-300 rounded w-3/4"></div>
      <div className="h-6 bg-gray-300 rounded w-1/2"></div>
      <div className="h-6 bg-gray-300 rounded w-5/6"></div>
    </CardContent>
  </Card>
);

const MetricCard = ({ title, value, icon: Icon, unit, trend, trendDirection = 'normal' }: {
  title: string;
  value: number | undefined;
  icon: React.ElementType;
  unit: string;
  trend?: 'increasing' | 'decreasing' | 'stable';
  trendDirection?: 'normal' | 'inverse';
}) => {
  const isInverseGood = trendDirection === 'inverse';
  const trendValue = trend === 'increasing' ? <TrendingUp className={`h-4 w-4 ${isInverseGood ? 'text-red-500' : 'text-green-500'}`} /> :
                    trend === 'decreasing' ? <TrendingDown className={`h-4 w-4 ${isInverseGood ? 'text-green-500' : 'text-red-500'}`} /> : null;
  
  let displayValue = '-';
  if (value !== undefined) {
    if (value % 1 === 0) { 
      displayValue = value.toFixed(0);
    } else { 
      displayValue = value.toFixed(1);
    }
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 bg-gray-50">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className="h-5 w-5 text-gray-400" />
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className={`text-3xl font-bold ${getScoreColor(value)}`}>{displayValue}{unit}</div>
        {trend && (
          <p className="text-xs text-gray-500 flex items-center mt-1">
            {trendValue}
            <span className="ml-1">{trend}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const ActivityStat = ({ title, value, unit, icon: Icon, goal }: {
  title: string;
  value: string; 
  unit: string;
  icon: React.ElementType;
  goal?: number;
}) => (
  <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex flex-col items-center text-center">
    <div className="flex items-center text-gray-500 mb-2">
      <Icon className="h-4 w-4 mr-1.5" />
      <span className="text-sm font-medium">{title}</span>
    </div>
    <p className="text-2xl font-bold text-gray-800">{value} <span className="text-base font-normal text-gray-500">{unit}</span></p>
    {goal && value !== '-' && value !== '0' && parseInt(value.replace(/,/g, '')) > 0 && (
      <>
        <Progress value={(parseInt(value.replace(/,/g, '')) / goal) * 100} className="w-3/4 h-1.5 mt-2 mx-auto" />
        <p className="text-xs text-gray-400 mt-1">Goal: {goal.toLocaleString()} {unit}</p>
      </>
    )}
  </div>
);

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

    const getQualityString = (quality?: number): 'poor' | 'fair' | 'good' | 'excellent' => {
      if (!quality) return 'fair';
      if (quality >= 80) return 'excellent';
      if (quality >= 60) return 'good';
      if (quality >= 40) return 'fair';
      return 'poor';
    };

    const getStressTrend = (level?: number): 'increasing' | 'decreasing' | 'stable' => {
      if (!level) return 'stable';
      if (level > 70) return 'increasing';
      if (level < 30) return 'decreasing';
      return 'stable';
    };

    return {
      heartRate: {
        current: parseFloat((wearablesData.heartRate?.current || 70).toFixed(1)),
        resting: parseFloat((wearablesData.heartRate?.resting || 60).toFixed(1)),
        max: parseFloat((wearablesData.heartRate?.max || 180).toFixed(1)),
        zones: heartRateZones,
      },
      sleep: {
        totalHours: parseFloat((wearablesData.sleep?.duration || 7).toFixed(1)),
        deepSleep: parseFloat((wearablesData.sleep?.deepSleep || 1.5).toFixed(1)),
        remSleep: parseFloat((wearablesData.sleep?.remSleep || 1.5).toFixed(1)),
        lightSleep: parseFloat(((wearablesData.sleep?.duration || 7) - (wearablesData.sleep?.deepSleep || 1.5) - (wearablesData.sleep?.remSleep || 1.5)).toFixed(1)),
        efficiency: parseFloat((wearablesData.sleep?.efficiency || 85).toFixed(1)),
        quality: getQualityString(wearablesData.sleep?.quality),
      },
      activity: {
        steps: Math.round(wearablesData.activity?.steps || 8000),
        distance: parseFloat(((wearablesData.activity?.steps || 8000) * 0.0008).toFixed(2)),
        calories: Math.round(wearablesData.activity?.calories || 2000),
        activeMinutes: Math.round(wearablesData.activity?.activeMinutes || 60),
        goal: 10000,
      },
      stress: {
        level: parseFloat((wearablesData.stress?.level || 30).toFixed(1)),
        trend: getStressTrend(wearablesData.stress?.level),
        recovery: parseFloat(Math.max(0, 100 - (wearablesData.stress?.level || 30)).toFixed(1)),
      },
      wellness: {
        score: parseFloat(((100 - (wearablesData.stress?.level || 30) + (wearablesData.sleep?.efficiency || 85)) / 2).toFixed(1)),
        energy: parseFloat(((100 - (wearablesData.stress?.level || 30) * 0.8)).toFixed(1)),
        mood: parseFloat((85 + Math.random() * 15).toFixed(1)),
        readiness: parseFloat((((wearablesData.sleep?.efficiency || 85) + (100 - (wearablesData.stress?.level || 30))) / 2).toFixed(1)),
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

  if (!healthData && !isMonitoring) {
    return (
      <div className="p-4 md:p-6 space-y-6 bg-slate-50 min-h-screen flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Health Dashboard</h1>
            <p className="text-sm text-gray-500">Real-time monitoring of your health and wellness metrics</p>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdate && <p className="text-xs text-gray-400">Last updated: {lastUpdate}</p>}
            <Button onClick={toggleMonitoring} variant={isMonitoring ? "destructive" : "default"} className="shadow-md">
              <Clock className="mr-2 h-4 w-4" />
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </Button>
          </div>
        </div>
        <div className="flex-grow flex flex-col items-center justify-center text-center py-10">
          <Brain className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <p className="text-lg text-gray-500">Start monitoring to see your health data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Health Dashboard</h1>
          <p className="text-sm text-gray-500">Real-time monitoring of your health and wellness metrics</p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdate && <p className="text-xs text-gray-400">Last updated: {lastUpdate}</p>}
          <Button onClick={toggleMonitoring} variant={isMonitoring ? "destructive" : "default"} className="shadow-md">
            <Clock className="mr-2 h-4 w-4" />
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard title="Wellness Score" value={healthData?.wellness?.score} icon={Target} unit="" trend={healthData?.stress?.trend} />
        <MetricCard title="Energy Level" value={healthData?.wellness?.energy} icon={Zap} unit="%" />
        <MetricCard title="Readiness" value={healthData?.wellness?.readiness} icon={CheckCircle} unit="%" />
        <MetricCard title="Stress Level" value={healthData?.stress?.level} icon={Activity} unit="" trend={healthData?.stress?.trend} trendDirection="inverse" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Heart Rate Card - Spans 2 columns on larger screens */}
        {healthData?.heartRate ? (
          <Card className="lg:col-span-2 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-red-500 to-pink-500 text-white p-5">
              <CardTitle className="flex items-center text-xl">
                <Heart className="mr-3 h-7 w-7" />
                Heart Rate Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-500">Current</p>
                  <p className="text-4xl font-bold text-red-600">{healthData.heartRate.current.toFixed(1)} <span className="text-lg text-gray-500">bpm</span></p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Resting</p>
                  <p className="text-4xl font-bold text-gray-700">{healthData.heartRate.resting.toFixed(1)} <span className="text-lg text-gray-500">bpm</span></p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Max</p>
                  <p className="text-4xl font-bold text-gray-700">{healthData.heartRate.max.toFixed(1)} <span className="text-lg text-gray-500">bpm</span></p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Heart Rate Zones (bpm)</h4>
                <div className="space-y-2">
                  {Object.entries(healthData.heartRate.zones).map(([zone, value]) => (
                    <div key={zone} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <span className="text-sm capitalize text-gray-600">{zone.replace('_', ' ')} Zone</span>
                      <Badge variant="secondary" className="text-sm font-medium">{typeof value === 'number' ? value.toFixed(0) : value} bpm</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : <CardSkeleton span="lg:col-span-2" />}

        {/* Sleep Analysis Card - Spans 1 column */}
        {healthData?.sleep ? (
          <Card className="shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-5">
              <CardTitle className="flex items-center text-xl">
                <Moon className="mr-3 h-7 w-7" />
                Sleep Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold text-gray-700">Total Sleep</p>
                <p className="text-3xl font-bold text-blue-600">{healthData.sleep.totalHours.toFixed(1)} <span className="text-base text-gray-500">hours</span></p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">Efficiency</p>
                <Badge className={`${getScoreBgColor(healthData.sleep.efficiency)} px-2 py-1 text-xs`}>{healthData.sleep.efficiency.toFixed(1)}% ({healthData.sleep.quality})</Badge>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Sleep Stages</h4>
                {(Object.keys(healthData.sleep) as Array<keyof HealthMetrics['sleep']>)
                  .filter(key => ['deepSleep', 'remSleep', 'lightSleep'].includes(key))
                  .map((stageKey) => {
                    const stageValue = healthData.sleep[stageKey];
                    if (typeof stageValue === 'number') { // Type guard
                      return (
                        <div key={stageKey} className="mb-2.5">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize text-gray-600">{stageKey.replace('Sleep', ' Sleep')}</span>
                            <span className="font-medium text-gray-700">{stageValue.toFixed(1)}h</span>
                          </div>
                          <Progress value={(stageValue / healthData.sleep.totalHours) * 100} className={`h-2.5 ${getSleepStageColor(stageKey)}`} />
                        </div>
                      );
                    }
                    return null; // Should not happen if filter is correct
                  })}
              </div>
            </CardContent>
          </Card>
        ) : <CardSkeleton />}
      </div>

      {/* Activity Insights Card */}
      {healthData?.activity ? (
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-green-500 to-teal-500 text-white p-5">
            <CardTitle className="flex items-center text-xl">
              <BarChart3 className="mr-3 h-7 w-7" />
              Activity Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <ActivityStat title="Steps" value={(healthData.activity.steps || 0).toLocaleString()} unit="steps" icon={TrendingUp} goal={healthData.activity.goal} />
            <ActivityStat title="Distance" value={(healthData.activity.distance || 0).toFixed(2)} unit="km" icon={TrendingUp} />
            <ActivityStat title="Calories Burned" value={(healthData.activity.calories || 0).toLocaleString()} unit="kcal" icon={TrendingUp} />
            <ActivityStat title="Active Minutes" value={(healthData.activity.activeMinutes || 0).toLocaleString()} unit="mins" icon={TrendingUp} />
          </CardContent>
        </Card>
      ) : <CardSkeleton fullWidth />}

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-700">Important Alerts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.slice(0, 3).map(alert => (
              <Alert key={alert.id} className={`shadow-md rounded-lg border-l-4 ${getAlertBorderColor(alert.type)}`}>
                {getAlertIcon(alert.type)}
                <AlertDescription className="font-medium text-gray-700">{alert.title}</AlertDescription>
                <p className="text-xs text-gray-500 mt-1">{alert.message}</p>
                <p className="text-xs text-gray-400 mt-2 text-right">{new Date(alert.timestamp).toLocaleTimeString()}</p>
              </Alert>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 
