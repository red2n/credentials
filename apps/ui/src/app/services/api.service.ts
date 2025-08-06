import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UsernameValidationResponse {
  username: string;
  mightExist: boolean;
  message: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    username: string;
    email: string;
    lastLogin?: Date;
    createdAt: Date;
  };
}

export interface UserExistsResponse {
  username: string;
  exists: boolean;
  message: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl || 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  /**
   * Validate username using Bloom filter
   */
  validateUsername(username: string): Observable<UsernameValidationResponse> {
    return this.http.post<UsernameValidationResponse>(`${this.baseUrl}/username/validate`, {
      username
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Check if user exists (fast in-memory lookup)
   */
  checkUserExists(username: string): Observable<UserExistsResponse> {
    return this.http.get<UserExistsResponse>(`${this.baseUrl}/auth/check/${username}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Authenticate user
   */
  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, {
      username,
      password
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Register new user
   */
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, data).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get user profile
   */
  getUserProfile(username: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/auth/profile/${username}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get database statistics
   */
  getDatabaseStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/auth/stats`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get random usernames for testing
   */
  getRandomUsernames(count: number = 10): Observable<any> {
    return this.http.get(`${this.baseUrl}/auth/random/${count}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Populate Bloom filter from database
   */
  populateBloomFilter(): Observable<any> {
    return this.http.post(`${this.baseUrl}/username/populate`, {}).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get Bloom filter statistics
   */
  getBloomFilterStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/username/stats`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get Redis health status
   */
  getRedisHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/username/cache/health`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any) {
    console.error('API Error:', error);

    let errorMessage = 'An unexpected error occurred';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => errorMessage);
  }
}
