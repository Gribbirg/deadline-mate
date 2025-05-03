import React, { useEffect, useState, useCallback } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  Stack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useToast,
  Skeleton,
  Input,
  FormControl,
  FormLabel,
  Select,
  Divider,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Alert,
  AlertIcon,
  Checkbox,
  HStack,
  VStack,
  Tooltip,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { ChevronLeftIcon, AddIcon, DeleteIcon, SearchIcon, CheckIcon } from '@chakra-ui/icons';
import NextLink from 'next/link';
import Layout from '../../../components/Layout';
import { GroupProvider, useGroups, GroupMember } from '../../../contexts/GroupContext';
import { useAuth } from '../../../contexts/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import axios from 'axios';

// Интерфейс для студента
interface Student {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Teacher {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface SelectedStudent {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface SelectedTeacher {
  id: number;
  name: string;
  email: string;
}

const GroupMembersPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation('common');
  const toast = useToast();
  const { currentGroup, fetchGroup, loading, error, addStudentToGroup, removeStudentFromGroup, addTeacherToGroup, removeTeacherFromGroup } = useGroups();
  const { isTeacher, user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isTeacherModalOpen, onOpen: onTeacherModalOpen, onClose: onTeacherModalClose } = useDisclosure();
  
  const highlightBg = useColorModeValue('blue.50', 'blue.800');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearchError, setStudentSearchError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Новые состояния для множественного выбора студентов
  const [selectedStudents, setSelectedStudents] = useState<SelectedStudent[]>([]);
  const [defaultRole, setDefaultRole] = useState('member');

  // Add new state variables for teachers
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [teacherSearchError, setTeacherSearchError] = useState('');
  const [submittingTeachers, setSubmittingTeachers] = useState(false);
  const [selectedTeachers, setSelectedTeachers] = useState<SelectedTeacher[]>([]);

  // Загрузка данных группы
  useEffect(() => {
    if (id) {
      fetchGroup(Number(id));
    }
    
    // Очистка ошибок при размонтировании
    return () => {
      setStudentSearchError('');
    };
  }, [id, fetchGroup]);

  // Очистка выбранных студентов при закрытии модального окна
  useEffect(() => {
    if (!isOpen) {
      setSelectedStudents([]);
      setSearchQuery('');
      setStudents([]);
    }
  }, [isOpen]);

  // Очистка выбранных преподавателей при закрытии модального окна
  useEffect(() => {
    if (!isTeacherModalOpen) {
      setSelectedTeachers([]);
      setTeacherSearchQuery('');
      setTeachers([]);
    }
  }, [isTeacherModalOpen]);

