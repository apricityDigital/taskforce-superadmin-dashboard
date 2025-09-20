import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin';
}

interface AuthContextType {
  user: User | null;
  loginWithEmail: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const loginWithEmail = async (email: string, password?: string) => {
    try {
      if (email === 'admin@system.local' || email === 'admin') {
        if (password && password !== 'admin123' && password !== 'password') {
          throw new Error('Invalid admin credentials');
        }

        const adminUser: User = {
          id: 'admin-1',
          name: 'System Administrator',
          email: 'admin@system.local',
          role: 'admin',
        };

        setUser(adminUser);
        localStorage.setItem('user', JSON.stringify(adminUser));
        return;
      }

      throw new Error('Invalid credentials');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, loginWithEmail, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
