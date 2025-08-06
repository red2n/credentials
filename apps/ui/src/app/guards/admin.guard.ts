import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  canActivate(): boolean {
    // During SSR, sessionStorage is not available, so we allow navigation
    // The client-side will handle the actual authentication check
    if (!isPlatformBrowser(this.platformId)) {
      return true;
    }

    if (this.isAdminAuthenticated()) {
      return true;
    } else {
      this.router.navigate(['/admin/login']);
      return false;
    }
  }

  private isAdminAuthenticated(): boolean {
    // Only check authentication on the browser
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const adminKey = sessionStorage.getItem('adminKey');
    const loginTime = sessionStorage.getItem('adminLoginTime');

    if (!adminKey || !loginTime) {
      return false;
    }

    // Check if session is still valid (30 minutes)
    const thirtyMinutes = 30 * 60 * 1000;
    const currentTime = Date.now();
    const sessionTime = parseInt(loginTime, 10);

    if (currentTime - sessionTime > thirtyMinutes) {
      // Session expired, clear storage
      sessionStorage.removeItem('adminKey');
      sessionStorage.removeItem('adminLoginTime');
      return false;
    }

    // Valid admin key and session not expired
    return adminKey === 'admin123';
  }
}
