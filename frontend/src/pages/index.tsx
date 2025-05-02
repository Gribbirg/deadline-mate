import React from 'react';
import { GetServerSideProps } from 'next';
import { Box, Heading, Text, Button, Stack, Flex } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '../components/Layout';
import NextLink from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

const Home = () => {
  const { t } = useTranslation('common');
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  // Если пользователь уже аутентифицирован, перенаправляем на дашборд
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);
  
  return (
    <Layout>
      <Flex
        direction="column"
        align="center"
        justify="center"
        minH="70vh"
        gap={4}
        textAlign="center"
      >
        <Heading as="h1" size="2xl">
          {t('welcome')}
        </Heading>
        <Text fontSize="xl" mt={2} maxW="600px">
          {t('description')}
        </Text>
        <Stack direction="row" spacing={4} mt={8}>
          <NextLink href="/login" legacyBehavior>
            <Button as="a" colorScheme="brand" size="lg">
              {t('login')}
            </Button>
          </NextLink>
          <NextLink href="/register" legacyBehavior>
            <Button as="a" colorScheme="brand" size="lg" variant="outline">
              {t('register')}
            </Button>
          </NextLink>
        </Stack>
      </Flex>
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

export default Home; 