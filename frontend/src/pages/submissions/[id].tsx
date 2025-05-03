import React, { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import {
  Box, Container, Heading, Text, Badge, Button, 
  Flex, Stack, Divider, HStack,
  useToast, Spinner, useColorModeValue
} from '@chakra-ui/react';
import { ChevronLeftIcon, DownloadIcon, ViewIcon } from '@chakra-ui/icons';
import Layout from '../../components/Layout';
import { useAssignments } from '../../contexts/AssignmentContext';
import { useAuth } from '../../contexts/AuthContext';
import { AssignmentProvider } from '../../contexts/AssignmentContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import NextLink from 'next/link';
import { Submission } from '../../contexts/types';
import axios from 'axios';

const SubmissionDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation('common');
  const toast = useToast();
  const { isAuthenticated, isStudent } = useAuth();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerColor = useColorModeValue('gray.600', 'gray.300');

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем данные ответа
  useEffect(() => {
    if (isAuthenticated && id) {
      setLoading(true);
      setError(null);
      
      const fetchSubmission = async () => {
        try {
          const response = await axios.get(`/api/assignments/submissions/${id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json',
            }
          });
          setSubmission(response.data);
        } catch (err: any) {
          console.error('Error fetching submission:', err);
          setError(err.response?.data?.detail || t('error'));
        } finally {
          setLoading(false);
        }
      };
      
      fetchSubmission();
    }
  }, [id, isAuthenticated, t]);

  // Получаем цвет статуса
  const getStatusColorScheme = (status: string) => {
    switch (status) {
      case 'submitted': return 'yellow';
      case 'graded': return 'green';
      case 'returned': return 'red';
      default: return 'gray';
    }
  };

  // Получаем имя оценившего преподавателя
  const getGraderName = () => {
    if (!submission?.graded_by?.user) return '';
    return `${submission.graded_by.user.first_name} ${submission.graded_by.user.last_name}`;
  };

  // Отображаем состояние загрузки
  if (loading) {
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
  if (error || !submission) {
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
      <Container maxW="container.md" py={8}>
        {/* Хлебные крошки и заголовок */}
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'flex-start', md: 'center' }}
          mb={6}
        >
          <Box>
            <NextLink href={`/assignments/${submission.assignment.id}`} passHref legacyBehavior>
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
            {t('assignments.submissionDetails')}
          </Heading>
        </Flex>

        {/* Детальная информация об ответе */}
        <Box bg={bgColor} p={6} borderRadius="md" shadow="sm" mb={6}>
          <Stack spacing={6}>
            {/* Основная информация о задании */}
            <Stack spacing={4}>
              <Heading size="md">{submission.assignment.title}</Heading>
              <Flex justify="space-between" wrap="wrap" gap={2}>
                <Text color="gray.500">
                  {new Date(submission.submitted_at).toLocaleString()}
                </Text>
                <HStack>
                  <Badge colorScheme={getStatusColorScheme(submission.status)}>
                    {t(`assignments.submission.${submission.status}`)}
                  </Badge>
                  {submission.is_late && (
                    <Badge colorScheme="red">
                      {t('assignments.lateSubmission')}
                    </Badge>
                  )}
                </HStack>
              </Flex>
            </Stack>

            <Divider />

            {/* Ваш комментарий */}
            <Stack spacing={2}>
              <Text fontWeight="bold">{t('assignments.submissionComment')}:</Text>
              <Box
                p={3}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="md"
                whiteSpace="pre-wrap"
              >
                {submission.comment || t('common.empty')}
              </Box>
            </Stack>

            <Divider />

            {/* Оценка и комментарий преподавателя */}
            <Stack spacing={4}>
              <Heading size="md">{t('assignments.feedbackAndGrading')}</Heading>
              
              {/* Оценка */}
              {submission.status === 'graded' ? (
                <Flex 
                  justify="space-between" 
                  align="center" 
                  p={3} 
                  borderWidth="1px" 
                  borderColor="green.200" 
                  bg="green.50" 
                  _dark={{ borderColor: "green.700", bg: "green.900" }}
                  borderRadius="md"
                >
                  <Text fontWeight="bold">{t('assignments.form.maxPoints')}:</Text>
                  <Text fontSize="lg" fontWeight="bold">
                    {submission.points !== null 
                      ? t('assignments.submission.points', { points: submission.points }) 
                      : '-'}
                  </Text>
                </Flex>
              ) : (
                <Text color="gray.500">
                  {submission.status === 'submitted' 
                    ? t('assignments.error.notGradedYet') 
                    : t('assignments.error.returnedForRevision')}
                </Text>
              )}
              
              {/* Отзыв преподавателя */}
              <Stack spacing={2}>
                <Text fontWeight="bold">{t('assignments.feedbackAndGrading')}:</Text>
                <Box
                  p={3}
                  borderWidth="1px"
                  borderRadius="md"
                  whiteSpace="pre-wrap"
                  borderColor={
                    submission.feedback 
                      ? (submission.status === 'graded' ? 'green.200' : 'yellow.200') 
                      : borderColor
                  }
                  bg={
                    submission.feedback 
                      ? (submission.status === 'graded' ? 'green.50' : 'yellow.50') 
                      : 'transparent'
                  }
                  sx={{
                    _dark: {
                      borderColor: submission.feedback 
                        ? (submission.status === 'graded' ? 'green.700' : 'yellow.700') 
                        : borderColor,
                      bg: submission.feedback 
                        ? (submission.status === 'graded' ? 'green.900' : 'yellow.900') 
                        : 'transparent'
                    }
                  }}
                >
                  {submission.feedback || t('common.empty')}
                </Box>
              </Stack>
              
              {/* Информация о преподавателе */}
              {submission.graded_by && submission.graded_by.user && (
                <HStack justify="flex-end" spacing={2} color="gray.500" fontSize="sm">
                  <Text>
                    {t('assignments.gradedBy')}: {getGraderName()}
                  </Text>
                  {submission.graded_at && (
                    <Text>
                      ({new Date(submission.graded_at).toLocaleString()})
                    </Text>
                  )}
                </HStack>
              )}
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Layout>
  );
};

const SubmissionDetailPageWithProvider = () => (
  <ProtectedRoute>
    <AssignmentProvider>
      <SubmissionDetailPage />
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

export default SubmissionDetailPageWithProvider; 