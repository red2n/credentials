import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService, RegisterRequest } from '../../services/api.service';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Subject, of } from 'rxjs';

interface ValidationState {
  isValidating: boolean;
  isAvailable: boolean | null;
  message: string;
  error: string | null;
}

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {
  // Form fields as signals
  username = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  isSubmitting = signal(false);

  // Username validation state
  usernameValidation = signal<ValidationState>({
    isValidating: false,
    isAvailable: null,
    message: '',
    error: null
  });

  // Subject for username validation debouncing
  private usernameSubject = new Subject<string>();

  // Computed validation states
  isUsernameValid = computed(() => {
    const validation = this.usernameValidation();
    return validation.isAvailable === true && !validation.error;
  });

  isPasswordValid = computed(() => {
    return this.password().length >= 6;
  });

  // Password strength indicators
  hasMinLength = computed(() => this.password().length >= 1);
  hasGoodLength = computed(() => this.password().length >= 6);
  hasUppercase = computed(() => this.password().length >= 8 && /[A-Z]/.test(this.password()));
  hasNumber = computed(() => this.password().length >= 8 && /[A-Z]/.test(this.password()) && /[0-9]/.test(this.password()));

  // Password strength text
  passwordStrengthText = computed(() => {
    const pwd = this.password();
    if (pwd.length < 6) {
      return 'Weak - At least 6 characters needed';
    } else if (pwd.length < 8) {
      return 'Fair - Add uppercase letters and numbers';
    } else if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) {
      return 'Strong - Great password!';
    } else {
      return 'Good - Add uppercase letters or numbers';
    }
  });

  doPasswordsMatch = computed(() => {
    return this.password() === this.confirmPassword() && this.confirmPassword().length > 0;
  });

  isFormValid = computed(() => {
    return this.isUsernameValid() &&
           this.isPasswordValid() &&
           this.doPasswordsMatch() &&
           this.email().includes('@') &&
           !this.isSubmitting();
  });  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    // Set up username validation with debouncing
    this.usernameSubject.pipe(
      debounceTime(500), // Wait 500ms after user stops typing
      distinctUntilChanged(),
      switchMap(username => {
        if (!username || username.length < 3) {
          return of(null);
        }

        this.usernameValidation.update(state => ({
          ...state,
          isValidating: true,
          error: null
        }));

        // First check with Bloom filter (fast)
        return this.apiService.validateUsername(username).pipe(
          switchMap(bloomResponse => {
            // If Bloom filter says it might exist, do a definitive check
            if (bloomResponse.mightExist) {
              return this.apiService.checkUserExists(username).pipe(
                catchError(error => {
                  console.error('User existence check failed:', error);
                  return of({ username, exists: true, message: 'Validation failed' });
                })
              );
            } else {
              // Bloom filter says it's available
              return of({ username, exists: false, message: 'Username is available' });
            }
          }),
          catchError(error => {
            console.error('Username validation failed:', error);
            return of(null);
          })
        );
      })
    ).subscribe(result => {
      if (result) {
        this.usernameValidation.set({
          isValidating: false,
          isAvailable: !result.exists,
          message: result.exists ?
            'Username is already taken' :
            'Username is available',
          error: null
        });
      } else {
        this.usernameValidation.set({
          isValidating: false,
          isAvailable: null,
          message: '',
          error: null
        });
      }
    });
  }

  onUsernameChange(value: string) {
    this.username.set(value);

    if (value.length < 3) {
      this.usernameValidation.set({
        isValidating: false,
        isAvailable: null,
        message: value.length > 0 ? 'Username must be at least 3 characters' : '',
        error: null
      });
      return;
    }

    this.usernameSubject.next(value);
  }

  onEmailChange(value: string) {
    this.email.set(value);
  }

  onPasswordChange(value: string) {
    this.password.set(value);
  }

  onConfirmPasswordChange(value: string) {
    this.confirmPassword.set(value);
  }

  async onSubmit() {
    if (!this.isFormValid()) {
      return;
    }

    this.isSubmitting.set(true);

    const registerData: RegisterRequest = {
      username: this.username(),
      password: this.password(),
      email: this.email()
    };

    try {
      const response = await this.apiService.register(registerData).toPromise();

      if (response?.success) {
        // Registration successful - redirect to login
        this.router.navigate(['/login'], {
          queryParams: {
            message: 'Registration successful! Please log in.',
            username: this.username()
          }
        });
      } else {
        // Handle registration failure
        this.usernameValidation.update(state => ({
          ...state,
          error: response?.message || 'Registration failed'
        }));
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.usernameValidation.update(state => ({
        ...state,
        error: typeof error === 'string' ? error : 'Registration failed. Please try again.'
      }));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  getUsernameValidationClass(): string {
    const validation = this.usernameValidation();

    if (validation.isValidating) {
      return 'validating';
    }

    if (validation.error) {
      return 'error';
    }

    if (validation.isAvailable === true) {
      return 'success';
    }

    if (validation.isAvailable === false) {
      return 'error';
    }

    return '';
  }
}
