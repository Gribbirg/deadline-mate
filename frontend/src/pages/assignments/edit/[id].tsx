import React, { useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Box, Container, Heading, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Spinner, Flex, Text, useColorModeValue } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import Layout from '../../../components/Layout';
import AssignmentForm from '../../../components/assignments/AssignmentForm';
import { useAuth } from '../../../contexts/AuthContext';
import { useAssignments } from '../../../contexts/AssignmentContext';
import Link from 'next/link';

const EditAssignmentPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, isTeacher } = useAuth();
  const { currentAssignment, fetchAssignment, loading, error } = useAssignments();
  const { t } = useTranslation('common');
  
  // Загрузка задания при монтировании или изменении ID
  useEffect(() => {
    if (isAuthenticated && id && isTeacher()) {
      fetchAssignment(Number(id));
    }
  }, [isAuthenticated, id, isTeacher, fetchAssignment]);
  
  // Редирект, если пользователь не авторизован или не является преподавателем
  useEffect(() => {
    if (isAuthenticated === false) {
      router.push('/login');
    } else if (isAuthenticated && !isTeacher()) {
      router.push('/assignments');
    }
  }, [isAuthenticated, isTeacher, router]);
  
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
            <Text color="red.500">{error || t('assignments.error.notFound')}</Text>
          </Box>
        </Container>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <Container maxW="container.xl" py={8}>
        <Breadcrumb mb={6}>
          <BreadcrumbItem>
            <Link href="/dashboard" passHref>
              <BreadcrumbLink>{t('nav.dashboard')}</BreadcrumbLink>
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link href="/assignments" passHref>
              <BreadcrumbLink>{t('nav.assignments')}</BreadcrumbLink>
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link href={`/assignments/${id}`} passHref>
              <BreadcrumbLink>{currentAssignment.title}</BreadcrumbLink>
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>{t('assignments.edit')}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        
        <Heading size="lg" mb={6}>
          {t('assignments.editTitle', { title: currentAssignment.title })}
        </Heading>
        
        <Box bg={useColorModeValue('white', 'gray.800')} p={6} borderRadius="md" shadow="sm">
          <AssignmentForm 
            initialData={currentAssignment}
            onSuccess={() => router.push(`/assignments/${id}`)}
          />
        </Box>
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

export default EditAssignmentPage; 