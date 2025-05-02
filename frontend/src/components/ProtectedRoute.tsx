import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Flex, Spinner, Text } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'next-i18next';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roleRequired?: 'student' | 'teacher';
}

/**
 * Компонент для защиты маршрутов, требующих аутентификации
 * Если указан roleRequired, то проверяет также роль пользователя
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roleRequired }) => {
  const { isAuthenticated, isLoading, isStudent, isTeacher, user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation('common');
  
  useEffect(() => {
    // Если загрузка завершена и пользователь не аутентифицирован
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    
    // Если требуется определенная роль и пользователь загружен
    if (!isLoading && isAuthenticated && user && roleRequired) {
      const hasRequiredRole = 
        (roleRequired === 'student' && isStudent()) || 
        (roleRequired === 'teacher' && isTeacher());
      
      if (!hasRequiredRole) {
        router.push('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, user, roleRequired, router, isStudent, isTeacher]);
  
  // Показываем загрузку
  if (isLoading || !isAuthenticated) {
    return (
      <Flex justify="center" align="center" minH="100vh">
        <Spinner size="xl" mr={4} />
        <Text>{t('common.loading')}</Text>
      </Flex>
    );
  }
  
  // Проверка роли
  if (roleRequired) {
    const hasRequiredRole = 
      (roleRequired === 'student' && isStudent()) || 
      (roleRequired === 'teacher' && isTeacher());
    
    if (!hasRequiredRole) {
      return (
        <Flex justify="center" align="center" minH="100vh">
          <Text>{t('common.accessDenied')}</Text>
        </Flex>
      );
    }
  }
  
  // Если все проверки пройдены, отображаем дочерний компонент
  return <>{children}</>;
};

export default ProtectedRoute; 