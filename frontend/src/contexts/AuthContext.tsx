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
  student_profile?: {
    id?: number;
    major?: string;
    year_of_study?: number;
    avatar?: string;
  };
  teacher_profile?: {
    id?: number;
    position?: string;
    department?: string;
    academic_degree?: string;
    bio?: string;
    avatar?: string;
  };
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

// Переменные для отслеживания процесса обновления токена
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Провайдер контекста
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Настройка интерсептора для автоматического обновления токена
  useEffect(() => {
    // Добавляем интерсептор для обработки 401 ошибок
    const responseInterceptor = axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        
        // Если ошибка не 401 или запрос уже повторялся, просто отклоняем промис
        if (error.response?.status !== 401 || originalRequest._retry) {
          return Promise.reject(error);
        }
        
        // Если запрос к эндпоинту обновления токенов, отклоняем без повторных попыток
        if (originalRequest.url === `${API_URL}/auth/token/refresh/`) {
          return Promise.reject(error);
        }
        
        originalRequest._retry = true;
        
        if (isRefreshing) {
          // Если процесс обновления уже идет, добавляем в очередь
          try {
            const token = await new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            });
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axios(originalRequest);
          } catch (err) {
            return Promise.reject(err);
          }
        }
        
        isRefreshing = true;
        
        // Пытаемся обновить токен
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }
          
          const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
            refresh: refreshToken
          });
          
          const { access } = response.data;
          
          // Сохраняем новый токен
          localStorage.setItem('access_token', access);
          
          // Обновляем заголовок авторизации
          axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
          originalRequest.headers['Authorization'] = `Bearer ${access}`;
          
          // Обрабатываем очередь запросов
          processQueue(null, access);
          
          // Повторяем оригинальный запрос с новым токеном
          return axios(originalRequest);
        } catch (err) {
          processQueue(err, null);
          
          // Если обновление токена не удалось, очищаем данные аутентификации
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
          
          // Перенаправляем на страницу входа
          router.push('/login');
          
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }
    );
    
    // Очистка интерсептора при размонтировании
    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [router]);
  
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
          // Не удаляем токены здесь, т.к. интерсептор попытается обновить токен
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
      
      const { access, refresh, user_id, username: userName, email, role, first_name, last_name, teacher_profile, student_profile } = response.data;
      
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
        last_name,
        teacher_profile,
        student_profile
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