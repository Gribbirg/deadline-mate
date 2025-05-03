import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useRouter } from 'next/router';
import { 
  Assignment, AssignmentMin, AssignmentAttachment,
  AssignmentGroup, Submission, AssignmentFormData,
  SubmissionFormData, AssignmentGroupFormData
} from './types';

interface AssignmentContextType {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  groupAssignments: AssignmentGroup[];
  studentSubmissions: Submission[];
  teacherSubmissions: { [key: number]: Submission[] };
  loading: boolean;
  error: string | null;
  fetchAssignments: () => Promise<void>;
  fetchAssignment: (id: number) => Promise<void>;
  fetchGroupAssignments: (groupId: number) => Promise<void>;
  fetchStudentSubmissions: () => Promise<void>;
  fetchAssignmentSubmissions: (assignmentId: number) => Promise<void>;
  createAssignment: (data: AssignmentFormData) => Promise<Assignment | null>;
  updateAssignment: (id: number, data: Partial<AssignmentFormData>) => Promise<Assignment | null>;
  deleteAssignment: (id: number) => Promise<boolean>;
  assignToGroup: (data: AssignmentGroupFormData) => Promise<AssignmentGroup | null>;
  submitAssignment: (assignmentId: number, data: SubmissionFormData) => Promise<Submission | null>;
  gradeSubmission: (submissionId: number, status: string, points: number, feedback: string) => Promise<boolean>;
}

const AssignmentContext = createContext<AssignmentContextType | undefined>(undefined);

export const useAssignments = () => {
  const context = useContext(AssignmentContext);
  if (context === undefined) {
    throw new Error('useAssignments must be used within an AssignmentProvider');
  }
  return context;
};

interface AssignmentProviderProps {
  children: ReactNode;
}

