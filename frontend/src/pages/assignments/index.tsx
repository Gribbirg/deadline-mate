import React from 'react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Box, Container } from '@chakra-ui/react';
import Layout from '../../components/Layout';
import AssignmentList from '../../components/assignments/AssignmentList';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';

const AssignmentsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  // Редирект на страницу входа, если пользователь не авторизован
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);
  
  return (
    <Layout>
      <Container maxW="container.xl" py={8}>
        <AssignmentList />
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

export default AssignmentsPage; 