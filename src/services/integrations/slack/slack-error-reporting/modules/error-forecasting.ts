/**
 * @ai-metadata
 * @component: ErrorForecasting
 * @description: Provides predictive analytics and forecasting for error trends and patterns
 * @last-update: 2025-01-13
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/error-forecasting.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["../../interfaces", "./error-persistence", "./error-analytics"]
 * @tests: ["../tests/error-forecasting.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Module that analyzes error patterns to predict future trends and potential issues"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 */

import type {
  ErrorSeverity
} from '../../interfaces/slack-error-reporting.interface';
import type { ErrorPersistence } from './error-persistence';
import type { ErrorAnalytics } from './error-analytics';

/**
 * Forecast data point interface
 */
interface ForecastDataPoint {
  timestamp: Date;
  predicted: number;
  confidence: number;
  upperBound: number;
  lowerBound: number;
}

/**
 * Trend analysis result
 */
interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  strength: number; // 0-1, where 1 is strongest trend
  confidence: number; // 0-1, confidence in the trend
  changeRate: number; // percentage change per time unit
  seasonality: {
    detected: boolean;
    period?: number; // in hours
    amplitude?: number;
  };
}

/**
 * Anomaly detection result
 */
interface AnomalyDetection {
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high';
  score: number; // 0-1, where 1 is most anomalous
  expectedRange: {
    min: number;
    max: number;
  };
  actualValue: number;
  timestamp: Date;
}

/**
 * Forecast configuration
 */
interface ForecastConfig {
  enabled: boolean;
  forecastHorizon: number; // hours to forecast ahead
  confidenceLevel: number; // 0-1, typically 0.95 for 95% confidence
  minDataPoints: number; // minimum data points needed for forecasting
  anomalyThreshold: number; // threshold for anomaly detection
  seasonalityDetection: boolean;
  trendSmoothingFactor: number; // 0-1, for exponential smoothing
}

/**
 * Forecast result
 */
interface ForecastResult {
  service: string;
  severity?: ErrorSeverity;
  forecast: ForecastDataPoint[];
  trend: TrendAnalysis;
  anomalies: AnomalyDetection[];
  recommendations: string[];
  generatedAt: Date;
  validUntil: Date;
}

/**
 * Provides error forecasting and predictive analytics
 * Uses statistical methods to predict future error patterns
 */
