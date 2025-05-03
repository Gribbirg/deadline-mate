import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useRouter } from 'next/router';

// Типы данных
export interface Group {
  id: number;
  name: string;
  code: string;
  description: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  is_active: boolean;
  member_count: number;
  teacher_count: number;
}

export interface GroupDetail extends Group {
  members: GroupMember[];
  teachers: GroupTeacher[];
}

export interface GroupMember {
  id: number;
  group: number;
  student: number;
  student_name: string;
  role: string;
  joined_at: string;
  is_active: boolean;
}

export interface GroupTeacher {
  id: number;
  group: number;
  teacher: number;
  teacher_name: string;
  joined_at: string;
  is_active: boolean;
}

interface GroupContextType {
  groups: Group[];
  currentGroup: GroupDetail | null;
  loading: boolean;
  error: string | null;
  fetchGroups: () => Promise<void>;
  fetchGroup: (id: number) => Promise<void>;
  createGroup: (data: Partial<Group>) => Promise<Group | null>;
  updateGroup: (id: number, data: Partial<Group>) => Promise<Group | null>;
  deleteGroup: (id: number) => Promise<boolean>;
  addStudentToGroup: (groupId: number, studentId: number, role?: string) => Promise<GroupMember | null>;
  removeStudentFromGroup: (groupId: number, membershipId: number) => Promise<boolean>;
  addTeacherToGroup: (groupId: number, teacherId: number) => Promise<GroupTeacher | null>;
  removeTeacherFromGroup: (groupId: number, teacherId: number) => Promise<boolean>;
  joinAsTeacher: (groupId: number) => Promise<GroupTeacher | null>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const useGroups = () => {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error('useGroups must be used within a GroupProvider');
  }
  return context;
};

interface GroupProviderProps {
  children: ReactNode;
}

export const GroupProvider: React.FC<GroupProviderProps> = ({ children }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Сбрасываем ошибку при изменении маршрута
  useEffect(() => {
    const handleRouteChange = () => {
      setError(null);
    };

    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);
  
  // Сбрасываем ошибку при размонтировании компонента
  useEffect(() => {
    return () => {
      setError(null);
    };
  }, []);

  // Получение списка групп
  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Получаем токен напрямую для этого запроса
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Не авторизован');
      }
      
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const url = `/api/groups/groups/?_=${timestamp}`;
      
      console.log(`Fetching groups with URL: ${url}`);
      const response = await axios({
        method: 'get',
        url,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      console.log('Groups API response:', response);
      
      // Handle paginated response (Django REST Framework default pagination)
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data)) {
          // Direct array response
          setGroups(response.data);
          console.log('Groups loaded successfully (array):', response.data);
        } else if (response.data.results && Array.isArray(response.data.results)) {
          // Paginated response
          setGroups(response.data.results);
          console.log('Groups loaded successfully (paginated):', response.data.results);
        } else {
          console.error('Received invalid groups data format:', response.data);
          setGroups([]);
          setError('Неверный формат данных групп');
        }
      } else {
        console.error('Received non-object groups data:', response.data);
        setGroups([]);
        setError('Неверный формат данных групп');
      }
    } catch (err: any) {
      console.error('Error fetching groups:', err);
      if (err.response?.status === 401) {
        setError('Для просмотра групп необходима авторизация');
      } else {
        setError(err.response?.data?.detail || `Ошибка при загрузке групп: ${err.message}`);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Получение детальной информации о группе
  const fetchGroup = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const url = `/api/groups/groups/${id}/?_=${timestamp}`;
      
      const response = await axios({
        method: 'get',
        url,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      setCurrentGroup(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при загрузке группы');
      console.error('Error fetching group:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Создание новой группы
  const createGroup = useCallback(async (data: Partial<Group>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/groups/groups/', data, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      const newGroup = response.data;
      setGroups(prevGroups => [...prevGroups, newGroup]);
      return newGroup;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при создании группы');
      console.error('Error creating group:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Обновление группы
  const updateGroup = useCallback(async (id: number, data: Partial<Group>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.patch(`/api/groups/groups/${id}/`, data, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      const updatedGroup = response.data;
      
      // Обновляем кэш групп
      setGroups(prevGroups => 
        prevGroups.map(group => 
          group.id === id ? { ...group, ...updatedGroup } : group
        )
      );
      
      // Обновляем текущую группу, если это она
      if (currentGroup && currentGroup.id === id) {
        setCurrentGroup({ ...currentGroup, ...updatedGroup });
      }
      
      return updatedGroup;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при обновлении группы');
      console.error('Error updating group:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentGroup]);

  // Удаление группы
  const deleteGroup = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`/api/groups/groups/${id}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Удаляем группу из кэша
      setGroups(prevGroups => prevGroups.filter(group => group.id !== id));
      
      // Если это была текущая группа, очищаем её
      if (currentGroup && currentGroup.id === id) {
        setCurrentGroup(null);
      }
      
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при удалении группы');
      console.error('Error deleting group:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentGroup]);

  // Добавление студента в группу
  const addStudentToGroup = useCallback(async (
    groupId: number,
    studentId: number,
    role: string = 'member'
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`/api/groups/groups/${groupId}/add_student/`, {
        student_id: studentId,
        role,
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Обновляем текущую группу, если нужно
      if (currentGroup && currentGroup.id === groupId) {
        await fetchGroup(groupId);
      }
      
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при добавлении студента');
      console.error('Error adding student to group:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentGroup, fetchGroup]);

  // Удаление студента из группы
  const removeStudentFromGroup = useCallback(async (groupId: number, membershipId: number) => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(`/api/groups/groups/${groupId}/remove_student/`, {
        membership_id: membershipId,
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Обновляем текущую группу, если нужно
      if (currentGroup && currentGroup.id === groupId) {
        await fetchGroup(groupId);
      }
      
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при удалении студента');
      console.error('Error removing student from group:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentGroup, fetchGroup]);

  // Добавление учителя в группу
  const addTeacherToGroup = useCallback(async (groupId: number, teacherId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`/api/groups/groups/${groupId}/add_teacher/`, {
        teacher_id: teacherId
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Обновляем текущую группу, если это она
      if (currentGroup && currentGroup.id === groupId) {
        await fetchGroup(groupId);
      }
      
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при добавлении преподавателя в группу');
      console.error('Error adding teacher to group:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentGroup, fetchGroup]);

  // Удаление учителя из группы
  const removeTeacherFromGroup = useCallback(async (groupId: number, teacherId: number) => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(`/api/groups/groups/${groupId}/remove_teacher/`, {
        teacher_id: teacherId
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Обновляем текущую группу, если это она
      if (currentGroup && currentGroup.id === groupId) {
        await fetchGroup(groupId);
      }
      
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при удалении преподавателя из группы');
      console.error('Error removing teacher from group:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentGroup, fetchGroup]);

  // Добавление преподавателя в группу
  const joinAsTeacher = useCallback(async (groupId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`/api/groups/groups/${groupId}/join_as_teacher/`, {
        // No additional data needed for this operation
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Обновляем текущую группу, если это она
      if (currentGroup && currentGroup.id === groupId) {
        await fetchGroup(groupId);
      }
      
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при добавлении преподавателя в группу');
      console.error('Error joining as teacher:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentGroup, fetchGroup]);

  const value = {
    groups,
    currentGroup,
    loading,
    error,
    fetchGroups,
    fetchGroup,
    createGroup,
    updateGroup,
    deleteGroup,
    addStudentToGroup,
    removeStudentFromGroup,
    addTeacherToGroup,
    removeTeacherFromGroup,
    joinAsTeacher
  };

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
}; 