export const AssignmentProvider: React.FC<AssignmentProviderProps> = ({ children }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [groupAssignments, setGroupAssignments] = useState<AssignmentGroup[]>([]);
  const [studentSubmissions, setStudentSubmissions] = useState<Submission[]>([]);
  const [teacherSubmissions, setTeacherSubmissions] = useState<{ [key: number]: Submission[] }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isStudent, isTeacher } = useAuth();
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

  // Получение списка заданий
  const fetchAssignments = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    try {
      // Добавляем метку времени для предотвращения кэширования
      const timestamp = new Date().getTime();
      const url = `/api/assignments/assignments/?_=${timestamp}`;
      
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
      
      // Обработка ответа с пагинацией (стандартная пагинация Django REST Framework)
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data)) {
          setAssignments(response.data);
        } else if (response.data.results && Array.isArray(response.data.results)) {
          setAssignments(response.data.results);
        } else {
          setAssignments([]);
          setError('Неверный формат данных заданий');
        }
      } else {
        setAssignments([]);
        setError('Неверный формат данных заданий');
      }
    } catch (err: any) {
      console.error('Error fetching assignments:', err);
      setError(err.response?.data?.detail || 'Ошибка при загрузке заданий');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Получение детальной информации о задании
  const fetchAssignment = useCallback(async (id: number) => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    try {
      // Добавляем метку времени для предотвращения кэширования
      // Проверяем, что id не NaN и является числом
      if (isNaN(id) || typeof id !== 'number') {
        setError('Некорректный ID задания');
        setLoading(false);
        return;
      }
      const timestamp = new Date().getTime();
      const url = `/api/assignments/assignments/${id}?_=${timestamp}`;
      
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
      setCurrentAssignment(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при загрузке задания');
      console.error('Error fetching assignment:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Получение заданий для группы
  const fetchGroupAssignments = useCallback(async (groupId: number) => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    try {
      // Добавляем метку времени для предотвращения кэширования
      const timestamp = new Date().getTime();
      const url = `/api/assignments/assignment-groups?group_id=${groupId}&_=${timestamp}`;
      
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
      
      // Обработка ответа с пагинацией
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data)) {
          setGroupAssignments(response.data);
        } else if (response.data.results && Array.isArray(response.data.results)) {
          setGroupAssignments(response.data.results);
        } else {
          setGroupAssignments([]);
          setError('Неверный формат данных заданий группы');
        }
      } else {
        setGroupAssignments([]);
        setError('Неверный формат данных заданий группы');
      }
    } catch (err: any) {
      console.error('Error fetching group assignments:', err);
      setError(err.response?.data?.detail || 'Ошибка при загрузке заданий группы');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Получение всех ответов студентов (только для студента)
  const fetchStudentSubmissions = useCallback(async () => {
    if (!isAuthenticated || !isStudent()) return;
    
    setLoading(true);
    setError(null);
    try {
      // Добавляем метку времени для предотвращения кэширования
      const timestamp = new Date().getTime();
      const url = `/api/assignments/submissions?_=${timestamp}`;
      
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
      
      // Обработка ответа с пагинацией
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data)) {
          setStudentSubmissions(response.data);
        } else if (response.data.results && Array.isArray(response.data.results)) {
          setStudentSubmissions(response.data.results);
        } else {
          setStudentSubmissions([]);
          setError('Неверный формат данных ответов');
        }
      } else {
        setStudentSubmissions([]);
        setError('Неверный формат данных ответов');
      }
    } catch (err: any) {
      console.error('Error fetching student submissions:', err);
      setError(err.response?.data?.detail || 'Ошибка при загрузке ответов');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isStudent]);

  // Получение ответов на задание (только для преподавателя)
  const fetchAssignmentSubmissions = useCallback(async (assignmentId: number) => {
    if (!isAuthenticated || !isTeacher()) return;
    
    setLoading(true);
    setError(null);
    try {
      // Добавляем метку времени для предотвращения кэширования
      // Проверяем, что assignmentId не NaN и является числом
      if (isNaN(assignmentId) || typeof assignmentId !== 'number') {
        setError('Некорректный ID задания');
        setLoading(false);
        return;
      }
      const timestamp = new Date().getTime();
      const url = `/api/assignments/assignments/${assignmentId}/submissions?_=${timestamp}`;
      
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
      
      // Обработка ответа
      let submissions: Submission[] = [];
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data)) {
          submissions = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          submissions = response.data.results;
        }
      }
      
      // Обновляем состояние
      setTeacherSubmissions(prev => ({
        ...prev,
        [assignmentId]: submissions
      }));
    } catch (err: any) {
      console.error('Error fetching assignment submissions:', err);
      setError(err.response?.data?.detail || 'Ошибка при загрузке ответов на задание');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isTeacher]);

  // Создание нового задания
  const createAssignment = useCallback(async (data: AssignmentFormData) => {
    if (!isAuthenticated || !isTeacher()) return null;
    
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/assignments/assignments', data, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Обновляем список заданий
      fetchAssignments();
      
      return response.data;
    } catch (err: any) {
      console.error('Error creating assignment:', err);
      setError(err.response?.data?.detail || 'Ошибка при создании задания');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isTeacher, fetchAssignments]);

  // Обновление задания
  const updateAssignment = useCallback(async (id: number, data: Partial<AssignmentFormData>) => {
    if (!isAuthenticated || !isTeacher()) return null;
    
    setLoading(true);
    setError(null);
    try {
      const response = await axios.patch(`/api/assignments/assignments/${id}`, data, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Обновляем текущее задание, если оно открыто
      if (currentAssignment && currentAssignment.id === id) {
        setCurrentAssignment(response.data);
      }
      
      // Обновляем список заданий
      fetchAssignments();
      
      return response.data;
    } catch (err: any) {
      console.error('Error updating assignment:', err);
      setError(err.response?.data?.detail || 'Ошибка при обновлении задания');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isTeacher, currentAssignment, fetchAssignments]);

  // Удаление задания
  const deleteAssignment = useCallback(async (id: number) => {
    if (!isAuthenticated || !isTeacher()) return false;
    
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`/api/assignments/assignments/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      // Удаляем задание из списка
      setAssignments(prev => prev.filter(assignment => assignment.id !== id));
      
      // Если удаляем текущее задание, сбрасываем его
      if (currentAssignment && currentAssignment.id === id) {
        setCurrentAssignment(null);
      }
      
      return true;
    } catch (err: any) {
      console.error('Error deleting assignment:', err);
      setError(err.response?.data?.detail || 'Ошибка при удалении задания');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isTeacher, currentAssignment]);

  // Назначение задания группе
  const assignToGroup = useCallback(async (data: AssignmentGroupFormData) => {
    if (!isAuthenticated || !isTeacher()) return null;
    
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/assignments/assignment-groups', data, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Если назначаем задание для текущей группы, обновляем список
      if (groupAssignments.length > 0 && groupAssignments[0].group.id === data.group_id) {
        fetchGroupAssignments(data.group_id);
      }
      
      return response.data;
    } catch (err: any) {
      console.error('Error assigning to group:', err);
      setError(err.response?.data?.detail || 'Ошибка при назначении задания группе');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isTeacher, groupAssignments, fetchGroupAssignments]);

  // Отправка ответа на задание
  const submitAssignment = useCallback(async (assignmentId: number, data: SubmissionFormData) => {
    if (!isAuthenticated || !isStudent()) return null;
    
    setLoading(true);
    setError(null);
    try {
      // Отправляем ответ
      const response = await axios.post('/api/assignments/submissions/', {
        assignment_id: assignmentId,
        comment: data.comment
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Обновляем список ответов студента
      fetchStudentSubmissions();
      
      return response.data;
    } catch (err: any) {
      console.error('Error submitting assignment:', err);
      setError(err.response?.data?.detail || 'Ошибка при отправке ответа');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isStudent, fetchStudentSubmissions]);

  // Оценивание ответа
  const gradeSubmission = useCallback(async (submissionId: number, status: string, points: number, feedback: string) => {
    if (!isAuthenticated || !isTeacher()) return false;
    
    setLoading(true);
    setError(null);
    try {
      await axios.patch(`/api/assignments/submissions/${submissionId}/grade`, {
        status,
        points,
        feedback
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Обновляем список ответов для всех заданий
      for (const assignmentId in teacherSubmissions) {
        fetchAssignmentSubmissions(parseInt(assignmentId));
      }
      
      return true;
    } catch (err: any) {
      console.error('Error grading submission:', err);
      setError(err.response?.data?.detail || 'Ошибка при оценивании ответа');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isTeacher, teacherSubmissions, fetchAssignmentSubmissions]);

  return (
    <AssignmentContext.Provider
      value={{
        assignments,
        currentAssignment,
        groupAssignments,
        studentSubmissions,
        teacherSubmissions,
        loading,
        error,
        fetchAssignments,
        fetchAssignment,
        fetchGroupAssignments,
        fetchStudentSubmissions,
        fetchAssignmentSubmissions,
        createAssignment,
        updateAssignment,
        deleteAssignment,
        assignToGroup,
        submitAssignment,
        gradeSubmission
      }}
    >
      {children}
    </AssignmentContext.Provider>
  );
}; 