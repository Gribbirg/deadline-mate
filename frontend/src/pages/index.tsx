import React from 'react';
import { GetServerSideProps } from 'next';
import { Box, Heading, Text, Button, Stack, Flex } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '../components/Layout';

const Home = () => {
  const { t } = useTranslation('common');
  
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
          <Button colorScheme="brand" size="lg">
            {t('login')}
          </Button>
          <Button colorScheme="brand" size="lg" variant="outline">
            {t('register')}
          </Button>
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