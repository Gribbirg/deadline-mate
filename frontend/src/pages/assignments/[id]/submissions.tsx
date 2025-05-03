import React, { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import {
  Box, Container, Heading, Text, Badge, Button, 
  Flex, Stack, Divider, HStack, Link as ChakraLink,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalCloseButton, ModalFooter,
  useToast, Spinner, useColorModeValue
} from '@chakra-ui/react';
import { ChevronLeftIcon, DownloadIcon, ViewIcon } from '@chakra-ui/icons';
import Layout from '../../../components/Layout';
import { useAssignments } from '../../../contexts/AssignmentContext';
import { useAuth } from '../../../contexts/AuthContext';
import { AssignmentProvider } from '../../../contexts/AssignmentContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import NextLink from 'next/link';
import GradeSubmissionForm from '../../../components/assignments/GradeSubmissionForm';
import { Submission } from '../../../contexts/types';

const AssignmentSubmissionsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation('common');
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerColor = useColorModeValue('gray.600', 'gray.300');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');

  const { 
    currentAssignment, 
    fetchAssignment, 
    fetchAssignmentSubmissions, 
    teacherSubmissions,
    loading, 
    error 
  } = useAssignments();

  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Получаем задание
  useEffect(() => {
    if (id && typeof id === 'string') {
      const assignmentId = parseInt(id);
      if (!isNaN(assignmentId)) {
        fetchAssignment(assignmentId);
        fetchAssignmentSubmissions(assignmentId);
      }
    }
  }, [id, fetchAssignment, fetchAssignmentSubmissions]);

  // Получаем ответы для текущего задания
  const submissions = typeof id === 'string' && teacherSubmissions[parseInt(id)] 
    ? teacherSubmissions[parseInt(id)] 
    : [];

  // Открываем модальное окно для оценивания ответа
  const handleGradeSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    onOpen();
  };

  // После успешного оценивания
  const handleGradeSuccess = () => {
    onClose();
    // Обновляем данные
    if (id && typeof id === 'string') {
      const assignmentId = parseInt(id);
      if (!isNaN(assignmentId)) {
        fetchAssignmentSubmissions(assignmentId);
      }
    }
  };

  // Получаем цвет статуса
  const getStatusColorScheme = (status: string) => {
    switch (status) {
      case 'submitted': return 'yellow';
      case 'graded': return 'green';
      case 'returned': return 'red';
      default: return 'gray';
    }
  };

  // Отображаем состояние загрузки
  if (loading && !currentAssignment) {
    return (
      <Layout>
        <Container maxW="container.lg" py={8}>
          <Flex justify="center" align="center" h="50vh">
            <Spinner size="xl" color="blue.500" />
          </Flex>
        </Container>
      </Layout>
    );
  }

  // Отображаем ошибку
  if (error || !currentAssignment) {
    return (
      <Layout>
        <Container maxW="container.lg" py={8}>
          <Heading color="red.500" mb={4}>{t('error')}</Heading>
          <Text color="red.500" mb={4}>{error || t('assignments.error.notFound')}</Text>
          <Button
            leftIcon={<ChevronLeftIcon />}
            onClick={() => router.push('/assignments')}
          >
            {t('common.backToList')}
          </Button>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxW="container.lg" py={8}>
        {/* Хлебные крошки и заголовок */}
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'flex-start', md: 'center' }}
          mb={6}
        >
          <Box>
            <NextLink href={`/assignments/${id}`} passHref legacyBehavior>
              <Button
                as="a"
                leftIcon={<ChevronLeftIcon />}
                variant="outline"
                mb={{ base: 3, md: 0 }}
              >
                {t('assignments.backToAssignment')}
              </Button>
            </NextLink>
          </Box>
          <Heading as="h1" size="lg">
            {t('assignments.submissionsList')} - {currentAssignment.title}
          </Heading>
        </Flex>

        {/* Список ответов */}
        {submissions.length === 0 ? (
          <Box bg={bgColor} p={6} borderRadius="md" shadow="sm" mb={6}>
            <Text align="center" fontSize="lg">
              {t('assignments.noSubmissions')}
            </Text>
          </Box>
        ) : (
          <Box 
            bg={bgColor} 
            borderRadius="md" 
            shadow="sm" 
            mb={6}
            overflowX="auto"
          >
            <TableContainer>
              <Table variant="simple">
                <Thead bg={tableHeaderBg}>
                  <Tr>
                    <Th color={headerColor}>{t('assignments.studentName')}</Th>
                    <Th color={headerColor}>{t('assignments.submissionDate')}</Th>
                    <Th color={headerColor}>{t('assignments.submissionStatus')}</Th>
                    <Th color={headerColor} isNumeric>{t('assignments.form.maxPoints')}</Th>
                    <Th color={headerColor}></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {submissions.map((submission) => (
                    <Tr key={submission.id}>
                      <Td>
                        {submission.student.user.first_name} {submission.student.user.last_name}
                      </Td>
                      <Td>
                        <Text>
                          {new Date(submission.submitted_at).toLocaleString()}
                        </Text>
                        {submission.is_late && (
                          <Badge colorScheme="red" ml={2}>
                            {t('assignments.lateSubmission')}
                          </Badge>
                        )}
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColorScheme(submission.status)}>
                          {t(`assignments.submission.${submission.status}`)}
                        </Badge>
                      </Td>
                      <Td isNumeric>
                        {submission.points !== null 
                          ? submission.points 
                          : '-'}
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <NextLink href={`/submissions/${submission.id}`} passHref legacyBehavior>
                            <Button 
                              as="a"
                              size="sm" 
                              colorScheme="blue"
                              variant="outline"
                            >
                              {t('assignments.viewDetails')}
                            </Button>
                          </NextLink>
                          <Button 
                            size="sm" 
                            colorScheme="blue"
                            onClick={() => handleGradeSubmission(submission)}
                          >
                            {t('assignments.grade')}
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Модальное окно для оценивания ответа */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent bg={bgColor}>
            <ModalHeader>
              {t('assignments.gradeSubmission')}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {selectedSubmission && (
                <Box mb={6}>
                  <Stack spacing={4}>
                    <Box>
                      <Text fontWeight="bold" mb={1}>
                        {t('assignments.studentName')}:
                      </Text>
                      <Text>
                        {selectedSubmission.student.user.first_name} {selectedSubmission.student.user.last_name}
                      </Text>
                    </Box>
                    
                    <Box>
                      <Text fontWeight="bold" mb={1}>
                        {t('assignments.submissionDate')}:
                      </Text>
                      <Text>
                        {new Date(selectedSubmission.submitted_at).toLocaleString()}
                        {selectedSubmission.is_late && (
                          <Badge colorScheme="red" ml={2}>
                            {t('assignments.lateSubmission')}
                          </Badge>
                        )}
                      </Text>
                    </Box>
                    
                    {selectedSubmission.comment && (
                      <Box mb={4}>
                        <Text fontWeight="bold" mb={2}>
                          {t('assignments.submissionComment')}:
                        </Text>
                        <Box
                          p={3}
                          borderWidth="1px"
                          borderColor={borderColor}
                          borderRadius="md"
                          bg={bgColor}
                          whiteSpace="pre-wrap"
                        >
                          {selectedSubmission.comment}
                        </Box>
                      </Box>
                    )}
                    
                    <Divider my={4} />
                    
                    <GradeSubmissionForm 
                      submission={selectedSubmission}
                      assignment={currentAssignment}
                      onSuccess={handleGradeSuccess}
                      onCancel={onClose}
                    />
                  </Stack>
                </Box>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </Layout>
  );
};

const AssignmentSubmissionsPageWithProvider = () => (
  <ProtectedRoute>
    <AssignmentProvider>
      <AssignmentSubmissionsPage />
    </AssignmentProvider>
  </ProtectedRoute>
);

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'ru', ['common'])),
    },
  };
};

export default AssignmentSubmissionsPageWithProvider; 