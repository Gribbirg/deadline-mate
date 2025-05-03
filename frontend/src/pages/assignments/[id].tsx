import React, { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { 
  Box, Container, Heading, Text, Badge, Button, 
  Flex, Stack, Divider, HStack, Link as ChakraLink,
  Tabs, TabList, Tab, TabPanels, TabPanel,
  useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalCloseButton, ModalFooter,
  useToast, Spinner, useColorModeValue
} from '@chakra-ui/react';
import Layout from '../../components/Layout';
import AssignmentForm from '../../components/assignments/AssignmentForm';
import AssignToGroupForm from '../../components/assignments/AssignToGroupForm';
import SubmissionForm from '../../components/assignments/SubmissionForm';
import { useAuth } from '../../contexts/AuthContext';
import { useAssignments } from '../../contexts/AssignmentContext';
import Link from 'next/link';
import { FiArrowLeft, FiEdit, FiTrash2, FiUpload, FiUsers } from 'react-icons/fi';

const AssignmentDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { 
    currentAssignment, fetchAssignment, 
    loading, error, deleteAssignment 
  } = useAssignments();
  const { isAuthenticated, isTeacher, isStudent } = useAuth();
  const { t } = useTranslation('common');
  const toast = useToast();
  
  // Модальное окно для редактирования
  const { 
    isOpen: isEditOpen, 
    onOpen: onEditOpen, 
    onClose: onEditClose 
  } = useDisclosure();
  
  // Модальное окно для подтверждения удаления
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();
  
  // Состояние для формы отправки решения
  const [isSubmitFormVisible, setIsSubmitFormVisible] = useState(false);
  
  // Загрузка задания при монтировании или изменении ID
  useEffect(() => {
    if (isAuthenticated && id) {
      fetchAssignment(Number(id)).catch(error => {
        toast({
          title: t('assignments.error.load'),
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      });
    }
  }, [isAuthenticated, id, fetchAssignment, toast, t]);
  
  // Редирект на страницу входа, если пользователь не авторизован
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);
  
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
  
  // Обработчик удаления задания
  const handleDelete = async () => {
    if (!currentAssignment) return;
    
    try {
      const success = await deleteAssignment(currentAssignment.id);
      if (success) {
        toast({
          title: t('assignments.deleteSuccess'),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        router.push('/assignments');
      }
    } catch (error: any) {
      toast({
        title: t('assignments.error.delete'),
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
    }
  };
  
  // Отображение загрузки
  if (loading) {
    return (
      <Layout>
        <Container maxW="container.xl" py={8}>
          <Flex justify="center" align="center" minH="400px">
            <Spinner size="xl" color="blue.500" />
          </Flex>
        </Container>
      </Layout>
    );
  }
  
  // Отображение ошибки
  if (error || !currentAssignment) {
    return (
      <Layout>
        <Container maxW="container.xl" py={8}>
          <Box textAlign="center" p={5}>
            <Heading size="lg" mb={4}>
              {t('assignments.error.notFound')}
            </Heading>
            <Text color="red.500" mb={6}>
              {error || t('assignments.error.generic')}
            </Text>
            <Button 
              leftIcon={<FiArrowLeft />} 
              colorScheme="blue" 
              onClick={() => router.push('/assignments')}
            >
              {t('common.backToList')}
            </Button>
          </Box>
        </Container>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <Container maxW="container.xl" py={8}>
        {/* Навигация */}
        <Flex justify="space-between" align="center" mb={6}>
          <Link href="/assignments" passHref>
            <Button as="a" leftIcon={<FiArrowLeft />} variant="ghost">
              {t('common.backToList')}
            </Button>
          </Link>
          
          {isTeacher() && (
            <HStack>
              <Link href={`/assignments/${id}/submissions`} passHref>
                <Button 
                  as="a"
                  colorScheme="blue" 
                  mr={2}
                >
                  {t('assignments.viewSubmissions')}
                </Button>
              </Link>
              <Button 
                leftIcon={<FiEdit />} 
                colorScheme="blue" 
                onClick={onEditOpen}
              >
                {t('common.edit')}
              </Button>
              <Button 
                leftIcon={<FiTrash2 />} 
                colorScheme="red" 
                variant="outline"
                onClick={onDeleteOpen}
              >
                {t('common.delete')}
              </Button>
            </HStack>
          )}
        </Flex>
        
        {/* Основная информация */}
        <Box bg={useColorModeValue('white', 'gray.800')} p={6} borderRadius="md" shadow="sm" mb={6}>
          <Flex justify="space-between" align="start" mb={4}>
            <Heading size="lg">{currentAssignment.title}</Heading>
            <Badge colorScheme={getStatusColor(currentAssignment.status)} p={2} borderRadius="md">
              {t(`assignments.status.${currentAssignment.status}`)}
            </Badge>
          </Flex>
          
          <Stack spacing={4}>
            <Flex justify="flex-end" align="center">
              <Text 
                fontWeight="bold" 
                color={getDeadlineColor(
                  currentAssignment.is_deadline_expired, 
                  currentAssignment.time_remaining
                )}
              >
                {currentAssignment.is_deadline_expired 
                  ? t('assignments.deadline.expired') 
                  : currentAssignment.time_remaining 
                    ? t('assignments.deadline.remaining', { time: currentAssignment.time_remaining }) 
                    : t('assignments.deadline.unknown')}
              </Text>
            </Flex>
            
            <Divider />
            
            <Text whiteSpace="pre-wrap">
              {currentAssignment.description}
            </Text>
            
            <Divider />
            
            <Stack>
              <Text fontWeight="bold">{t('assignments.details')}:</Text>
              <HStack>
                <Text fontWeight="medium">{t('assignments.form.deadline')}:</Text>
                <Text>{new Date(currentAssignment.deadline).toLocaleString()}</Text>
              </HStack>
              <HStack>
                <Text fontWeight="medium">{t('assignments.form.maxPoints')}:</Text>
                <Text>{currentAssignment.max_points}</Text>
              </HStack>
              <HStack>
                <Text fontWeight="medium">{t('assignments.form.allowLate')}:</Text>
                <Text>
                  {currentAssignment.allow_late_submissions 
                    ? t('common.yes') 
                    : t('common.no')}
                </Text>
              </HStack>
              {currentAssignment.allow_late_submissions && (
                <HStack>
                  <Text fontWeight="medium">{t('assignments.form.latePenalty')}:</Text>
                  <Text>{currentAssignment.late_penalty_percentage}%</Text>
                </HStack>
              )}
            </Stack>
            
            {currentAssignment.attachments.length > 0 && (
              <>
                <Divider />
                <Stack>
                  <Text fontWeight="bold" mb={2}>{t('assignments.attachments')}:</Text>
                  {currentAssignment.attachments.map(attachment => (
                    <ChakraLink 
                      key={attachment.id}
                      href={attachment.file}
                      isExternal
                      color="blue.500"
                    >
                      {attachment.filename}
                    </ChakraLink>
                  ))}
                </Stack>
              </>
            )}
          </Stack>
          
          {/* Кнопки управления заданием */}
          <Flex mt={8} justify="space-between">
            {isTeacher() && (
              <AssignToGroupForm
                assignment={currentAssignment}
                onSuccess={() => fetchAssignment(currentAssignment.id)}
              />
            )}
            
            {isStudent() && (
              <Button
                leftIcon={<FiUpload />}
                colorScheme="green"
                onClick={() => setIsSubmitFormVisible(!isSubmitFormVisible)}
              >
                {t('assignments.submit')}
              </Button>
            )}
          </Flex>
        </Box>
        
        {/* Форма отправки решения для студента */}
        {isStudent() && isSubmitFormVisible && (
          <Box bg={useColorModeValue('white', 'gray.800')} p={6} borderRadius="md" shadow="sm" mb={6}>
            <SubmissionForm
              assignment={currentAssignment}
              onSuccess={() => {
                setIsSubmitFormVisible(false);
                fetchAssignment(currentAssignment.id);
              }}
            />
          </Box>
        )}
        
        {/* Модальное окно редактирования задания */}
        <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{t('assignments.edit')}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <AssignmentForm
                initialData={currentAssignment}
                onSuccess={() => {
                  onEditClose();
                  fetchAssignment(currentAssignment.id);
                }}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
        
        {/* Модальное окно подтверждения удаления */}
        <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{t('assignments.deleteConfirmTitle')}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>
                {t('assignments.deleteConfirmText', { title: currentAssignment.title })}
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" mr={3} onClick={onDeleteClose}>
                {t('common.cancel')}
              </Button>
              <Button colorScheme="red" onClick={handleDelete}>
                {t('common.delete')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'ru', ['common'])),
    },
  };
};

export default AssignmentDetailPage; 