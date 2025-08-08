import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemService, SystemMetricsData, ApiResponse } from '../services/system.service';
import { Subscription, interval, startWith, switchMap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="bg-white border-t border-slate-200 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
          <!-- Left side - App info -->
          <div class="flex items-center gap-4 text-sm text-slate-600">
            <span class="font-medium">Credentials Manager</span>
            <span class="text-slate-400">•</span>
            <span>© 2025</span>
          </div>

          <!-- Center - System Status -->
          @if (systemMetrics()) {
            <div class="flex items-center gap-6 text-xs">
              <!-- Status Indicator -->
              <div class="flex items-center gap-2">
                <div [class]="getStatusIndicatorClass()"></div>
                <span class="font-medium text-slate-700">{{ getStatusText() }}</span>
              </div>

              <!-- Uptime -->
              <div class="flex items-center gap-1 text-slate-600">
                <span class="text-green-600">⏱️</span>
                <span>{{ formatUptime(systemMetrics()!.uptime) }}</span>
              </div>

              <!-- Memory Usage -->
              <div class="flex items-center gap-1 text-slate-600">
                <span class="text-blue-600">💾</span>
                <span>{{ systemMetrics()!.memory.heapUsed }}MB</span>
              </div>

              <!-- User Count -->
              <div class="flex items-center gap-1 text-slate-600">
                <span class="text-purple-600">👥</span>
                <span>{{ systemMetrics()!.users.toLocaleString() }} users</span>
              </div>

              <!-- Last Updated -->
              <div class="flex items-center gap-1 text-slate-500">
                <span>🔄</span>
                <span>{{ getLastUpdateTime() }}</span>
              </div>
            </div>
          } @else if (isLoading()) {
            <div class="flex items-center gap-2 text-xs text-slate-500">
              <div class="w-3 h-3 border border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span>Loading system status...</span>
            </div>
          } @else if (hasError()) {
            <div class="flex items-center gap-2 text-xs text-red-600">
              <span>⚠️</span>
              <span>System status unavailable</span>
            </div>
          }

          <!-- Right side - Links -->
          <div class="flex items-center gap-4 text-sm">
            <a href="/admin/login" class="text-slate-600 hover:text-purple-600 transition-colors">
              Admin
            </a>
            <span class="text-slate-400">•</span>
            <button
              (click)="refreshStatus()"
              class="text-slate-600 hover:text-blue-600 transition-colors"
              [disabled]="isRefreshing()"
            >
              {{ isRefreshing() ? '🔄' : '🔄' }} Refresh
            </button>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    .status-healthy {
      background-color: #10b981;
      box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
    }

    .status-degraded {
      background-color: #f59e0b;
      box-shadow: 0 0 6px rgba(245, 158, 11, 0.6);
    }

    .status-error {
      background-color: #ef4444;
      box-shadow: 0 0 6px rgba(239, 68, 68, 0.6);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `]
})
export class FooterComponent implements OnInit, OnDestroy {
  systemMetrics = signal<SystemMetricsData | null>(null);
  isLoading = signal<boolean>(true);
  hasError = signal<boolean>(false);
  isRefreshing = signal<boolean>(false);

  private subscription?: Subscription;
  private lastUpdateTime = signal<Date>(new Date());

  constructor(private systemService: SystemService) {}

  ngOnInit(): void {
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private startPolling(): void {
    // Poll every 30 seconds
    this.subscription = interval(30000).pipe(
      startWith(0),
      switchMap(() => this.systemService.getSystemMetrics()),
      catchError(error => {
        console.warn('System metrics polling error:', error);
        this.hasError.set(true);
        return of(null);
      })
    ).subscribe(response => {
      if (response && response.success) {
        this.systemMetrics.set(response.data);
        this.hasError.set(false);
        this.lastUpdateTime.set(new Date());
      } else {
        this.hasError.set(true);
      }
      this.isLoading.set(false);
      this.isRefreshing.set(false);
    });
  }

  refreshStatus(): void {
    if (this.isRefreshing()) return;

    this.isRefreshing.set(true);
    this.systemService.getSystemMetrics().pipe(
      catchError(error => {
        console.warn('Manual refresh error:', error);
        this.hasError.set(true);
        return of(null);
      })
    ).subscribe(response => {
      if (response && response.success) {
        this.systemMetrics.set(response.data);
        this.hasError.set(false);
        this.lastUpdateTime.set(new Date());
      } else {
        this.hasError.set(true);
      }
      this.isRefreshing.set(false);
    });
  }

  getStatusIndicatorClass(): string {
    const metrics = this.systemMetrics();
    if (!metrics) return 'status-indicator status-error';

    const memoryUsagePercent = (metrics.memory.heapUsed / metrics.memory.heapTotal) * 100;

    if (memoryUsagePercent < 70) {
      return 'status-indicator status-healthy';
    } else if (memoryUsagePercent < 85) {
      return 'status-indicator status-degraded';
    } else {
      return 'status-indicator status-error';
    }
  }

  getStatusText(): string {
    const metrics = this.systemMetrics();
    if (!metrics) return 'Offline';

    const memoryUsagePercent = (metrics.memory.heapUsed / metrics.memory.heapTotal) * 100;

    if (memoryUsagePercent < 70) {
      return 'Healthy';
    } else if (memoryUsagePercent < 85) {
      return 'Degraded';
    } else {
      return 'High Load';
    }
  }

  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  getLastUpdateTime(): string {
    const now = new Date();
    const diff = Math.floor((now.getTime() - this.lastUpdateTime().getTime()) / 1000);

    if (diff < 60) {
      return 'just now';
    } else if (diff < 3600) {
      return `${Math.floor(diff / 60)}m ago`;
    } else {
      return `${Math.floor(diff / 3600)}h ago`;
    }
  }
}
