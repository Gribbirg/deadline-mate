import React, { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Box, Heading, Container, Text, Button, Center, useToast } from '@chakra-ui/react';
import Layout from '../../components/Layout';
import GroupList from '../../components/GroupList';
import { GroupProvider, useGroups } from '../../contexts/GroupContext';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';

const GroupsPage = () => {
  const { t } = useTranslation('common');
  const { isTeacher, isAuthenticated, isLoading: authLoading } = useAuth();
  const { fetchGroups, loading: groupsLoading, error: groupsError } = useGroups();
  const router = useRouter();
  const toast = useToast();
  const [fetchAttempted, setFetchAttempted] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !authLoading && !fetchAttempted) {
      console.log('Authenticated, fetching groups');
      fetchGroups().catch(err => {
        console.error('Error in fetchGroups effect:', err);
        toast({
          title: 'Error loading groups',
          description: `${err.message || 'Unknown error'}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      });
      setFetchAttempted(true);
    } else if (!authLoading && !isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, fetchGroups, router, toast, fetchAttempted]);

  const handleRetry = () => {
    console.log('Retrying group fetch');
    setFetchAttempted(false);
  };

  if (authLoading) {
    return (
      <Layout>
        <Container maxW="container.xl" py={8}>
          <Center h="200px">
            <Text>{t('common.loading')}</Text>
          </Center>
        </Container>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <Container maxW="container.xl" py={8}>
          <Center h="200px" flexDirection="column">
            <Text mb={4}>{t('common.notAuthenticated')}</Text>
            <Button colorScheme="brand" onClick={() => router.push('/login')}>
              {t('login')}
            </Button>
          </Center>
        </Container>
      </Layout>
    );
  }

  if (groupsError) {
    return (
      <Layout>
        <Container maxW="container.xl" py={8}>
          <Center h="200px" flexDirection="column">
            <Text color="red.500" fontSize="lg" mb={4}>{groupsError}</Text>
            <Button colorScheme="brand" onClick={handleRetry}>
              {t('common.retry')}
            </Button>
          </Center>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxW="container.xl" py={8}>
        <GroupList 
          title={isTeacher() ? t('group.myGroups') : t('group.enrolledGroups')} 
        />
      </Container>
    </Layout>
  );
};

const GroupsPageWithProvider = () => (
  <GroupProvider>
    <GroupsPage />
  </GroupProvider>
);

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'ru', ['common'])),
    },
  };
};

export default GroupsPageWithProvider; 