  // Загрузка списка студентов для добавления в группу
  const fetchStudents = useCallback(async () => {
    if (!searchQuery.trim()) {
      setStudents([]);
      return;
    }
    
    setLoadingStudents(true);
    setStudentSearchError('');
    try {
      const timestamp = new Date().getTime(); // Для предотвращения кэширования
      const response = await axios.get(`/api/users/students?search=${encodeURIComponent(searchQuery)}&_=${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      });
      
      // Фильтрация списка студентов - исключаем тех, кто уже состоит в группе
      const existingStudentIds = currentGroup?.members.map(member => member.student) || [];
      const filteredStudents = response.data.filter(
        (student: Student) => !existingStudentIds.includes(student.id)
      );
      
      setStudents(filteredStudents);
      
      if (filteredStudents.length === 0 && response.data.length > 0) {
        setStudentSearchError(t('group.allStudentsAlreadyInGroup'));
      }
    } catch (err) {
      console.error('Ошибка при загрузке студентов:', err);
      setStudentSearchError(t('group.errorLoadingStudents'));
    } finally {
      setLoadingStudents(false);
    }
  }, [searchQuery, currentGroup, t]);

  // Поиск студентов при изменении поискового запроса
  useEffect(() => {
    const searchTimer = setTimeout(() => {
      if (isTeacher() && isOpen && searchQuery.trim()) {
        fetchStudents();
      }
    }, 500);
    
    return () => clearTimeout(searchTimer);
  }, [searchQuery, isOpen, fetchStudents, isTeacher]);

  // Получение полного имени студента
  const getStudentFullName = (student: Student) => {
    if (student.user.first_name && student.user.last_name) {
      return `${student.user.first_name} ${student.user.last_name}`;
    }
    return student.user.username;
  };

  // Добавление/удаление студента из списка выбранных
  const toggleStudentSelection = (student: Student) => {
    const studentId = student.id;
    const studentName = getStudentFullName(student);
    const studentEmail = student.user.email;

    // Проверяем, выбран ли уже этот студент
    const isSelected = selectedStudents.some(s => s.id === studentId);
    
    if (isSelected) {
      // Если студент уже выбран, удаляем его из списка
      setSelectedStudents(prev => prev.filter(s => s.id !== studentId));
    } else {
      // Иначе добавляем в список с дефолтной ролью
      setSelectedStudents(prev => [...prev, {
        id: studentId,
        name: studentName,
        email: studentEmail,
        role: defaultRole
      }]);
    }
  };

  // Изменение роли выбранного студента
  const changeStudentRole = (studentId: number, newRole: string) => {
    setSelectedStudents(prev => prev.map(student => 
      student.id === studentId ? { ...student, role: newRole } : student
    ));
  };

  // Добавление выбранных студентов в группу
  const handleAddStudents = async () => {
    if (selectedStudents.length === 0) {
      toast({
        title: t('group.errorNoStudentsSelected'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // Используем Promise.all для параллельного выполнения запросов
      await Promise.all(
        selectedStudents.map(async (student) => {
          try {
            await addStudentToGroup(Number(id), student.id, student.role);
            successCount++;
          } catch (err) {
            console.error(`Ошибка при добавлении студента ${student.name}:`, err);
            failCount++;
          }
        })
      );

      // Обновляем список участников группы
      await fetchGroup(Number(id));
      
      // Показываем уведомление с результатами
      const message = successCount > 0
        ? failCount > 0
          ? t('group.addStudentsPartialSuccess', { success: successCount, fail: failCount })
          : t('group.addStudentsSuccess', { count: successCount })
        : t('group.addStudentsError');
        
      toast({
        title: message,
        status: successCount > 0 ? 'success' : 'error',
        duration: 5000,
        isClosable: true,
      });
      
      onClose();
    } catch (err) {
      toast({
        title: t('group.addStudentsError'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
      setSelectedStudents([]);
    }
  };

  // Удаление студента из группы
  const handleRemoveStudent = async (membershipId: number) => {
    if (window.confirm(t('group.confirmRemoveStudent'))) {
      try {
        const success = await removeStudentFromGroup(Number(id), membershipId);
        if (success) {
          toast({
            title: t('group.removeStudentSuccess'),
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (err) {
        toast({
          title: t('group.removeStudentError'),
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  // Проверяем, является ли пользователь создателем группы
  const isGroupCreator = useCallback(() => {
    return isTeacher(); // Любой преподаватель теперь может создавать группы
  }, [isTeacher]);

  // Загрузка списка преподавателей для добавления в группу
  const fetchTeachers = useCallback(async () => {
    if (!teacherSearchQuery.trim()) {
      setTeachers([]);
      return;
    }
    
    setLoadingTeachers(true);
    setTeacherSearchError('');
    try {
      const timestamp = new Date().getTime(); // Для предотвращения кэширования
      const response = await axios.get(`/api/users/teachers?search=${encodeURIComponent(teacherSearchQuery)}&_=${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      });
      
      // Фильтрация списка преподавателей - исключаем создателя группы и тех, кто уже в группе
      const existingTeacherIds = currentGroup?.teachers?.map(teacher => teacher.teacher) || [];
      const filteredTeachers = response.data.filter(
        (teacher: Teacher) => !existingTeacherIds.includes(teacher.id) && teacher.id !== currentGroup?.created_by
      );
      
      setTeachers(filteredTeachers);
      
      if (filteredTeachers.length === 0 && response.data.length > 0) {
        setTeacherSearchError(t('group.allTeachersAlreadyInGroup'));
      }
    } catch (err) {
      console.error('Ошибка при загрузке преподавателей:', err);
      setTeacherSearchError(t('group.errorLoadingTeachers'));
    } finally {
      setLoadingTeachers(false);
    }
  }, [teacherSearchQuery, currentGroup, t]);

