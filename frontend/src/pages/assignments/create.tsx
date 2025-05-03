import React, { useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Container, Heading, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Box, useColorModeValue } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import Layout from '../../components/Layout';
import AssignmentForm from '../../components/assignments/AssignmentForm';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';

const CreateAssignmentPage: React.FC = () => {
  const { isAuthenticated, isTeacher } = useAuth();
  const router = useRouter();
  const { t } = useTranslation('common');
  
  // Редирект, если пользователь не авторизован или не является преподавателем
  useEffect(() => {
    if (isAuthenticated === false) {
      router.push('/login');
    } else if (isAuthenticated && !isTeacher()) {
      router.push('/assignments');
    }
  }, [isAuthenticated, isTeacher, router]);
  
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
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>{t('assignments.create')}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        
        <Heading size="lg" mb={6}>{t('assignments.createNew')}</Heading>
        
        <Box bg={useColorModeValue('white', 'gray.800')} p={6} borderRadius="md" shadow="sm">
          <AssignmentForm />
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

export default CreateAssignmentPage; 