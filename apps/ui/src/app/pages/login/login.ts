import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  isLoading: boolean = false;

  constructor(private router: Router) {}

  onSubmit() {
    if (this.email && this.password) {
      this.isLoading = true;

      // Simulate login API call
      setTimeout(() => {
        this.isLoading = false;
        // Navigate to landing page on successful login
        this.router.navigate(['/landing']);
      }, 1000);
    }
  }
}