  // Поиск преподавателей при изменении поискового запроса
  useEffect(() => {
    const searchTimer = setTimeout(() => {
      if (isGroupCreator() && isTeacherModalOpen && teacherSearchQuery.trim()) {
        fetchTeachers();
      }
    }, 500);
    
    return () => clearTimeout(searchTimer);
  }, [teacherSearchQuery, isTeacherModalOpen, fetchTeachers, isGroupCreator]);

  // Получение полного имени преподавателя
  const getTeacherFullName = (teacher: Teacher) => {
    if (teacher.user.first_name && teacher.user.last_name) {
      return `${teacher.user.first_name} ${teacher.user.last_name}`;
    }
    return teacher.user.username;
  };

  // Добавление/удаление преподавателя из списка выбранных
  const toggleTeacherSelection = (teacher: Teacher) => {
    const teacherId = teacher.id;
    const teacherName = getTeacherFullName(teacher);
    const teacherEmail = teacher.user.email;

    // Проверяем, выбран ли уже этот преподаватель
    const isSelected = selectedTeachers.some(s => s.id === teacherId);
    
    if (isSelected) {
      // Если преподаватель уже выбран, удаляем его из списка
      setSelectedTeachers(prev => prev.filter(s => s.id !== teacherId));
    } else {
      // Иначе добавляем в список
      setSelectedTeachers(prev => [...prev, {
        id: teacherId,
        name: teacherName,
        email: teacherEmail
      }]);
    }
  };

