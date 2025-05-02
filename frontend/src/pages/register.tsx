import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
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
  Select,
  Collapse,
  Divider,
} from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '../components/Layout';
import { useAuth, RegisterData } from '../contexts/AuthContext';

const Register = () => {
  const { t } = useTranslation('common');
  const { register, error, isLoading } = useAuth();
  const toast = useToast();
  
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    role: 'student',
    student_profile: {
      major: '',
      year_of_study: undefined,
    },
    teacher_profile: {
      position: '',
      department: '',
      academic_degree: '',
    },
  });
  
  const [formErrors, setFormErrors] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
  });
  
  const validateForm = () => {
    const errors = {
      username: '',
      email: '',
      password: '',
      password_confirm: '',
      first_name: '',
      last_name: '',
    };
    
    if (!formData.username) {
      errors.username = t('validation.required');
    }
    
    if (!formData.email) {
      errors.email = t('validation.required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = t('validation.email');
    }
    
    if (!formData.password) {
      errors.password = t('validation.required');
    } else if (formData.password.length < 8) {
      errors.password = t('validation.passwordLength');
    } else if (!/[A-Z]/.test(formData.password) || 
              !/[a-z]/.test(formData.password) || 
              !/[0-9]/.test(formData.password)) {
      errors.password = t('validation.passwordStrength');
    }
    
    if (!formData.password_confirm) {
      errors.password_confirm = t('validation.required');
    } else if (formData.password !== formData.password_confirm) {
      errors.password_confirm = t('validation.passwordMatch');
    }
    
    if (!formData.first_name) {
      errors.first_name = t('validation.required');
    }
    
    if (!formData.last_name) {
      errors.last_name = t('validation.required');
    }
    
    setFormErrors(errors);
    
    return !Object.values(errors).some(error => error);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent as keyof RegisterData] as any,
          [child]: value,
        },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Prepare the data based on role
      const registrationData = { ...formData };
      if (formData.role === 'student') {
        delete registrationData.teacher_profile;
      } else {
        delete registrationData.student_profile;
      }
      
      await register(registrationData);
      
      toast({
        title: t('registerPage.success'),
        description: t('registerPage.successDescription'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      // Errors are handled in the AuthContext
    }
  };
  
  return (
    <Layout>
      <Box maxW="lg" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg" boxShadow="md">
        <Heading as="h1" size="xl" textAlign="center" mb={6}>
          {t('registerPage.title')}
        </Heading>
        
        {error && (
          <Text color="red.500" textAlign="center" mb={4}>
            {error}
          </Text>
        )}
        
        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            <FormControl isInvalid={!!formErrors.username}>
              <FormLabel>{t('registerPage.username')}</FormLabel>
              <Input
                name="username"
                value={formData.username}
                onChange={handleInputChange}
              />
              <FormErrorMessage>{formErrors.username}</FormErrorMessage>
            </FormControl>
            
            <Stack direction={['column', 'row']} spacing={4}>
              <FormControl isInvalid={!!formErrors.first_name}>
                <FormLabel>{t('registerPage.firstName')}</FormLabel>
                <Input
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                />
                <FormErrorMessage>{formErrors.first_name}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!formErrors.last_name}>
                <FormLabel>{t('registerPage.lastName')}</FormLabel>
                <Input
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                />
                <FormErrorMessage>{formErrors.last_name}</FormErrorMessage>
              </FormControl>
            </Stack>
            
            <FormControl isInvalid={!!formErrors.email}>
              <FormLabel>{t('registerPage.email')}</FormLabel>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
              <FormErrorMessage>{formErrors.email}</FormErrorMessage>
            </FormControl>
            
            <Stack direction={['column', 'row']} spacing={4}>
              <FormControl isInvalid={!!formErrors.password}>
                <FormLabel>{t('registerPage.password')}</FormLabel>
                <Input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <FormErrorMessage>{formErrors.password}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!formErrors.password_confirm}>
                <FormLabel>{t('registerPage.confirmPassword')}</FormLabel>
                <Input
                  name="password_confirm"
                  type="password"
                  value={formData.password_confirm}
                  onChange={handleInputChange}
                />
                <FormErrorMessage>{formErrors.password_confirm}</FormErrorMessage>
              </FormControl>
            </Stack>
            
            <FormControl>
              <FormLabel>{t('registerPage.role')}</FormLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="student">{t('registerPage.roleStudent')}</option>
                <option value="teacher">{t('registerPage.roleTeacher')}</option>
              </Select>
            </FormControl>
            
            <Divider my={2} />
            
            {/* Дополнительные поля для студента */}
            <Collapse in={formData.role === 'student'}>
              <Stack spacing={4}>
                <Heading as="h3" size="md">
                  {t('registerPage.studentProfile')}
                </Heading>
                
                <FormControl>
                  <FormLabel>{t('registerPage.major')}</FormLabel>
                  <Input
                    name="student_profile.major"
                    value={formData.student_profile?.major || ''}
                    onChange={handleInputChange}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>{t('registerPage.yearOfStudy')}</FormLabel>
                  <Select
                    name="student_profile.year_of_study"
                    value={formData.student_profile?.year_of_study || ''}
                    onChange={handleInputChange}
                  >
                    <option value="">{t('registerPage.selectYear')}</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                  </Select>
                </FormControl>
              </Stack>
            </Collapse>
            
            {/* Дополнительные поля для преподавателя */}
            <Collapse in={formData.role === 'teacher'}>
              <Stack spacing={4}>
                <Heading as="h3" size="md">
                  {t('registerPage.teacherProfile')}
                </Heading>
                
                <FormControl>
                  <FormLabel>{t('registerPage.position')}</FormLabel>
                  <Input
                    name="teacher_profile.position"
                    value={formData.teacher_profile?.position || ''}
                    onChange={handleInputChange}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>{t('registerPage.department')}</FormLabel>
                  <Input
                    name="teacher_profile.department"
                    value={formData.teacher_profile?.department || ''}
                    onChange={handleInputChange}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>{t('registerPage.academicDegree')}</FormLabel>
                  <Input
                    name="teacher_profile.academic_degree"
                    value={formData.teacher_profile?.academic_degree || ''}
                    onChange={handleInputChange}
                  />
                </FormControl>
              </Stack>
            </Collapse>
            
            <Button
              type="submit"
              colorScheme="brand"
              size="lg"
              isLoading={isLoading}
              loadingText={t('registerPage.loading')}
              w="full"
              mt={4}
            >
              {t('registerPage.submit')}
            </Button>
          </Stack>
        </form>
        
        <Text mt={4} textAlign="center">
          {t('registerPage.haveAccount')}{' '}
          <NextLink href="/login" legacyBehavior>
            <Text as="a" color="brand.500" textDecoration="underline">
              {t('registerPage.login')}
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

export default Register; 