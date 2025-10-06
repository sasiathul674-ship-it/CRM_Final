import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Constants from 'expo-constants';
import { Alert } from 'react-native';

interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, company?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

  const fetchUser = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return true;
      } else {
        throw new Error('Failed to fetch user');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const { access_token } = data;
        setToken(access_token);
        const userFetched = await fetchUser(access_token);
        
        if (userFetched) {
          Alert.alert('Welcome Back!', `Good to see you again!`, [
            { text: 'Continue', style: 'default' }
          ]);
          return true;
        }
      } else {
        const errorMessage = data.detail || 'Invalid email or password';
        Alert.alert('Login Failed', errorMessage);
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Connection Error', 'Unable to connect to server. Please check your internet connection.');
      return false;
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  const register = async (email: string, password: string, name: string, company?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, company }),
      });

      const data = await response.json();

      if (response.ok) {
        const { access_token } = data;
        setToken(access_token);
        const userFetched = await fetchUser(access_token);
        
        if (userFetched) {
          Alert.alert(
            'Welcome to Strike!', 
            'Your account has been created successfully. Let\'s set up your CRM!', 
            [{ text: 'Get Started', style: 'default' }]
          );
          return true;
        }
      } else {
        const errorMessage = data.detail || 'Registration failed';
        if (errorMessage.includes('Email already registered')) {
          Alert.alert('Account Exists', 'An account with this email already exists. Please sign in instead.');
        } else {
          Alert.alert('Registration Failed', errorMessage);
        }
        return false;
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Connection Error', 'Unable to connect to server. Please check your internet connection.');
      return false;
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isLoading,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
