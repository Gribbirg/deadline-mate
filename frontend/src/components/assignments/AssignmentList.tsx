import React, { useEffect } from 'react';
import {
  Box, Heading, Text, SimpleGrid, Badge, Button,
  Flex, Spinner, useDisclosure, useToast
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useAssignments } from '../../contexts/AssignmentContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'next-i18next';
import { Assignment } from '../../contexts/types';

// Компонент карточки задания
const AssignmentCard: React.FC<{ assignment: Assignment }> = ({ assignment }) => {
  const router = useRouter();
  const { isTeacher } = useAuth();
  const { t } = useTranslation('common');
  
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
  
  const handleClick = () => {
    router.push(`/assignments/${assignment.id}`);
  };
  
  return (
    <Box 
      p={5} 
      shadow="md" 
      borderWidth="1px" 
      borderRadius="md"
      _hover={{ shadow: 'lg', transform: 'translateY(-5px)' }}
      transition="all 0.3s"
      cursor="pointer"
      onClick={handleClick}
    >
      <Flex justify="space-between" align="center" mb={2}>
        <Badge colorScheme={getStatusColor(assignment.status)}>
          {t(`assignments.status.${assignment.status}`)}
        </Badge>
        <Text 
          fontSize="sm" 
          color={getDeadlineColor(assignment.is_deadline_expired, assignment.time_remaining)}
          fontWeight="medium"
        >
          {assignment.is_deadline_expired 
            ? t('assignments.deadline.expired') 
            : assignment.time_remaining 
              ? t('assignments.deadline.remaining', { time: assignment.time_remaining }) 
              : t('assignments.deadline.unknown')}
        </Text>
      </Flex>
      
      <Heading fontSize="xl" mb={2} noOfLines={1}>{assignment.title}</Heading>
      <Text noOfLines={2} mb={4} fontSize="sm">{assignment.description}</Text>
      
      <Flex justify="space-between" align="center">
        <Text fontSize="sm" color="gray.500">
          {new Date(assignment.deadline).toLocaleDateString()}
        </Text>
        {isTeacher() && (
          <Text fontSize="sm" color="blue.500">
            {t('assignments.submissions', { count: assignment.submission_count })}
          </Text>
        )}
      </Flex>
    </Box>
  );
};

// Основной компонент списка заданий
const AssignmentList: React.FC = () => {
  const { assignments, loading, error, fetchAssignments } = useAssignments();
  const { isAuthenticated, isTeacher } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { t } = useTranslation('common');
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchAssignments().catch(error => {
        toast({
          title: t('assignments.error.load'),
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      });
    }
  }, [isAuthenticated, fetchAssignments, toast, t]);
  
  const handleCreateNew = () => {
    router.push('/assignments/create');
  };
  
  if (loading) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }
  
  if (error) {
    return (
      <Box textAlign="center" p={5}>
        <Text color="red.500">{error}</Text>
        <Button mt={4} colorScheme="blue" onClick={() => fetchAssignments()}>
          {t('common.retry')}
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">{t('assignments.title')}</Heading>
        {isTeacher() && (
          <Button colorScheme="blue" onClick={handleCreateNew}>
            {t('assignments.create')}
          </Button>
        )}
      </Flex>
      
      {assignments.length === 0 ? (
        <Box textAlign="center" p={10} borderWidth="1px" borderRadius="md">
          <Text>{t('assignments.empty')}</Text>
          {isTeacher() && (
            <Button mt={4} colorScheme="blue" onClick={handleCreateNew}>
              {t('assignments.createFirst')}
            </Button>
          )}
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {assignments.map(assignment => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default AssignmentList; 