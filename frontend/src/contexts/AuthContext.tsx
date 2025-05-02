import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

// Типы для пользователя и контекста
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'student' | 'teacher';
  first_name: string;
  last_name: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  isStudent: () => boolean;
  isTeacher: () => boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'teacher';
  student_profile?: {
    major?: string;
    year_of_study?: number;
  };
  teacher_profile?: {
    position?: string;
    department?: string;
    academic_degree?: string;
  };
}

// Создаем контекст
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Базовый URL API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Провайдер контекста
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Проверяем, есть ли токен при загрузке
  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          // Установить заголовок для axios
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Получить данные пользователя
          const response = await axios.get(`${API_URL}/auth/profile/`);
          setUser(response.data);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          axios.defaults.headers.common['Authorization'] = '';
        }
      }
      setIsLoading(false);
    };
    
    checkToken();
  }, []);
  
  // Функция входа
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/auth/token/`, {
        username,
        password
      });
      
      const { access, refresh, user_id, username: userName, email, role, first_name, last_name } = response.data;
      
      // Сохраняем токены
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      // Устанавливаем заголовок авторизации
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      
      // Устанавливаем данные пользователя
      setUser({
        id: user_id,
        username: userName,
        email,
        role,
        first_name,
        last_name
      });
      
      // Перенаправление на дашборд
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.response?.data?.detail || 'Произошла ошибка при входе');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Функция выхода
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    axios.defaults.headers.common['Authorization'] = '';
    setUser(null);
    router.push('/');
  };
  
  // Функция регистрации
  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      await axios.post(`${API_URL}/auth/register/`, userData);
      // После успешной регистрации перенаправляем на страницу входа
      router.push('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.detail 
        || Object.values(error.response?.data || {}).flat().join(', ')
        || 'Произошла ошибка при регистрации';
      setError(errorMessage as string);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Функции проверки роли
  const isStudent = () => user?.role === 'student';
  const isTeacher = () => user?.role === 'teacher';
  
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    register,
    isStudent,
    isTeacher
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Хук для использования контекста
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 