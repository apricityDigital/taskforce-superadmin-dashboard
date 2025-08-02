// Super Admin Authentication Service
export interface SuperAdmin {
  email: string;
  role: 'super_admin';
  permissions: string[];
}

// Super Admin Credentials
const SUPER_ADMIN_CREDENTIALS = {
  email: 'rootadmin',
  password: 'qwerty'
};

export class SuperAdminAuth {
  private static readonly STORAGE_KEY = 'super_admin_session';

  // Authenticate super admin
  static authenticate(email: string, password: string): boolean {
    if (email === SUPER_ADMIN_CREDENTIALS.email && password === SUPER_ADMIN_CREDENTIALS.password) {
      // Store session
      const session = {
        email: SUPER_ADMIN_CREDENTIALS.email,
        role: 'super_admin',
        permissions: ['read_all', 'write_all', 'delete_all', 'manage_users', 'view_analytics'],
        loginTime: new Date().toISOString()
      };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
      }
      
      return true;
    }
    return false;
  }

  // Check if super admin is logged in
  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    
    const session = localStorage.getItem(this.STORAGE_KEY);
    return !!session;
  }

  // Get current super admin session
  static getCurrentSession(): SuperAdmin | null {
    if (typeof window === 'undefined') return null;
    
    const session = localStorage.getItem(this.STORAGE_KEY);
    if (session) {
      return JSON.parse(session);
    }
    return null;
  }

  // Logout super admin
  static logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}
