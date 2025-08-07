import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer, switchMap, catchError, throwError, BehaviorSubject, startWith } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RedisHealthData {
  status: 'healthy' | 'unhealthy' | 'degraded';
  connected: boolean;
  latency: number;
  memory: {
    used: number;
    max: number;
    percentage: number;
    isUnderPressure: boolean;
  };
  keyCount: number;
  uptime: number;
  version: string;
  errors: string[];
}

export interface RedisStatsData {
  connections: number;
  commandsProcessed: number;
  opsPerSecond: number;
  hitRate: number;
  evictedKeys: number;
  expiredKeys: number;
}

export interface CacheAnalysisData {
  totalKeys: number;
  patterns: Array<{
    pattern: string;
    count: number;
    examples: string[];
  }>;
}

export interface SystemMonitoringData {
  health: RedisHealthData;
  stats: RedisStatsData;
  analysis: CacheAnalysisData;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  error?: string;
  details?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SystemService {
  private readonly baseUrl = environment.apiUrl || 'http://localhost:3000/api';
  private readonly redisUrl = `${this.baseUrl}/redis`;

  // BehaviorSubject to hold the latest system data
  private systemDataSubject = new BehaviorSubject<SystemMonitoringData | null>(null);
  public systemData$ = this.systemDataSubject.asObservable();

  // BehaviorSubject to track polling status
  private pollingActiveSubject = new BehaviorSubject<boolean>(false);
  public pollingActive$ = this.pollingActiveSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Start automatic polling for system data every 2 minutes
   */
  startPolling(): void {
    if (this.pollingActiveSubject.value) {
      return; // Already polling
    }

    this.pollingActiveSubject.next(true);

    // Create a timer that emits every 2 minutes (120000ms)
    timer(0, 120000).pipe(
      switchMap(() => this.fetchAllSystemData()),
      catchError(error => {
        console.error('System polling error:', error);
        // Continue polling even if there's an error
        return timer(5000).pipe(switchMap(() => this.fetchAllSystemData()));
      })
    ).subscribe({
      next: (data) => {
        this.systemDataSubject.next(data);
      },
      error: (error) => {
        console.error('System polling subscription error:', error);
        this.pollingActiveSubject.next(false);
      }
    });
  }

  /**
   * Stop automatic polling
   */
  stopPolling(): void {
    this.pollingActiveSubject.next(false);
  }

  /**
   * Fetch all system monitoring data
   */
  private fetchAllSystemData(): Observable<SystemMonitoringData> {
    return new Observable(observer => {
      const healthPromise = this.getRedisHealth().toPromise();
      const statsPromise = this.getRedisStats().toPromise();
      const analysisPromise = this.getCacheAnalysis().toPromise();

      Promise.all([healthPromise, statsPromise, analysisPromise]).then(([healthResponse, statsResponse, analysisResponse]) => {
        if (!healthResponse || !statsResponse || !analysisResponse) {
          observer.error('Failed to fetch system data');
          return;
        }

        const systemData: SystemMonitoringData = {
          health: healthResponse.data,
          stats: statsResponse.data,
          analysis: analysisResponse.data,
          timestamp: new Date().toISOString()
        };
        observer.next(systemData);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Get Redis health status
   */
  getRedisHealth(): Observable<ApiResponse<RedisHealthData>> {
    return this.http.get<ApiResponse<RedisHealthData>>(`${this.redisUrl}/health`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get Redis statistics
   */
  getRedisStats(): Observable<ApiResponse<RedisStatsData>> {
    return this.http.get<ApiResponse<RedisStatsData>>(`${this.redisUrl}/stats`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get cache analysis
   */
  getCacheAnalysis(): Observable<ApiResponse<CacheAnalysisData>> {
    return this.http.get<ApiResponse<CacheAnalysisData>>(`${this.redisUrl}/cache/analysis`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Clear cache by pattern
   */
  clearCacheByPattern(pattern: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.redisUrl}/cache/clear/${pattern}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Clear all cache (admin only)
   */
  clearAllCache(): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.redisUrl}/cache/clear-all`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get current system data (latest cached)
   */
  getCurrentSystemData(): SystemMonitoringData | null {
    return this.systemDataSubject.value;
  }

  /**
   * Force refresh system data
   */
  refreshSystemData(): Observable<SystemMonitoringData> {
    return this.fetchAllSystemData().pipe(
      switchMap(data => {
        this.systemDataSubject.next(data);
        return [data];
      })
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any) {
    console.error('System API Error:', error);

    let errorMessage = 'An unexpected error occurred';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => errorMessage);
  }
}
