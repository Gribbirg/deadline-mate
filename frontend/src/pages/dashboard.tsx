import React, { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import {
  Box,
  Heading,
  Text,
  Flex,
  Stack,
  Button,
  Badge,
  Divider,
  useColorModeValue,
  SimpleGrid,
  Link,
  LinkBox,
  LinkOverlay,
  Icon,
  HStack,
} from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { useRouter } from 'next/router';
import { GroupProvider, useGroups, Group } from '../contexts/GroupContext';
import { useAssignments } from '../contexts/AssignmentContext';
import { FaUsers, FaUserGraduate, FaClipboardList, FaClock, FaCheckCircle } from 'react-icons/fa';
import { Assignment } from '../contexts/types';
import NextLink from 'next/link';

// Компонент карточки группы
const GroupCard = ({ group }: { group: Group }) => {
  const { t } = useTranslation('common');
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeBadgeColor = useColorModeValue('green.50', 'green.900');
  const activeBadgeTextColor = useColorModeValue('green.700', 'green.200');
  const inactiveBadgeColor = useColorModeValue('red.50', 'red.900');
  const inactiveBadgeTextColor = useColorModeValue('red.700', 'red.200');
  const codeColor = useColorModeValue('gray.600', 'gray.400');
  
  return (
    <Box 
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      overflow="hidden"
      transition="all 0.3s"
      _hover={{ 
        transform: 'translateY(-4px)', 
        shadow: 'md', 
        borderColor: 'brand.400'
      }}
    >
      <Box p={4} position="relative">
        <Flex justifyContent="space-between" alignItems="center" mb={2}>
          <Heading 
            as="h3" 
            size="md" 
            isTruncated
            noOfLines={1}
            fontWeight="700"
          >
            <NextLink href={`/groups/${group.id}`} passHref legacyBehavior>
              <Link _hover={{ textDecoration: 'none' }}>
                {group.name}
              </Link>
            </NextLink>
          </Heading>
          <Box 
            py={1} 
            px={2} 
            bg={group.is_active ? activeBadgeColor : inactiveBadgeColor} 
            borderRadius="md"
          >
            <Text 
              fontSize="xs" 
              fontWeight="bold"
              color={group.is_active ? activeBadgeTextColor : inactiveBadgeTextColor}
            >
              {group.is_active ? t('group.active') : t('group.inactive')}
            </Text>
          </Box>
        </Flex>
        
        <Text fontSize="sm" color={codeColor} mb={3}>
          {t('group.code')}: <strong>{group.code}</strong>
        </Text>
        
        {group.description && (
          <Text color="gray.500" fontSize="sm" noOfLines={2} mb={4}>
            {group.description}
          </Text>
        )}
      </Box>
      
      <Divider />
      
      <Flex p={3} justifyContent="space-between">
        <HStack spacing={4}>
          <Flex align="center">
            <Icon as={FaUserGraduate} mr={1} color="blue.400" />
            <Text fontSize="sm" fontWeight="medium">
              {group.member_count} 
            </Text>
          </Flex>
          <Flex align="center">
            <Icon as={FaUsers} mr={1} color="purple.400" />
            <Text fontSize="sm" fontWeight="medium">
              {group.teacher_count}
            </Text>
          </Flex>
        </HStack>
        <Text fontSize="xs" color="gray.500">
          {new Date(group.created_at).toLocaleDateString()}
        </Text>
      </Flex>
    </Box>
  );
};

// Компонент карточки задания для дашборда
const AssignmentCard = ({ assignment }: { assignment: Assignment }) => {
  const { t } = useTranslation('common');
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Определяем цвет для статуса задания
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'gray';
      case 'published': return 'green';
      case 'archived': return 'purple';
      default: return 'gray';
    }
  };
  
  // Определяем цвет для времени до дедлайна
  const getDeadlineColor = (isExpired: boolean, timeRemaining: string | null) => {
    if (isExpired) return 'red.500';
    if (!timeRemaining) return 'gray.500';
    
    if (timeRemaining.includes('д')) return 'green.500';
    if (timeRemaining.includes('ч')) {
      const hours = parseInt(timeRemaining);
      return hours > 24 ? 'green.500' : hours > 6 ? 'yellow.500' : 'orange.500';
    }
    return 'red.500';
  };
  
  return (
    <Box
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      bg={bgColor}
      p={3}
      shadow="sm"
      transition="all 0.2s"
      _hover={{ shadow: 'md', borderColor: 'blue.200' }}
    >
      <NextLink href={`/assignments/${assignment.id}`} passHref legacyBehavior>
        <Link _hover={{ textDecoration: 'none' }}>
          <Flex justify="space-between" align="center" mb={2}>
            <Heading fontSize="md" noOfLines={1}>{assignment.title}</Heading>
            <Badge colorScheme={getStatusColor(assignment.status)} ml={2}>
              {t(`assignments.status.${assignment.status}`)}
            </Badge>
          </Flex>
          
          <Text fontSize="sm" noOfLines={2} mb={3} color="gray.500">
            {assignment.description}
          </Text>
          
          <Flex justify="space-between" align="center">
            <Flex align="center">
              <Icon as={FaClock} mr={1} />
              <Text fontSize="sm" color={getDeadlineColor(assignment.is_deadline_expired, assignment.time_remaining)}>
                {assignment.is_deadline_expired 
                  ? t('assignments.deadline.expired') 
                  : assignment.time_remaining 
                    ? t('assignments.deadline.remaining', { time: assignment.time_remaining })
                    : t('assignments.deadline.unknown')}
              </Text>
            </Flex>
            <Text fontSize="xs" color="gray.500">
              {new Date(assignment.deadline).toLocaleDateString()}
            </Text>
          </Flex>
        </Link>
      </NextLink>
    </Box>
  );
};

