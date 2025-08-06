import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService, AdminUser, AdminStats } from '../../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private router = inject(Router);

  // Signals for state management
  users = signal<AdminUser[]>([]);
  stats = signal<AdminStats | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Search and pagination
  searchTerm = signal('');
  currentPage = signal(1);
  totalPages = signal(1);
  totalUsers = signal(0);
  pageSize = 10;

  // Selection state
  selectedUsers = signal<string[]>([]);
  selectAll = signal(false);

  // Modal state
  showDeleteModal = signal(false);
  showBulkDeleteModal = signal(false);
  userToDelete = signal<string | null>(null);

  // Computed properties
  hasSelectedUsers = computed(() => this.selectedUsers().length > 0);
  allUsersSelected = computed(() => {
    const users = this.users();
    const selected = this.selectedUsers();
    return users.length > 0 && users.every(user => selected.includes(user.username));
  });

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      // Load stats and users in parallel
      const [statsResponse, usersResponse] = await Promise.all([
        this.adminService.getStats().toPromise(),
        this.adminService.getUsers(
          this.currentPage(),
          this.pageSize,
          this.searchTerm()
        ).toPromise()
      ]);

      this.stats.set(statsResponse!);
      this.users.set(usersResponse!.users);
      this.totalUsers.set(usersResponse!.pagination.totalUsers);
      this.totalPages.set(usersResponse!.pagination.totalPages);

    } catch (error) {
      this.errorMessage.set('Failed to load dashboard data. Please try again.');
      console.error('Error loading data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async onSearch() {
    this.currentPage.set(1);
    this.clearSelection();
    await this.loadData();
  }

  async onPageChange(page: number) {
    this.currentPage.set(page);
    this.clearSelection();
    await this.loadData();
  }

  onSelectAll() {
    const allSelected = this.allUsersSelected();
    if (allSelected) {
      this.selectedUsers.set([]);
      this.selectAll.set(false);
    } else {
      this.selectedUsers.set(this.users().map(user => user.username));
      this.selectAll.set(true);
    }
  }

  onSelectUser(username: string) {
    const selected = this.selectedUsers();
    if (selected.includes(username)) {
      this.selectedUsers.set(selected.filter(u => u !== username));
    } else {
      this.selectedUsers.set([...selected, username]);
    }

    // Update select all state
    this.selectAll.set(this.allUsersSelected());
  }

  clearSelection() {
    this.selectedUsers.set([]);
    this.selectAll.set(false);
  }

  onDeleteUser(username: string) {
    this.userToDelete.set(username);
    this.showDeleteModal.set(true);
  }

  async confirmDeleteUser() {
    const username = this.userToDelete();
    if (!username) return;

    try {
      await this.adminService.deleteUser(username).toPromise();
      this.successMessage.set(`User ${username} has been deleted successfully.`);
      this.showDeleteModal.set(false);
      this.userToDelete.set(null);

      // Reload data
      await this.loadData();
    } catch (error) {
      this.errorMessage.set('Failed to delete user. Please try again.');
      console.error('Error deleting user:', error);
    }
  }

  onBulkDelete() {
    if (this.selectedUsers().length === 0) return;
    this.showBulkDeleteModal.set(true);
  }

  async confirmBulkDelete() {
    const users = this.selectedUsers();
    if (users.length === 0) return;

    try {
      await this.adminService.bulkDeleteUsers(users).toPromise();
      this.successMessage.set(`${users.length} users have been deleted successfully.`);
      this.showBulkDeleteModal.set(false);
      this.clearSelection();

      // Reload data
      await this.loadData();
    } catch (error) {
      this.errorMessage.set('Failed to delete users. Please try again.');
      console.error('Error deleting users:', error);
    }
  }

  closeModal() {
    this.showDeleteModal.set(false);
    this.showBulkDeleteModal.set(false);
    this.userToDelete.set(null);
  }

  dismissMessage() {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  logout() {
    // Clear admin session
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('adminKey');
      sessionStorage.removeItem('adminLoginTime');
    }
    this.router.navigate(['/']);
  }

  getPages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    // Show max 5 pages around current page
    const start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  getUserInitials(username: string): string {
    return username.slice(0, 2).toUpperCase();
  }

  formatDate(date: Date | string): string {
    if (!date) return 'Never';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  }
}