  // Добавление выбранных преподавателей в группу
  const handleAddTeachers = async () => {
    if (selectedTeachers.length === 0) {
      toast({
        title: t('group.errorNoTeachersSelected'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSubmittingTeachers(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // Используем Promise.all для параллельного выполнения запросов
      await Promise.all(
        selectedTeachers.map(async (teacher) => {
          try {
            await addTeacherToGroup(Number(id), teacher.id);
            successCount++;
          } catch (err) {
            console.error(`Ошибка при добавлении преподавателя ${teacher.name}:`, err);
            failCount++;
          }
        })
      );

      // Обновляем список участников группы
      await fetchGroup(Number(id));
      
      // Показываем уведомление с результатами
      const message = successCount > 0
        ? failCount > 0
          ? t('group.addTeachersPartialSuccess', { success: successCount, fail: failCount })
          : t('group.addTeachersSuccess', { count: successCount })
        : t('group.addTeachersError');
        
      toast({
        title: message,
        status: successCount > 0 ? 'success' : 'error',
        duration: 5000,
        isClosable: true,
      });
      
      // Закрываем модальное окно
      if (successCount > 0) {
        onTeacherModalClose();
      }
    } catch (err) {
      console.error('Ошибка при добавлении преподавателей:', err);
      toast({
        title: t('group.addTeachersError'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmittingTeachers(false);
    }
  };

  // Удаление преподавателя из группы
  const handleRemoveTeacher = async (teacherId: number) => {
    if (window.confirm(t('group.confirmRemoveTeacher'))) {
      try {
        const success = await removeTeacherFromGroup(Number(id), teacherId);
        if (success) {
          toast({
            title: t('group.removeTeacherSuccess'),
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (err) {
        toast({
          title: t('group.removeTeacherError'),
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  // Проверка прав доступа - любой преподаватель может управлять участниками
  const canManageMembers = () => {
    return isTeacher(); // Любой преподаватель может управлять группой
  };

  // Добавление функции для проверки, является ли текущий пользователь преподавателем этой группы
  const isTeacherInGroup = useCallback(() => {
    return isTeacher(); // Любой преподаватель теперь считается преподавателем группы
  }, [isTeacher]);

  // Отображение загрузки
  if (loading && !currentGroup) {
    return (
      <Layout>
        <Container maxW="container.xl" py={8}>
          <Skeleton height="40px" mb={6} />
          <Skeleton height="20px" mb={4} />
          <Skeleton height="300px" mb={6} />
        </Container>
      </Layout>
    );
  }

  // Отображение ошибки
  if (error || !currentGroup) {
    return (
      <Layout>
        <Container maxW="container.xl" py={8}>
          <Heading color="red.500" mb={4}>{t('error')}</Heading>
          <Box color="red.500" mb={4}>{error || t('group.notFound')}</Box>
          <Button
            leftIcon={<ChevronLeftIcon />}
            onClick={() => router.push('/groups')}
            mt={4}
          >
            {t('group.backToGroups')}
          </Button>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxW="container.xl" py={8}>
        {/* Хлебные крошки */}
        <Breadcrumb mb={6}>
          <BreadcrumbItem>
            <NextLink href="/groups" passHref legacyBehavior>
              <BreadcrumbLink>{t('group.breadcrumbGroups')}</BreadcrumbLink>
            </NextLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <NextLink href={`/groups/${id}`} passHref legacyBehavior>
              <BreadcrumbLink>{currentGroup?.name}</BreadcrumbLink>
            </NextLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>{t('group.manageMembers')}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <Flex justify="space-between" align="center" mb={6}>
          <Heading as="h1" size="xl">
            {t('group.manageMembers')}
          </Heading>
          <Stack direction="row" spacing={4}>
            {canManageMembers() && (
              <Button
                leftIcon={<AddIcon />}
                colorScheme="brand"
                onClick={onOpen}
              >
                {t('group.addStudent')}
              </Button>
            )}
          </Stack>
        </Flex>

        <Box mb={6}>
          <Text fontSize="lg" fontWeight="medium" mb={2}>
            {t('group.name')}: <strong>{currentGroup.name}</strong>
          </Text>
          <Text fontSize="md" mb={2}>
            {t('group.code')}: <strong>{currentGroup.code}</strong>
          </Text>
          <Text fontSize="sm" color="gray.600">
            {t('group.membersCount')}: {currentGroup.member_count}
          </Text>
        </Box>

        <Divider my={6} />

        <Tabs isFitted colorScheme="brand" mt={6}>
          <TabList mb="1em">
            <Tab>{t('group.studentTab')}</Tab>
            <Tab>{t('group.teacherTab')}</Tab>
          </TabList>

          <TabPanels>
            {/* Студенты */}
            <TabPanel p={0}>
              {/* Кнопка добавления студентов */}
              {canManageMembers() && (
                <Flex justifyContent="flex-end" mb={4}>
                  <Button 
                    leftIcon={<AddIcon />}
                    colorScheme="brand"
                    onClick={onOpen}
                  >
                    {t('group.addStudents')}
                  </Button>
                </Flex>
              )}

              {/* Таблица студентов */}
              {!currentGroup?.members || currentGroup.members.length === 0 ? (
                <Alert status="info">
                  <AlertIcon />
                  {t('group.noMembers')}
                </Alert>
              ) : (
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>{t('group.memberName')}</Th>
                        <Th>{t('group.memberRole')}</Th>
                        <Th>{t('group.memberJoinedAt')}</Th>
                        {canManageMembers() && <Th width="100px">{t('common.actions')}</Th>}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {currentGroup.members.map((member) => (
                        <Tr key={member.id}>
                          <Td>{member.student_name}</Td>
                          <Td>
                            <Badge colorScheme={member.role === 'monitor' ? 'purple' : 'blue'}>
                              {member.role === 'monitor'
                                ? t('group.roleModerator')
                                : t('group.roleMember')}
                            </Badge>
                          </Td>
                          <Td>{new Date(member.joined_at).toLocaleDateString()}</Td>
                          {canManageMembers() && (
                            <Td>
                              <IconButton
                                aria-label={t('group.removeStudent')}
                                icon={<DeleteIcon />}
                                size="sm"
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => handleRemoveStudent(member.id)}
                              />
                            </Td>
                          )}
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}

              {/* Модальное окно добавления студентов */}
              <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader>{t('group.addStudentsTitle')}</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    <Stack spacing={4}>
                      {/* Настройки по умолчанию */}
                      <FormControl>
                        <FormLabel>{t('group.defaultRole')}</FormLabel>
                        <Select
                          value={defaultRole}
                          onChange={(e) => setDefaultRole(e.target.value)}
                        >
                          <option value="member">{t('group.roleMember')}</option>
                          <option value="monitor">{t('group.roleModerator')}</option>
                        </Select>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {t('group.defaultRoleHelp')}
                        </Text>
                      </FormControl>

                      {/* Поиск студентов */}
                      <FormControl>
                        <FormLabel>{t('group.searchStudents')}</FormLabel>
                        <Flex>
                          <Input
                            placeholder={t('group.searchStudentsPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            mr={2}
                          />
                          <IconButton
                            aria-label={t('search')}
                            icon={<SearchIcon />}
                            onClick={fetchStudents}
                            isLoading={loadingStudents}
                          />
                        </Flex>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {t('group.searchStudentsHelp')}
                        </Text>
                      </FormControl>

                      {studentSearchError && (
                        <Alert status="info">
                          <AlertIcon />
                          {studentSearchError}
                        </Alert>
                      )}

                      {/* Результаты поиска */}
                      {students.length > 0 && (
                        <Box maxH="200px" overflowY="auto" borderWidth="1px" borderRadius="md" p={2}>
                          <VStack align="stretch" spacing={1}>
                            {students.map((student) => {
                              const isSelected = selectedStudents.some(s => s.id === student.id);
                              return (
                                <Box 
                                  key={student.id}
                                  p={2}
                                  borderRadius="md"
                                  bg={isSelected ? highlightBg : 'transparent'}
                                  _hover={{ bg: isSelected ? highlightBg : hoverBg }}
                                  cursor="pointer"
                                  onClick={() => toggleStudentSelection(student)}
                                >
                                  <Flex justify="space-between" align="center">
                                    <HStack>
                                      <Checkbox 
                                        isChecked={isSelected}
                                        onChange={() => {}} // Обработчик на родительском элементе
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <Box>
                                        <Text fontWeight="medium">{getStudentFullName(student)}</Text>
                                        <Text fontSize="xs" color="gray.500">{student.user.email}</Text>
                                      </Box>
                                    </HStack>
                                    {isSelected && (
                                      <Badge colorScheme={
                                        selectedStudents.find(s => s.id === student.id)?.role === 'monitor' 
                                          ? 'purple' 
                                          : 'blue'
                                      }>
                                        {selectedStudents.find(s => s.id === student.id)?.role === 'monitor' 
                                          ? t('group.roleModerator') 
                                          : t('group.roleMember')}
                                      </Badge>
                                    )}
                                  </Flex>
                                </Box>
                              );
                            })}
                          </VStack>
                        </Box>
                      )}

                      {/* Выбранные студенты */}
                      {selectedStudents.length > 0 && (
                        <Box>
                          <Flex justify="space-between" align="center" mb={2}>
                            <Heading as="h4" size="sm">{t('group.selectedStudents')} ({selectedStudents.length})</Heading>
                            <Button 
                              size="xs" 
                              variant="ghost" 
                              onClick={() => setSelectedStudents([])}
                            >
                              {t('group.clearSelection')}
                            </Button>
                          </Flex>
                          <Box maxH="200px" overflowY="auto" borderWidth="1px" borderRadius="md" p={2}>
                            <Table size="sm" variant="simple">
                              <Thead>
                                <Tr>
                                  <Th>{t('group.name')}</Th>
                                  <Th>{t('group.role')}</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {selectedStudents.map((student) => (
                                  <Tr key={student.id}>
                                    <Td>
                                      <Text>{student.name}</Text>
                                      <Text fontSize="xs" color="gray.500">{student.email}</Text>
                                    </Td>
                                    <Td>
                                      <Select 
                                        size="xs"
                                        value={student.role}
                                        onChange={(e) => changeStudentRole(student.id, e.target.value)}
                                      >
                                        <option value="member">{t('group.roleMember')}</option>
                                        <option value="monitor">{t('group.roleModerator')}</option>
                                      </Select>
                                    </Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </Box>
                        </Box>
                      )}
                    </Stack>
                  </ModalBody>

                  <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>
                      {t('common.cancel')}
                    </Button>
                    <Button
                      colorScheme="brand"
                      onClick={handleAddStudents}
                      isLoading={submitting}
                      loadingText={t('group.addingStudents')}
                      isDisabled={selectedStudents.length === 0}
                      leftIcon={<CheckIcon />}
                    >
                      {t('group.addStudents')} ({selectedStudents.length})
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </TabPanel>

            {/* Преподаватели */}
            <TabPanel p={0}>
              {/* Кнопка добавления преподавателей */}
              {isTeacher() && (
                <Flex justifyContent="flex-end" mb={4}>
                  <Button 
                    leftIcon={<AddIcon />}
                    colorScheme="brand"
                    onClick={onTeacherModalOpen}
                  >
                    {t('group.addTeachers')}
                  </Button>
                </Flex>
              )}

              {/* Таблица преподавателей */}
              {!currentGroup?.teachers || currentGroup.teachers.length === 0 ? (
                <Alert status="info">
                  <AlertIcon />
                  {t('group.noTeachers')}
                </Alert>
              ) : (
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>{t('group.teacherName')}</Th>
                        <Th>{t('group.memberJoinedAt')}</Th>
                        {isTeacher() && <Th width="100px">{t('common.actions')}</Th>}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {currentGroup.teachers.map((teacher) => (
                        <Tr key={teacher.id}>
                          <Td>{teacher.teacher_name}</Td>
                          <Td>{new Date(teacher.joined_at).toLocaleDateString()}</Td>
                          {isTeacher() && (
                            <Td>
                              <IconButton
                                aria-label={t('group.removeTeacher')}
                                icon={<DeleteIcon />}
                                size="sm"
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => handleRemoveTeacher(teacher.id)}
                              />
                            </Td>
                          )}
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}

              {/* Модальное окно добавления преподавателей */}
              <Modal isOpen={isTeacherModalOpen} onClose={onTeacherModalClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader>{t('group.addTeachersTitle')}</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    {/* Форма поиска преподавателей */}
                    <FormControl mb={4}>
                      <FormLabel>{t('group.searchTeachers')}</FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <SearchIcon color="gray.400" />
                        </InputLeftElement>
                        <Input
                          placeholder={t('group.searchTeachersPlaceholder')}
                          value={teacherSearchQuery}
                          onChange={(e) => setTeacherSearchQuery(e.target.value)}
                        />
                      </InputGroup>
                      <Text fontSize="sm" color="gray.500" mt={1}>
                        {t('group.searchTeachersHelp')}
                      </Text>
                    </FormControl>

                    {/* Ошибка поиска преподавателей */}
                    {teacherSearchError && (
                      <Alert status="warning" mb={4}>
                        <AlertIcon />
                        {teacherSearchError}
                      </Alert>
                    )}

                    {/* Список найденных преподавателей */}
                    {loadingTeachers ? (
                      <Stack spacing={4}>
                        <Skeleton height="60px" />
                        <Skeleton height="60px" />
                        <Skeleton height="60px" />
                      </Stack>
                    ) : (
                      teachers.length > 0 && (
                        <Box mb={6}>
                          <Heading size="sm" mb={2}>
                            {t('group.foundTeachers')} ({teachers.length})
                          </Heading>
                          <VStack align="stretch" spacing={2} maxH="200px" overflowY="auto">
                            {teachers.map((teacher) => (
                              <Box
                                key={teacher.id}
                                p={2}
                                borderWidth="1px"
                                borderRadius="md"
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                bg={selectedTeachers.some(s => s.id === teacher.id) ? highlightBg : undefined}
                                _hover={{ bg: hoverBg }}
                                transition="background-color 0.2s"
                              >
                                <Box>
                                  <Text fontWeight="medium">{getTeacherFullName(teacher)}</Text>
                                  <Text fontSize="sm" color="gray.500">{teacher.user.email}</Text>
                                </Box>
                                <Checkbox
                                  isChecked={selectedTeachers.some(s => s.id === teacher.id)}
                                  onChange={() => toggleTeacherSelection(teacher)}
                                />
                              </Box>
                            ))}
                          </VStack>
                        </Box>
                      )
                    )}

                    {/* Список выбранных преподавателей */}
                    {selectedTeachers.length > 0 && (
                      <Box mb={4}>
                        <HStack justify="space-between" mb={2}>
                          <Heading size="sm">
                            {t('group.selectedTeachers')} ({selectedTeachers.length})
                          </Heading>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => setSelectedTeachers([])}
                          >
                            {t('group.clearSelection')}
                          </Button>
                        </HStack>
                        <VStack align="stretch" spacing={2} maxH="200px" overflowY="auto">
                          {selectedTeachers.map((teacher) => (
                            <Box
                              key={teacher.id}
                              p={2}
                              borderWidth="1px"
                              borderRadius="md"
                              display="flex"
                              justifyContent="space-between"
                              alignItems="center"
                              bg={highlightBg}
                            >
                              <Box>
                                <Text fontWeight="medium">{teacher.name}</Text>
                                <Text fontSize="sm" color="gray.500">{teacher.email}</Text>
                              </Box>
                              <IconButton
                                aria-label="Remove"
                                icon={<DeleteIcon />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => setSelectedTeachers(prev => prev.filter(s => s.id !== teacher.id))}
                              />
                            </Box>
                          ))}
                        </VStack>
                      </Box>
                    )}
                  </ModalBody>

                  <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onTeacherModalClose}>
                      {t('common.cancel')}
                    </Button>
                    <Button
                      colorScheme="brand"
                      isLoading={submittingTeachers}
                      loadingText={t('group.addingTeachers')}
                      onClick={handleAddTeachers}
                      isDisabled={selectedTeachers.length === 0}
                      leftIcon={<AddIcon />}
                    >
                      {t('group.addTeachers')}
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </TabPanel>
          </TabPanels>
        </Tabs>

        <Flex justify="flex-start" mt={8}>
          <Button
            leftIcon={<ChevronLeftIcon />}
            onClick={() => router.push(`/groups/${id}`)}
          >
            {t('group.backToGroupDetails')}
          </Button>
        </Flex>
      </Container>
    </Layout>
  );
};

const GroupMembersPageWithProvider = () => (
  <ProtectedRoute>
    <GroupProvider>
      <GroupMembersPage />
    </GroupProvider>
  </ProtectedRoute>
);

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'ru', ['common'])),
    },
  };
};

export default GroupMembersPageWithProvider; 