export class ErrorForecasting {
  private persistence: ErrorPersistence;
  private analytics: ErrorAnalytics;
  private config: ForecastConfig;
  private forecastCache: Map<string, { result: ForecastResult; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor(
    persistence: ErrorPersistence,
    analytics: ErrorAnalytics,
    config?: Partial<ForecastConfig>
  ) {
    this.persistence = persistence;
    this.analytics = analytics;
    this.config = this.mergeWithDefaultConfig(config || {});
  }

  /**
   * Generate forecast for error trends
   * @param options - Forecast options
   * @returns Promise that resolves to forecast results
   */
  async generateForecast(options: {
    service?: string;
    severity?: ErrorSeverity;
    timeRange?: { from: Date; to: Date };
    forecastHours?: number;
  } = {}): Promise<ForecastResult[]> {
    try {
      if (!this.config.enabled) {
        return [];
      }

      const cacheKey = this.generateCacheKey(options);
      const cached = this.getCachedForecast(cacheKey);
      if (cached) {
        return [cached];
      }

      // Get historical data
      const timeRange = options.timeRange || this.getDefaultTimeRange();
      const historicalData = await this.getHistoricalData(timeRange, options);

      if (historicalData.length < this.config.minDataPoints) {
        console.warn(`⚠️ Insufficient data for forecasting (${historicalData.length} < ${this.config.minDataPoints})`);
        return [];
      }

      // Generate forecast
      const forecast = await this.performForecasting(historicalData, options);
      
      // Cache the result
      this.setCachedForecast(cacheKey, forecast);

      return [forecast];

    } catch (error) {
      console.error('❌ Failed to generate forecast:', error);
      return [];
    }
  }

  /**
   * Perform the actual forecasting calculation
   * @param historicalData - Historical error data
   * @param options - Forecast options
   * @returns Forecast result
   */
  private async performForecasting(
    historicalData: Array<{ timestamp: Date; count: number }>,
    options: {
      service?: string;
      severity?: ErrorSeverity;
      forecastHours?: number;
    }
  ): Promise<ForecastResult> {
    const forecastHours = options.forecastHours || this.config.forecastHorizon;
    const now = new Date();
    
    // Analyze trend
    const trend = this.analyzeTrend(historicalData);
    
    // Detect anomalies
    const anomalies = this.detectAnomalies(historicalData);
    
    // Generate forecast points using exponential smoothing
    const forecast = this.generateForecastPoints(historicalData, forecastHours, trend);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(trend, anomalies, forecast);

    return {
      service: options.service || 'all',
      severity: options.severity,
      forecast,
      trend,
      anomalies,
      recommendations,
      generatedAt: now,
      validUntil: new Date(now.getTime() + this.CACHE_TTL)
    };
  }

  /**
   * Analyze trend in historical data
   * @param data - Historical data points
   * @returns Trend analysis
   */
  private analyzeTrend(data: Array<{ timestamp: Date; count: number }>): TrendAnalysis {
    if (data.length < 3) {
      return {
        direction: 'stable',
        strength: 0,
        confidence: 0,
        changeRate: 0,
        seasonality: { detected: false }
      };
    }

    // Calculate linear regression
    const n = data.length;
    const x = data.map((_, i) => i);
    const y = data.map(d => d.count);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssRes = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const rSquared = 1 - (ssRes / ssTotal);
    
    // Determine direction and strength
    const direction = slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable';
    const strength = Math.min(Math.abs(slope) / 10, 1); // Normalize to 0-1
    const confidence = Math.max(0, rSquared);
    
    // Calculate change rate (percentage per hour)
    const avgValue = yMean;
    const changeRate = avgValue > 0 ? (slope / avgValue) * 100 : 0;
    
    // Detect seasonality
    const seasonality = this.detectSeasonality(data);

    return {
      direction,
      strength,
      confidence,
      changeRate,
      seasonality
    };
  }

  /**
   * Detect seasonality in data
   * @param data - Historical data points
   * @returns Seasonality information
   */
  private detectSeasonality(data: Array<{ timestamp: Date; count: number }>): {
    detected: boolean;
    period?: number;
    amplitude?: number;
  } {
    if (data.length < 24) { // Need at least 24 hours of data
      return { detected: false };
    }

    // Simple seasonality detection using autocorrelation
    const values = data.map(d => d.count);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    
    // Test for common periods (24h, 12h, 8h, 6h)
    const testPeriods = [24, 12, 8, 6];
    let bestPeriod = 0;
    let bestCorrelation = 0;
    
    for (const period of testPeriods) {
      if (data.length >= period * 2) {
        const correlation = this.calculateAutocorrelation(values, period);
        if (correlation > bestCorrelation) {
          bestCorrelation = correlation;
          bestPeriod = period;
        }
      }
    }
    
    const detected = bestCorrelation > 0.3; // Threshold for seasonality detection
    
    if (detected) {
      // Calculate amplitude
      const detrended = this.detrend(values);
      const amplitude = Math.sqrt(detrended.reduce((sum, val) => sum + val * val, 0) / detrended.length);
      
      return {
        detected: true,
        period: bestPeriod,
        amplitude
      };
    }
    
    return { detected: false };
  }

  /**
   * Calculate autocorrelation for a given lag
   * @param values - Array of values
   * @param lag - Lag period
   * @returns Autocorrelation coefficient
   */
  private calculateAutocorrelation(values: number[], lag: number): number {
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n - lag; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
    }
    
    for (let i = 0; i < n; i++) {
      denominator += Math.pow(values[i] - mean, 2);
    }
    
    return denominator > 0 ? numerator / denominator : 0;
  }

  /**
   * Detrend data by removing linear trend
   * @param values - Array of values
   * @returns Detrended values
   */
  private detrend(values: number[]): number[] {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    
    // Calculate linear trend
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Remove trend
    return values.map((val, i) => val - (slope * i + intercept));
  }

