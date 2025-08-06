import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface AdminUser {
  username: string;
  email?: string;
  createdAt: Date | string;
  lastLogin?: Date | string;
  isActive: boolean;
}

export interface AdminUserListResponse {
  users: AdminUser[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  message: string;
}

export interface AdminStats {
  totalUsers: number;
  usersWithLastLogin: number;
  averageUsernameLength: number;
  memoryUsage: number;
  recentUsers24h: number;
  activeUsersWeek: number;
  userGrowthToday: number;
  systemHealth: string;
  message: string;
}

export interface AdminDeleteResponse {
  success: boolean;
  message: string;
  user: {
    username: string;
    email?: string;
    deactivatedAt: Date | string;
  };
}

export interface AdminBulkDeleteResponse {
  results: {
    success: string[];
    failed: string[];
    notFound: string[];
  };
  summary: {
    total: number;
    successful: number;
    failed: number;
    notFound: number;
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private baseUrl = environment.apiUrl;

  constructor() {}

  private getAdminHeaders(): HttpHeaders {
    // In a real application, you'd use a JWT token
    // For this demo, we'll use a simple admin key
    let adminKey: string | null = null;

    if (isPlatformBrowser(this.platformId)) {
      adminKey = sessionStorage.getItem('adminKey');
    }

    if (!adminKey) {
      throw new Error('No admin session found. Please login again.');
    }

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey
    });
  }

  private handleError = (error: any): Observable<never> => {
    console.error('Admin Service Error:', error);

    let errorMessage = 'An unknown error occurred';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return throwError(() => errorMessage);
  };

  /**
   * Get list of users with pagination and search
   */
  getUsers(page: number = 1, limit: number = 50, search: string = ''): Observable<AdminUserListResponse> {
    const params: any = { page: page.toString(), limit: limit.toString() };
    if (search) {
      params.search = search;
    }

    return this.http.get<AdminUserListResponse>(`${this.baseUrl}/admin/users`, {
      headers: this.getAdminHeaders(),
      params
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get specific user details
   */
  getUser(username: string): Observable<{ user: AdminUser; message: string }> {
    return this.http.get<{ user: AdminUser; message: string }>(`${this.baseUrl}/admin/users/${username}`, {
      headers: this.getAdminHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Delete/deactivate a user
   */
  deleteUser(username: string): Observable<AdminDeleteResponse> {
    return this.http.delete<AdminDeleteResponse>(`${this.baseUrl}/admin/users/${username}`, {
      headers: this.getAdminHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Bulk delete/deactivate multiple users
   */
  bulkDeleteUsers(usernames: string[]): Observable<AdminBulkDeleteResponse> {
    return this.http.post<AdminBulkDeleteResponse>(`${this.baseUrl}/admin/users/bulk-deactivate`, {
      usernames
    }, {
      headers: this.getAdminHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get admin dashboard statistics
   */
  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.baseUrl}/admin/stats`, {
      headers: this.getAdminHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Test admin authentication
   */
  testAuth(): Observable<boolean> {
    return this.http.get(`${this.baseUrl}/admin/stats`, {
      headers: this.getAdminHeaders()
    }).pipe(
      map(() => true),
      catchError((error) => {
        if (error.status === 401) {
          return throwError(() => 'Unauthorized');
        }
        return throwError(() => 'Connection error');
      })
    );
  }
}
