import { Component, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-login">
      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <div class="admin-logo">
              <span class="logo-icon">🛡️</span>
              <h1>Admin Portal</h1>
            </div>
            <p>Secure access to admin dashboard</p>
          </div>

          @if (errorMessage()) {
            <div class="error-banner">
              <span class="error-icon">⚠️</span>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <form (ngSubmit)="onLogin()" class="login-form">
            <div class="form-group">
              <label for="adminKey" class="form-label">
                <span class="label-icon">🔑</span>
                Admin Access Key
              </label>
              <input
                id="adminKey"
                type="password"
                [(ngModel)]="adminKey"
                name="adminKey"
                class="form-input"
                placeholder="Enter your admin access key"
                required
                [disabled]="isLoading()"
              >
            </div>

            <button
              type="submit"
              class="login-btn"
              [disabled]="isLoading() || !adminKey.trim()"
            >
              @if (isLoading()) {
                <span class="spinner"></span>
                Verifying...
              } @else {
                <span class="btn-icon">🚪</span>
                Access Dashboard
              }
            </button>
          </form>

          <div class="login-footer">
            <p>
              <span class="footer-icon">ℹ️</span>
              This is a secure admin area. Only authorized personnel may access.
            </p>
            <button
              type="button"
              class="back-btn"
              (click)="goBack()"
            >
              ← Back to Main App
            </button>
          </div>
        </div>

        <div class="security-notice">
          <div class="notice-content">
            <h3>
              <span class="notice-icon">🔒</span>
              Security Notice
            </h3>
            <ul>
              <li>This admin portal requires a valid access key</li>
              <li>All actions are logged and monitored</li>
              <li>Unauthorized access attempts will be reported</li>
              <li>Session will expire after 30 minutes of inactivity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./admin-login.scss']
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
