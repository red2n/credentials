import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  imports: [CommonModule],
  templateUrl: './landing.html'
})
export class LandingComponent {
  user = {
    name: 'John Doe',
    email: 'john.doe@example.com'
  };

  credentials = [
    { id: 1, name: 'AWS Production', type: 'AWS', lastUsed: '2 hours ago' },
    { id: 2, name: 'Database Prod', type: 'MySQL', lastUsed: '1 day ago' },
    { id: 3, name: 'API Keys', type: 'API', lastUsed: '3 days ago' },
    { id: 4, name: 'SSH Keys', type: 'SSH', lastUsed: '1 week ago' }
  ];

  constructor(private router: Router) {}

  logout() {
    // Navigate back to login
    this.router.navigate(['/login']);
  }

  addCredential() {
    // TODO: Implement add credential functionality
    console.log('Add credential clicked');
  }

  editCredential(id: number) {
    // TODO: Implement edit credential functionality
    console.log('Edit credential:', id);
  }

  deleteCredential(id: number) {
    // TODO: Implement delete credential functionality
    this.credentials = this.credentials.filter(cred => cred.id !== id);
  }
}