  /**
   * Detect anomalies in historical data
   * @param data - Historical data points
   * @returns Array of detected anomalies
   */
  private detectAnomalies(data: Array<{ timestamp: Date; count: number }>): AnomalyDetection[] {
    if (data.length < 10) {
      return [];
    }

    const values = data.map(d => d.count);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    
    const anomalies: AnomalyDetection[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const value = data[i].count;
      const zScore = stdDev > 0 ? Math.abs(value - mean) / stdDev : 0;
      
      if (zScore > this.config.anomalyThreshold) {
        const severity = zScore > 3 ? 'high' : zScore > 2 ? 'medium' : 'low';
        
        anomalies.push({
          isAnomaly: true,
          severity,
          score: Math.min(zScore / 4, 1), // Normalize to 0-1
          expectedRange: {
            min: mean - 2 * stdDev,
            max: mean + 2 * stdDev
          },
          actualValue: value,
          timestamp: data[i].timestamp
        });
      }
    }
    
    return anomalies;
  }

  /**
   * Generate forecast points using exponential smoothing
   * @param historicalData - Historical data
   * @param forecastHours - Number of hours to forecast
   * @param trend - Trend analysis
   * @returns Array of forecast points
   */
  private generateForecastPoints(
    historicalData: Array<{ timestamp: Date; count: number }>,
    forecastHours: number,
    trend: TrendAnalysis
  ): ForecastDataPoint[] {
    const alpha = this.config.trendSmoothingFactor;
    const values = historicalData.map(d => d.count);
    const lastTimestamp = historicalData[historicalData.length - 1].timestamp;
    
    // Calculate initial smoothed value
    let smoothedValue = values[0];
    for (let i = 1; i < values.length; i++) {
      smoothedValue = alpha * values[i] + (1 - alpha) * smoothedValue;
    }
    
    // Calculate trend component
    let trendComponent = 0;
    if (trend.direction !== 'stable') {
      const recentValues = values.slice(-Math.min(24, values.length)); // Last 24 hours
      const avgChange = recentValues.length > 1 
        ? (recentValues[recentValues.length - 1] - recentValues[0]) / (recentValues.length - 1)
        : 0;
      trendComponent = avgChange * trend.strength;
    }
    
    // Generate forecast points
    const forecast: ForecastDataPoint[] = [];
    const hourMs = 60 * 60 * 1000;
    
    for (let h = 1; h <= forecastHours; h++) {
      const timestamp = new Date(lastTimestamp.getTime() + h * hourMs);
      
      // Base prediction with trend
      let predicted = smoothedValue + trendComponent * h;
      
      // Add seasonality if detected
      if (trend.seasonality.detected && trend.seasonality.period && trend.seasonality.amplitude) {
        const seasonalPhase = (h % trend.seasonality.period) / trend.seasonality.period * 2 * Math.PI;
        const seasonalComponent = trend.seasonality.amplitude * Math.sin(seasonalPhase);
        predicted += seasonalComponent;
      }
      
      // Ensure non-negative prediction
      predicted = Math.max(0, predicted);
      
      // Calculate confidence interval
      const baseConfidence = this.config.confidenceLevel;
      const timeDecay = Math.exp(-h / (forecastHours / 2)); // Confidence decreases over time
      const confidence = baseConfidence * timeDecay * trend.confidence;
      
      // Calculate prediction interval
      const stdDev = this.calculateStandardDeviation(values);
      const margin = stdDev * (1 - confidence) * 2;
      
      forecast.push({
        timestamp,
        predicted,
        confidence,
        upperBound: predicted + margin,
        lowerBound: Math.max(0, predicted - margin)
      });
    }
    
    return forecast;
  }

