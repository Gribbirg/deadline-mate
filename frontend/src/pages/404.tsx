import React from 'react';
import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  VStack,
  useColorModeValue
} from '@chakra-ui/react';
import NextLink from 'next/link';
import Layout from '../components/Layout';
import Logo from '../components/Logo';

const NotFoundPage = () => {
  const { t } = useTranslation('common');
  const bgColor = useColorModeValue('white', 'gray.800');
  
  return (
    <Layout>
      <Flex 
        align="center" 
        justify="center" 
        direction="column" 
        minH="70vh"
      >
        <Box 
          p={10} 
          bg={bgColor} 
          borderRadius="lg" 
          boxShadow="md" 
          textAlign="center" 
          maxW="md" 
          width="full"
        >
          <VStack spacing={6}>
            <Logo size={120} showText={false} />
            
            <Heading size="xl">404</Heading>
            <Text fontSize="xl">{t('notFound')}</Text>
            <Text>{t('notFoundMessage')}</Text>
            
            <NextLink href="/" passHref>
              <Button colorScheme="brand" size="lg">
                {t('backToHome')}
              </Button>
            </NextLink>
          </VStack>
        </Box>
      </Flex>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'ru', ['common'])),
    },
  };
};

export default NotFoundPage; 