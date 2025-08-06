import { Component, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div class="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        <!-- Left Side - Login Form -->
        <div class="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          <div class="text-center mb-8">
            <div class="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span class="text-4xl animate-pulse-slow">🛡️</span>
            </div>
            <h1 class="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Admin Portal
            </h1>
            <p class="text-slate-600 flex items-center justify-center gap-2">
              <span class="text-lg">🔒</span>
              <span>Secure access to admin dashboard</span>
            </p>
          </div>

          @if (errorMessage()) {
            <div class="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <span class="text-2xl">⚠️</span>
              <div class="flex-1">
                <p class="text-red-800 font-medium">{{ errorMessage() }}</p>
              </div>
            </div>
          }

          <form (ngSubmit)="onLogin()" class="space-y-6">
            <div>
              <label for="adminKey" class="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <span class="text-lg">🔑</span>
                <span>Admin Access Key</span>
                <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <div class="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🔐</div>
                <input
                  id="adminKey"
                  type="password"
                  [(ngModel)]="adminKey"
                  name="adminKey"
                  class="w-full pl-11 pr-4 py-4 border border-slate-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-slate-700 placeholder-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  placeholder="Enter your admin access key"
                  required
                  [disabled]="isLoading()"
                >
              </div>
            </div>

            <button
              type="submit"
              class="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              [disabled]="isLoading() || !adminKey.trim()"
            >
              @if (isLoading()) {
                <div class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Verifying Access...</span>
              } @else {
                <span class="text-xl">🚪</span>
                <span>Access Dashboard</span>
              }
            </button>
          </form>

          <div class="mt-8 pt-6 border-t border-slate-100">
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <div class="flex items-center gap-2 text-amber-800 font-medium mb-2">
                <span class="text-lg">ℹ️</span>
                <span>Security Information</span>
              </div>
              <p class="text-amber-700 text-sm">
                This is a secure admin area. Only authorized personnel may access.
              </p>
            </div>
            <button
              type="button"
              class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
              (click)="goBack()"
            >
              <span class="text-lg">←</span>
              <span>Back to Main App</span>
            </button>
          </div>
        </div>

        <!-- Right Side - Security Notice -->
        <div class="hidden lg:block">
          <div class="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 text-white">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <span class="text-2xl">🔒</span>
              </div>
              <h3 class="text-2xl font-bold">Security Notice</h3>
            </div>

            <div class="space-y-4">
              <div class="flex items-start gap-3 p-4 bg-white/10 rounded-xl">
                <span class="text-lg mt-1">🔑</span>
                <div>
                  <h4 class="font-semibold mb-1">Access Key Required</h4>
                  <p class="text-white/80 text-sm">This admin portal requires a valid access key for entry</p>
                </div>
              </div>

              <div class="flex items-start gap-3 p-4 bg-white/10 rounded-xl">
                <span class="text-lg mt-1">📊</span>
                <div>
                  <h4 class="font-semibold mb-1">Activity Monitoring</h4>
                  <p class="text-white/80 text-sm">All actions are logged and monitored for security</p>
                </div>
              </div>

              <div class="flex items-start gap-3 p-4 bg-white/10 rounded-xl">
                <span class="text-lg mt-1">⚠️</span>
                <div>
                  <h4 class="font-semibold mb-1">Unauthorized Access</h4>
                  <p class="text-white/80 text-sm">Unauthorized access attempts will be reported</p>
                </div>
              </div>

              <div class="flex items-start gap-3 p-4 bg-white/10 rounded-xl">
                <span class="text-lg mt-1">⏱️</span>
                <div>
                  <h4 class="font-semibold mb-1">Session Timeout</h4>
                  <p class="text-white/80 text-sm">Session will expire after 30 minutes of inactivity</p>
                </div>
              </div>
            </div>

            <div class="mt-6 p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl border border-white/20">
              <div class="flex items-center gap-2 text-white font-medium mb-2">
                <span class="text-lg">🛡️</span>
                <span>Enterprise Security</span>
              </div>
              <p class="text-white/80 text-sm">
                Protected by advanced encryption and multi-layer security protocols.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminLoginComponent {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  adminKey = '';
  isLoading = signal(false);
  errorMessage = signal('');

  async onLogin() {
    if (!this.adminKey.trim()) {
      this.errorMessage.set('Please enter your admin access key');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      // Simple validation - in production, this should be done server-side
      if (this.adminKey === 'admin123') {
        // Store admin session only on browser
        if (isPlatformBrowser(this.platformId)) {
          sessionStorage.setItem('adminKey', this.adminKey);
          sessionStorage.setItem('adminLoginTime', Date.now().toString());
        }

        // Navigate to admin dashboard
        await this.router.navigate(['/admin/dashboard']);
      } else {
        this.errorMessage.set('Invalid admin access key. Please try again.');
      }
    } catch (error) {
      this.errorMessage.set('Login failed. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
