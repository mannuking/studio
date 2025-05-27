/**
 * Performance monitoring utility for tracking response times and optimizations
 */

interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  cacheHit?: boolean;
  error?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 100; // Keep only last 100 metrics
  
  /**
   * Start timing an operation
   */
  startTiming(operation: string): string {
    const id = `${operation}_${Date.now()}_${Math.random()}`;
    
    const metric: PerformanceMetric = {
      operation,
      startTime: performance.now(),
      success: false,
    };
    
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
    
    return id;
  }
  
  /**
   * End timing an operation
   */
  endTiming(id: string, success: boolean = true, cacheHit: boolean = false, error?: string): number {
    const endTime = performance.now();
    
    // Find the metric by reconstructing the operation name from ID
    const operationName = id.split('_')[0];
    const metric = this.metrics
      .filter(m => m.operation === operationName && !m.endTime)
      .pop();
    
    if (metric) {
      metric.endTime = endTime;
      metric.duration = endTime - metric.startTime;
      metric.success = success;
      metric.cacheHit = cacheHit;
      metric.error = error;
      
      return metric.duration;
    }
    
    return 0;
  }
  
  /**
   * Get performance statistics
   */
  getStats(operation?: string): {
    totalOperations: number;
    averageTime: number;
    successRate: number;
    cacheHitRate: number;
    fastestTime: number;
    slowestTime: number;
  } {
    const relevantMetrics = operation 
      ? this.metrics.filter(m => m.operation === operation && m.duration)
      : this.metrics.filter(m => m.duration);
    
    if (relevantMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageTime: 0,
        successRate: 0,
        cacheHitRate: 0,
        fastestTime: 0,
        slowestTime: 0,
      };
    }
    
    const durations = relevantMetrics.map(m => m.duration!);
    const successes = relevantMetrics.filter(m => m.success).length;
    const cacheHits = relevantMetrics.filter(m => m.cacheHit).length;
    
    return {
      totalOperations: relevantMetrics.length,
      averageTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      successRate: (successes / relevantMetrics.length) * 100,
      cacheHitRate: (cacheHits / relevantMetrics.length) * 100,
      fastestTime: Math.min(...durations),
      slowestTime: Math.max(...durations),
    };
  }
  
  /**
   * Log performance summary to console
   */
  logSummary(): void {
    const stats = this.getStats();
    console.group('🚀 MITR AI Performance Summary');
    console.log(`Total Operations: ${stats.totalOperations}`);
    console.log(`Average Response Time: ${stats.averageTime.toFixed(2)}ms`);
    console.log(`Success Rate: ${stats.successRate.toFixed(1)}%`);
    console.log(`Cache Hit Rate: ${stats.cacheHitRate.toFixed(1)}%`);
    console.log(`Fastest Response: ${stats.fastestTime.toFixed(2)}ms`);
    console.log(`Slowest Response: ${stats.slowestTime.toFixed(2)}ms`);
    console.groupEnd();
  }
  
  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }
  
  /**
   * Get recent performance trends
   */
  getTrends(): {
    improving: boolean;
    recentAverage: number;
    previousAverage: number;
  } {
    const allMetrics = this.metrics.filter(m => m.duration);
    
    if (allMetrics.length < 10) {
      return {
        improving: false,
        recentAverage: 0,
        previousAverage: 0,
      };
    }
    
    const half = Math.floor(allMetrics.length / 2);
    const recent = allMetrics.slice(-half);
    const previous = allMetrics.slice(0, half);
    
    const recentAverage = recent.reduce((a, b) => a + b.duration!, 0) / recent.length;
    const previousAverage = previous.reduce((a, b) => a + b.duration!, 0) / previous.length;
    
    return {
      improving: recentAverage < previousAverage,
      recentAverage,
      previousAverage,
    };
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Log summary every 5 minutes in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setInterval(() => {
    performanceMonitor.logSummary();
  }, 5 * 60 * 1000);
}