const DashboardContent = () => {
  const { t } = useTranslation('common');
  const { user, isStudent, isTeacher } = useAuth();
  const bgColor = useColorModeValue('white', 'gray.800');
  const router = useRouter();
  const { groups, fetchGroups, loading: groupsLoading } = useGroups();
  const { 
    assignments, 
    studentSubmissions, 
    fetchAssignments, 
    fetchStudentSubmissions,
    loading: assignmentsLoading
  } = useAssignments();
  
  // Загрузка данных при монтировании компонента
  useEffect(() => {
    if (isTeacher()) {
      fetchGroups();
      fetchAssignments();
    } else if (isStudent()) {
      fetchAssignments();
      fetchStudentSubmissions();
    }
  }, [isTeacher, isStudent, fetchGroups, fetchAssignments, fetchStudentSubmissions]);
  
  // Фильтруем задания с ближайшими дедлайнами
  const upcomingAssignments = assignments
    .filter(a => !a.is_deadline_expired && a.status === 'published')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);
  
  // Фильтруем недавно созданные задания (для преподавателя)
  const recentAssignments = assignments
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);
  
  // Получаем отправленные/оцененные задания для студента
  const submittedAssignments = studentSubmissions
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
    .slice(0, 3);
  
  return (
    <Box p={4}>
      <Flex
        direction="column"
        align="start"
        mb={6}
      >
        <Heading as="h1" size="xl" mb={2}>
          {t('dashboard.welcome')} {user?.first_name} {user?.last_name}
        </Heading>
        
        <Flex align="center" mt={2}>
          <Text fontSize="md" mr={2}>{t('dashboard.role')}:</Text>
          <Badge colorScheme={isStudent() ? 'green' : 'blue'}>
            {isStudent() ? t('dashboard.student') : t('dashboard.teacher')}
          </Badge>
        </Flex>
      </Flex>
      
      <Divider my={4} />
      
      {/* Содержимое для студента */}
      {isStudent() && (
        <Stack spacing={6}>
          <Heading as="h2" size="lg">
            {t('dashboard.studentSection')}
          </Heading>
          
          <Box bg={bgColor} p={4} borderRadius="md" shadow="md">
            <Flex justify="space-between" align="center" mb={4}>
              <Heading as="h3" size="md">
                {t('dashboard.upcomingDeadlines')}
              </Heading>
              <NextLink href="/assignments" passHref legacyBehavior>
                <Link color="blue.500" fontWeight="medium">
                  {t('dashboard.viewAll')}
                </Link>
              </NextLink>
            </Flex>
            
            {upcomingAssignments.length > 0 ? (
              <Stack spacing={4}>
                {upcomingAssignments.map(assignment => (
                  <AssignmentCard key={assignment.id} assignment={assignment} />
                ))}
              </Stack>
            ) : (
              <Text color="gray.500">{t('dashboard.noDeadlines')}</Text>
            )}
          </Box>
          
          <Box bg={bgColor} p={4} borderRadius="md" shadow="md">
            <Flex justify="space-between" align="center" mb={4}>
              <Heading as="h3" size="md">
                {t('dashboard.yourSubmissions')}
              </Heading>
              <NextLink href="/assignments" passHref legacyBehavior>
                <Link color="blue.500" fontWeight="medium">
                  {t('dashboard.viewAll')}
                </Link>
              </NextLink>
            </Flex>
            
            {submittedAssignments.length > 0 ? (
              <Stack spacing={4}>
                {submittedAssignments.map(submission => (
                  <Box 
                    key={submission.id}
                    p={3}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                  >
                    <Flex justify="space-between" align="center" mb={2}>
                      <Heading fontSize="md" noOfLines={1}>
                        <NextLink href={`/assignments/${submission.assignment.id}`} passHref legacyBehavior>
                          <Link>{submission.assignment.title}</Link>
                        </NextLink>
                      </Heading>
                      <Badge colorScheme={submission.status === 'graded' ? 'green' : 'yellow'}>
                        {t(`assignments.submission.${submission.status}`)}
                      </Badge>
                    </Flex>
                    <Flex justify="space-between" fontSize="sm" color="gray.500">
                      <Text>{new Date(submission.submitted_at).toLocaleString()}</Text>
                      {submission.points !== null && (
                        <Text fontWeight="bold">
                          {t('assignments.submission.points', { points: submission.points })}
                        </Text>
                      )}
                    </Flex>
                    <Flex justify="flex-end" mt={2}>
                      <NextLink href={`/submissions/${submission.id}`} passHref legacyBehavior>
                        <Button as="a" size="sm" variant="outline" colorScheme="blue">
                          {t('assignments.viewSubmission')}
                        </Button>
                      </NextLink>
                    </Flex>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Text color="gray.500">{t('dashboard.noSubmissions')}</Text>
            )}
          </Box>
          
          <Button 
            colorScheme="blue" 
            size="md"
            onClick={() => router.push('/assignments')}
          >
            {t('dashboard.viewAllAssignments')}
          </Button>
        </Stack>
      )}
      
      {/* Содержимое для преподавателя */}
      {isTeacher() && (
        <Stack spacing={6}>
          <Heading as="h2" size="lg">
            {t('dashboard.teacherSection')}
          </Heading>
          
          <Box 
            borderWidth="1px" 
            borderColor={useColorModeValue('gray.200', 'gray.700')} 
            borderRadius="lg" 
            overflow="hidden"
          >
            <Flex 
              bg={useColorModeValue('gray.50', 'gray.900')} 
              p={4}
              justify="space-between"
              align="center"
            >
              <Heading size="md">{t('dashboard.yourGroups')}</Heading>
              <Button
                colorScheme="blue"
                variant="outline"
                size="sm"
                onClick={() => router.push('/groups/create')}
              >
                {t('dashboard.createGroup')}
              </Button>
            </Flex>
            
            <Box p={4}>
              {groups.length > 0 ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {groups.slice(0, 6).map(group => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </SimpleGrid>
              ) : (
                <Box textAlign="center" py={6}>
                  <Text color="gray.500" mb={4}>{t('dashboard.noGroups')}</Text>
                  <Button
                    colorScheme="blue"
                    onClick={() => router.push('/groups/create')}
                  >
                    {t('dashboard.createFirstGroup')}
                  </Button>
                </Box>
              )}
              
              {groups.length > 6 && (
                <Box textAlign="center" mt={4}>
                  <Button
                    variant="ghost"
                    colorScheme="blue"
                    onClick={() => router.push('/groups')}
                  >
                    {t('dashboard.viewAllGroups')}
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
          
          <Box bg={bgColor} p={4} borderRadius="md" shadow="md">
            <Flex justify="space-between" align="center" mb={4}>
              <Heading as="h3" size="md">
                {t('dashboard.recentAssignments')}
              </Heading>
              <NextLink href="/assignments" passHref legacyBehavior>
                <Link color="blue.500" fontWeight="medium">
                  {t('dashboard.viewAll')}
                </Link>
              </NextLink>
            </Flex>
            
            {recentAssignments.length > 0 ? (
              <Stack spacing={4}>
                {recentAssignments.map(assignment => (
                  <AssignmentCard key={assignment.id} assignment={assignment} />
                ))}
              </Stack>
            ) : (
              <Box textAlign="center" py={6}>
                <Text color="gray.500" mb={4}>{t('dashboard.noAssignments')}</Text>
                <Button
                  colorScheme="green"
                  onClick={() => router.push('/assignments/create')}
                >
                  {t('dashboard.createFirstAssignment')}
                </Button>
              </Box>
            )}
          </Box>
          
          <Flex gap={4}>
            <Button 
              colorScheme="blue" 
              size="md"
              onClick={() => router.push('/groups')}
              flex={1}
            >
              {t('dashboard.manageGroups')}
            </Button>
            <Button 
              colorScheme="green" 
              size="md"
              onClick={() => router.push('/assignments')}
              flex={1}
            >
              {t('dashboard.manageAssignments')}
            </Button>
          </Flex>
        </Stack>
      )}
    </Box>
  );
};

const Dashboard = () => {
  return (
    <ProtectedRoute>
      <Layout>
        <GroupProvider>
          <DashboardContent />
        </GroupProvider>
      </Layout>
    </ProtectedRoute>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'ru', ['common'])),
    },
  };
};

export default Dashboard; 