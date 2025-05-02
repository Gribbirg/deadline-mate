import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Stack,
  useToast,
  FormErrorMessage,
} from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { t } = useTranslation('common');
  const { login, error, isLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState({
    username: '',
    password: '',
  });
  
  const validateForm = () => {
    const errors = {
      username: '',
      password: '',
    };
    
    if (!username) {
      errors.username = t('validation.required');
    }
    
    if (!password) {
      errors.password = t('validation.required');
    }
    
    setFormErrors(errors);
    return !errors.username && !errors.password;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await login(username, password);
      
      toast({
        title: t('loginPage.success'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Редирект произойдет в login функции AuthContext
    } catch (err) {
      // Ошибки обрабатываются в AuthContext
    }
  };
  
  return (
    <Layout>
      <Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg" boxShadow="md">
        <Heading as="h1" size="xl" textAlign="center" mb={6}>
          {t('loginPage.title')}
        </Heading>
        
        {error && (
          <Text color="red.500" textAlign="center" mb={4}>
            {error}
          </Text>
        )}
        
        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            <FormControl isInvalid={!!formErrors.username}>
              <FormLabel>{t('loginPage.username')}</FormLabel>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <FormErrorMessage>{formErrors.username}</FormErrorMessage>
            </FormControl>
            
            <FormControl isInvalid={!!formErrors.password}>
              <FormLabel>{t('loginPage.password')}</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <FormErrorMessage>{formErrors.password}</FormErrorMessage>
            </FormControl>
            
            <Button
              type="submit"
              colorScheme="brand"
              size="lg"
              isLoading={isLoading}
              loadingText={t('loginPage.loading')}
              w="full"
            >
              {t('loginPage.submit')}
            </Button>
          </Stack>
        </form>
        
        <Text mt={4} textAlign="center">
          {t('loginPage.noAccount')}{' '}
          <NextLink href="/register" legacyBehavior>
            <Text as="a" color="brand.500" textDecoration="underline">
              {t('loginPage.register')}
            </Text>
          </NextLink>
        </Text>
      </Box>
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

export default Login; 