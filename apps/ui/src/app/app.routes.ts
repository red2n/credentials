import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { LandingComponent } from './pages/landing/landing';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'landing', component: LandingComponent },
  { path: '**', redirectTo: '/login' }
];
