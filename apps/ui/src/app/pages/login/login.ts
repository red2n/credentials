import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html'
})
export class LoginComponent implements OnInit {
  username = signal('');
  password = signal('');
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    // Check for query parameters (from registration redirect)
    this.route.queryParams.subscribe(params => {
      if (params['message']) {
        this.successMessage.set(params['message']);
      }
      if (params['username']) {
        this.username.set(params['username']);
      }
    });
  }

  onUsernameChange(value: string) {
    this.username.set(value);
    this.errorMessage.set('');
  }

  onPasswordChange(value: string) {
    this.password.set(value);
    this.errorMessage.set('');
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  async onSubmit() {
    if (!this.username() || !this.password()) {
      this.errorMessage.set('Please fill in all fields');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const response = await this.apiService.login(this.username(), this.password()).toPromise();

      if (response?.success) {
        // Login successful - redirect to landing page
        this.router.navigate(['/landing']);
      } else {
        this.errorMessage.set(response?.message || 'Invalid username or password');
      }
    } catch (error: any) {
      console.error('Login error:', error);

      if (error.status === 401) {
        this.errorMessage.set('Invalid username or password');
      } else if (error.status === 500) {
        this.errorMessage.set('Server error. Please try again later.');
      } else {
        this.errorMessage.set('Login failed. Please check your connection and try again.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}