  /**
   * Calculate standard deviation
   * @param values - Array of values
   * @returns Standard deviation
   */
  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Generate recommendations based on forecast
   * @param trend - Trend analysis
   * @param anomalies - Detected anomalies
   * @param forecast - Forecast points
   * @returns Array of recommendations
   */
  private generateRecommendations(
    trend: TrendAnalysis,
    anomalies: AnomalyDetection[],
    forecast: ForecastDataPoint[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Trend-based recommendations
    if (trend.direction === 'increasing' && trend.strength > 0.5) {
      recommendations.push(
        `📈 Error rate is increasing by ${trend.changeRate.toFixed(1)}% per hour. Consider investigating root causes.`
      );
      
      if (trend.confidence > 0.7) {
        recommendations.push(
          '🔍 High confidence trend detected. Recommend immediate investigation and potential scaling of error handling resources.'
        );
      }
    }
    
    if (trend.direction === 'decreasing' && trend.strength > 0.3) {
      recommendations.push(
        `📉 Error rate is decreasing by ${Math.abs(trend.changeRate).toFixed(1)}% per hour. Recent fixes may be taking effect.`
      );
    }
    
    // Seasonality recommendations
    if (trend.seasonality.detected) {
      recommendations.push(
        `🕐 Seasonal pattern detected with ${trend.seasonality.period}-hour cycle. Consider adjusting monitoring and alerting schedules.`
      );
    }
    
    // Anomaly-based recommendations
    const highSeverityAnomalies = anomalies.filter(a => a.severity === 'high');
    if (highSeverityAnomalies.length > 0) {
      recommendations.push(
        `⚠️ ${highSeverityAnomalies.length} high-severity anomalies detected. Investigate unusual error spikes.`
      );
    }
    
    // Forecast-based recommendations
    const maxPredicted = Math.max(...forecast.map(f => f.predicted));
    const avgPredicted = forecast.reduce((sum, f) => sum + f.predicted, 0) / forecast.length;
    
    if (maxPredicted > avgPredicted * 2) {
      recommendations.push(
        '📊 Forecast shows potential error spikes. Consider proactive monitoring and resource allocation.'
      );
    }
    
    const lowConfidencePoints = forecast.filter(f => f.confidence < 0.5).length;
    if (lowConfidencePoints > forecast.length * 0.5) {
      recommendations.push(
        '📉 Forecast confidence is low. Consider collecting more historical data for better predictions.'
      );
    }
    
    // Default recommendation if no specific issues
    if (recommendations.length === 0) {
      recommendations.push(
        '✅ Error patterns appear stable. Continue monitoring for any changes in trends.'
      );
    }
    
    return recommendations;
  }

  /**
   * Get historical data for forecasting
   * @param timeRange - Time range for data
   * @param options - Additional options
   * @returns Historical data points
   */
  private async getHistoricalData(
    timeRange: { from: Date; to: Date },
    options: {
      service?: string;
      severity?: ErrorSeverity;
    }
  ): Promise<Array<{ timestamp: Date; count: number }>> {
    try {
      const filters: any = timeRange;
      if (options.service) {
        filters.service = options.service;
      }
      if (options.severity) {
        filters.severity = options.severity;
      }
      
      const errors = await this.persistence.getErrors(filters);
      
      // Group errors by hour
      const hourlyData = new Map<number, number>();
      const hourMs = 60 * 60 * 1000;
      
      // Initialize all hours in range
      for (let time = timeRange.from.getTime(); time <= timeRange.to.getTime(); time += hourMs) {
        const hourKey = Math.floor(time / hourMs);
        hourlyData.set(hourKey, 0);
      }
      
      // Count errors per hour
      for (const error of errors) {
        const hourKey = Math.floor(error.timestamp.getTime() / hourMs);
        hourlyData.set(hourKey, (hourlyData.get(hourKey) || 0) + error.occurrenceCount);
      }
      
      // Convert to array format
      return Array.from(hourlyData.entries())
        .map(([hourKey, count]) => ({
          timestamp: new Date(hourKey * hourMs),
          count
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        
    } catch (error) {
      console.error('❌ Failed to get historical data:', error);
      return [];
    }
  }

  /**
   * Get default time range for forecasting
   * @returns Default time range (last 7 days)
   */
  private getDefaultTimeRange(): { from: Date; to: Date } {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { from: sevenDaysAgo, to: now };
  }

  /**
   * Generate cache key for forecast
   * @param options - Forecast options
   * @returns Cache key
   */
  private generateCacheKey(options: any): string {
    const parts = [
      options.service || 'all',
      options.severity || 'all',
      options.forecastHours || this.config.forecastHorizon,
      Math.floor(Date.now() / (15 * 60 * 1000)) // 15-minute buckets
    ];
    return parts.join('_');
  }

  /**
   * Get cached forecast if available
   * @param key - Cache key
   * @returns Cached forecast or null
   */
  private getCachedForecast(key: string): ForecastResult | null {
    const cached = this.forecastCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result;
    }
    return null;
  }

  /**
   * Cache forecast result
   * @param key - Cache key
   * @param result - Forecast result
   */
  private setCachedForecast(key: string, result: ForecastResult): void {
    this.forecastCache.set(key, {
      result,
      timestamp: Date.now()
    });
    
    // Clean up old cache entries
    setTimeout(() => {
      this.cleanupCache();
    }, this.CACHE_TTL);
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.forecastCache.entries()) {
      if (now - cached.timestamp >= this.CACHE_TTL) {
        this.forecastCache.delete(key);
      }
    }
  }

  /**
   * Merge with default configuration
   * @param config - Partial configuration
   * @returns Complete configuration
   */
  private mergeWithDefaultConfig(config: Partial<ForecastConfig>): ForecastConfig {
    const defaultConfig: ForecastConfig = {
      enabled: true,
      forecastHorizon: 24, // 24 hours
      confidenceLevel: 0.95, // 95% confidence
      minDataPoints: 24, // Minimum 24 data points (hours)
      anomalyThreshold: 2, // 2 standard deviations
      seasonalityDetection: true,
      trendSmoothingFactor: 0.3 // Exponential smoothing alpha
    };
    
    return { ...defaultConfig, ...config };
  }

  /**
   * Update configuration
   * @param newConfig - New configuration
   */
  updateConfig(newConfig: Partial<ForecastConfig>): void {
    this.config = this.mergeWithDefaultConfig({
      ...this.config,
      ...newConfig
    });
  }

  /**
   * Get current configuration
   * @returns Current configuration
   */
  getConfig(): ForecastConfig {
    return { ...this.config };
  }

  /**
   * Get forecast summary for dashboard
   * @param services - Optional list of services to include
   * @returns Promise that resolves to forecast summary
   */
  async getForecastSummary(services?: string[]): Promise<{
    overallTrend: TrendAnalysis;
    criticalForecasts: ForecastResult[];
    anomalyCount: number;
    recommendations: string[];
  }> {
    try {
      const forecasts: ForecastResult[] = [];
      
      if (services && services.length > 0) {
        for (const service of services) {
          const serviceForecasts = await this.generateForecast({ service });
          forecasts.push(...serviceForecasts);
        }
      } else {
        const allForecasts = await this.generateForecast();
        forecasts.push(...allForecasts);
      }
      
      // Calculate overall trend
      const overallTrend = this.calculateOverallTrend(forecasts);
      
      // Find critical forecasts
      const criticalForecasts = forecasts.filter(f => 
        f.trend.direction === 'increasing' && f.trend.strength > 0.5
      );
      
      // Count anomalies
      const anomalyCount = forecasts.reduce((sum, f) => sum + f.anomalies.length, 0);
      
      // Aggregate recommendations
      const allRecommendations = forecasts.flatMap(f => f.recommendations);
      const uniqueRecommendations = Array.from(new Set(allRecommendations));
      
      return {
        overallTrend,
        criticalForecasts,
        anomalyCount,
        recommendations: uniqueRecommendations
      };
      
    } catch (error) {
      console.error('❌ Failed to get forecast summary:', error);
      throw error;
    }
  }

  /**
   * Calculate overall trend from multiple forecasts
   * @param forecasts - Array of forecast results
   * @returns Overall trend analysis
   */
  private calculateOverallTrend(forecasts: ForecastResult[]): TrendAnalysis {
    if (forecasts.length === 0) {
      return {
        direction: 'stable',
        strength: 0,
        confidence: 0,
        changeRate: 0,
        seasonality: { detected: false }
      };
    }
    
    // Weight trends by confidence
    let weightedDirection = 0;
    let totalWeight = 0;
    let avgChangeRate = 0;
    let seasonalityDetected = false;
    
    for (const forecast of forecasts) {
      const weight = forecast.trend.confidence;
      totalWeight += weight;
      
      const directionValue = forecast.trend.direction === 'increasing' ? 1 : 
                           forecast.trend.direction === 'decreasing' ? -1 : 0;
      weightedDirection += directionValue * forecast.trend.strength * weight;
      avgChangeRate += forecast.trend.changeRate * weight;
      
      if (forecast.trend.seasonality.detected) {
        seasonalityDetected = true;
      }
    }
    
    if (totalWeight > 0) {
      weightedDirection /= totalWeight;
      avgChangeRate /= totalWeight;
    }
    
    const direction = weightedDirection > 0.1 ? 'increasing' : 
                     weightedDirection < -0.1 ? 'decreasing' : 'stable';
    const strength = Math.abs(weightedDirection);
    const confidence = totalWeight / forecasts.length;
    
    return {
      direction,
      strength,
      confidence,
      changeRate: avgChangeRate,
      seasonality: { detected: seasonalityDetected }
    };
  }
}