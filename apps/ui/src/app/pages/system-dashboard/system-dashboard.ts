import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SystemService, SystemMonitoringData, RedisHealthData, RedisStatsData, CacheAnalysisData } from '../../services/system.service';

@Component({
  selector: 'app-system-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <!-- Header -->
        <div class="mb-8">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">System Dashboard</h1>
              <p class="text-gray-600 mt-1">Real-time Redis monitoring and cache management</p>
            </div>
            <div class="flex space-x-3">
              <button
                (click)="refreshData()"
                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                [disabled]="isRefreshing()"
              >
                {{ isRefreshing() ? 'Refreshing...' : 'Refresh Now' }}
              </button>
              <button
                (click)="goToAdminDashboard()"
                class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Admin Dashboard
              </button>
            </div>
          </div>

          <!-- Status Indicator -->
          <div class="mt-4 flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 rounded-full" [class]="getStatusColor()"></div>
              <span class="text-sm font-medium">{{ getSystemStatus() }}</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 rounded-full" [class]="pollingActive() ? 'bg-green-500' : 'bg-gray-500'"></div>
              <span class="text-sm text-gray-600">Auto-refresh {{ pollingActive() ? 'ON' : 'OFF' }}</span>
            </div>
            <div class="text-sm text-gray-500">
              Last updated: {{ getLastUpdateTime() }}
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="!systemData() && !error()" class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p class="text-gray-600">Loading system data...</p>
        </div>

        <!-- Error State -->
        <div *ngIf="error()" class="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <div class="flex items-center">
            <div class="text-red-500 text-xl mr-3">⚠️</div>
            <div>
              <h3 class="text-lg font-semibold text-red-900">Error Loading System Data</h3>
              <p class="text-red-700 mt-1">{{ error() }}</p>
              <button
                (click)="refreshData()"
                class="mt-3 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>

        <!-- System Data -->
        <div *ngIf="systemData() && !error()">

          <!-- Redis Health Card -->
          <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900">Redis Health</h3>
                <div class="w-4 h-4 rounded-full" [class]="getHealthStatusColor()"></div>
              </div>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-gray-600">Status:</span>
                  <span class="font-medium" [class]="getHealthStatusTextColor()">
                    {{ getHealthStatus() }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Latency:</span>
                  <span class="font-medium">{{ getLatency() }}ms</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Uptime:</span>
                  <span class="font-medium">{{ getUptimeFormatted() }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Version:</span>
                  <span class="font-medium">{{ getRedisVersion() }}</span>
                </div>
              </div>
            </div>

            <!-- Memory Usage Card -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Memory Usage</h3>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-gray-600">Used:</span>
                  <span class="font-medium">{{ getMemoryUsed() }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Max:</span>
                  <span class="font-medium">{{ getMemoryMax() }}</span>
                </div>
                <div class="mt-4">
                  <div class="flex justify-between text-sm mb-1">
                    <span class="text-gray-600">Usage</span>
                    <span class="font-medium">{{ getMemoryPercentage() }}%</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                      class="h-2 rounded-full transition-all duration-300"
                      [class]="getMemoryBarColor()"
                      [style.width.%]="getMemoryPercentage()"
                    ></div>
                  </div>
                </div>
                <div *ngIf="isMemoryUnderPressure()" class="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                  <div class="flex items-center text-red-700">
                    <span class="text-lg mr-2">⚠️</span>
                    <span class="text-sm font-medium">Memory under pressure</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Performance Stats Card -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-gray-600">Commands/sec:</span>
                  <span class="font-medium">{{ getOpsPerSecond() }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Hit Rate:</span>
                  <span class="font-medium">{{ getHitRate() }}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Connections:</span>
                  <span class="font-medium">{{ getConnections() }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Total Keys:</span>
                  <span class="font-medium">{{ getTotalKeys() }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Cache Analysis -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-lg font-semibold text-gray-900">Cache Analysis</h3>
              <div class="text-sm text-gray-500">{{ getTotalKeys() }} total keys</div>
            </div>

            <div *ngIf="getCachePatterns().length === 0" class="text-center py-8 text-gray-500">
              No cache patterns found
            </div>

            <div *ngIf="getCachePatterns().length > 0" class="space-y-4">
              <div *ngFor="let pattern of getCachePatterns()" class="border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between items-center mb-2">
                  <span class="font-medium text-gray-900">{{ pattern.pattern }}</span>
                  <span class="text-sm text-gray-600">{{ pattern.count }} keys</span>
                </div>
                <div class="text-sm text-gray-500">
                  Examples: {{ pattern.examples.slice(0, 3).join(', ') }}
                  <span *ngIf="pattern.examples.length > 3">...</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Cache Management -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-6">Cache Management</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Clear by Pattern -->
              <div class="border border-gray-200 rounded-lg p-4">
                <h4 class="font-medium text-gray-900 mb-3">Clear by Pattern</h4>
                <div class="space-y-3">
                  <input
                    type="text"
                    placeholder="e.g., user:*, session:*"
                    [(ngModel)]="clearPattern"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                  <button
                    (click)="clearCacheByPattern()"
                    [disabled]="!clearPattern || isClearing()"
                    class="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {{ isClearing() ? 'Clearing...' : 'Clear Pattern' }}
                  </button>
                </div>
              </div>

              <!-- Clear All -->
              <div class="border border-red-200 rounded-lg p-4 bg-red-50">
                <h4 class="font-medium text-red-900 mb-3">Danger Zone</h4>
                <p class="text-sm text-red-700 mb-3">This will clear ALL cache data. This action cannot be undone.</p>
                <button
                  (click)="clearAllCache()"
                  [disabled]="isClearing()"
                  class="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {{ isClearing() ? 'Clearing...' : 'Clear All Cache' }}
                </button>
              </div>
            </div>

            <!-- Success/Error Messages -->
            <div *ngIf="cacheMessage()" class="mt-4 p-4 rounded-lg" [class]="getCacheMessageClass()">
              {{ cacheMessage() }}
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SystemDashboardComponent implements OnInit, OnDestroy {
  systemData = signal<SystemMonitoringData | null>(null);
  error = signal<string | null>(null);
  isRefreshing = signal<boolean>(false);
  pollingActive = signal<boolean>(false);

  // Cache management
  clearPattern = '';
  isClearing = signal<boolean>(false);
  cacheMessage = signal<string>('');

  private subscription?: Subscription;
  private pollingSubscription?: Subscription;

  constructor(
    private systemService: SystemService,
    private router: Router
  ) {}

  ngOnInit() {
    // Subscribe to system data
    this.subscription = this.systemService.systemData$.subscribe({
      next: (data) => {
        this.systemData.set(data);
        this.error.set(null);
      },
      error: (err) => {
        this.error.set(err);
      }
    });

    // Subscribe to polling status
    this.pollingSubscription = this.systemService.pollingActive$.subscribe({
      next: (active) => {
        this.pollingActive.set(active);
      }
    });

    // Start polling
    this.systemService.startPolling();
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.pollingSubscription?.unsubscribe();
    this.systemService.stopPolling();
  }

  refreshData() {
    this.isRefreshing.set(true);
    this.systemService.refreshSystemData().subscribe({
      next: (data) => {
        this.systemData.set(data);
        this.error.set(null);
        this.isRefreshing.set(false);
      },
      error: (err) => {
        this.error.set(err);
        this.isRefreshing.set(false);
      }
    });
  }

  goToAdminDashboard() {
    this.router.navigate(['/admin/dashboard']);
  }

  // Helper methods for template
  getSystemStatus(): string {
    const data = this.systemData();
    if (!data) return 'Unknown';

    switch (data.health.status) {
      case 'healthy': return 'Healthy';
      case 'degraded': return 'Degraded';
      case 'unhealthy': return 'Unhealthy';
      default: return 'Unknown';
    }
  }

  getStatusColor(): string {
    const data = this.systemData();
    if (!data) return 'bg-gray-500';

    switch (data.health.status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'unhealthy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }

  getHealthStatus(): string {
    return this.systemData()?.health.status.toUpperCase() || 'UNKNOWN';
  }

  getHealthStatusColor(): string {
    return this.getStatusColor();
  }

  getHealthStatusTextColor(): string {
    const data = this.systemData();
    if (!data) return 'text-gray-500';

    switch (data.health.status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-500';
    }
  }

  getLatency(): number {
    return this.systemData()?.health.latency || 0;
  }

  getUptimeFormatted(): string {
    const uptime = this.systemData()?.health.uptime || 0;
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  getRedisVersion(): string {
    return this.systemData()?.health.version || 'Unknown';
  }

  getMemoryUsed(): string {
    const used = this.systemData()?.health.memory.used || 0;
    return this.formatBytes(used);
  }

  getMemoryMax(): string {
    const max = this.systemData()?.health.memory.max || 0;
    return max > 0 ? this.formatBytes(max) : 'Unlimited';
  }

  getMemoryPercentage(): number {
    return this.systemData()?.health.memory.percentage || 0;
  }

  getMemoryBarColor(): string {
    const percentage = this.getMemoryPercentage();
    if (percentage > 80) return 'bg-red-500';
    if (percentage > 60) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  isMemoryUnderPressure(): boolean {
    return this.systemData()?.health.memory.isUnderPressure || false;
  }

  getOpsPerSecond(): number {
    return this.systemData()?.stats.opsPerSecond || 0;
  }

  getHitRate(): number {
    return this.systemData()?.stats.hitRate || 0;
  }

  getConnections(): number {
    return this.systemData()?.stats.connections || 0;
  }

  getTotalKeys(): number {
    return this.systemData()?.analysis.totalKeys || 0;
  }

  getCachePatterns(): Array<{pattern: string; count: number; examples: string[]}> {
    return this.systemData()?.analysis.patterns || [];
  }

  getLastUpdateTime(): string {
    const timestamp = this.systemData()?.timestamp;
    if (!timestamp) return 'Never';

    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  }

  // Cache management methods
  clearCacheByPattern() {
    if (!this.clearPattern) return;

    this.isClearing.set(true);
    this.cacheMessage.set('');

    this.systemService.clearCacheByPattern(this.clearPattern).subscribe({
      next: (response) => {
        this.cacheMessage.set(`Successfully cleared ${response.data.deletedCount} cache entries`);
        this.clearPattern = '';
        this.isClearing.set(false);
        // Refresh data to show updated cache state
        this.refreshData();
      },
      error: (err) => {
        this.cacheMessage.set(`Error: ${err}`);
        this.isClearing.set(false);
      }
    });
  }

  clearAllCache() {
    if (!confirm('Are you sure you want to clear ALL cache data? This action cannot be undone.')) {
      return;
    }

    this.isClearing.set(true);
    this.cacheMessage.set('');

    this.systemService.clearAllCache().subscribe({
      next: (response) => {
        this.cacheMessage.set('All cache data cleared successfully');
        this.isClearing.set(false);
        // Refresh data to show updated cache state
        this.refreshData();
      },
      error: (err) => {
        this.cacheMessage.set(`Error: ${err}`);
        this.isClearing.set(false);
      }
    });
  }

  getCacheMessageClass(): string {
    const message = this.cacheMessage();
    if (message.includes('Error')) {
      return 'bg-red-50 border border-red-200 text-red-700';
    }
    return 'bg-green-50 border border-green-200 text-green-700';
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
