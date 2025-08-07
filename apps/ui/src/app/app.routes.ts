import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { LandingComponent } from './pages/landing/landing';
import { RegisterComponent } from './pages/register/register';
import { AdminLoginComponent } from './pages/admin-login/admin-login';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard';
import { SystemDashboardComponent } from './pages/system-dashboard/system-dashboard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'landing', component: LandingComponent },
  {
    path: 'admin/login',
    component: AdminLoginComponent
  },
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
    canActivate: [AdminGuard]
  },
  {
    path: 'system/dashboard',
    component: SystemDashboardComponent,
    canActivate: [AdminGuard]
  },
  { path: '**', redirectTo: '/login' }
];
