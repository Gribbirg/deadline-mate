import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
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
  Divider,
  Avatar,
  Center,
  Flex,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  useColorModeValue,
} from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import axios from 'axios';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const Profile = () => {
  const { t } = useTranslation('common');
  const { user, isStudent, isTeacher } = useAuth();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Данные профиля для редактирования
  const [formData, setFormData] = useState({
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    current_password: '',
    new_password: '',
    student_profile: {
      major: user?.student_profile?.major || '',
      year_of_study: user?.student_profile?.year_of_study || '',
      bio: user?.student_profile?.bio || '',
    },
    teacher_profile: {
      position: user?.teacher_profile?.position || '',
      department: user?.teacher_profile?.department || '',
      academic_degree: user?.teacher_profile?.academic_degree || '',
      bio: user?.teacher_profile?.bio || '',
    },
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent as keyof typeof formData] as any,
          [child]: value,
        },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  const validateProfileForm = () => {
    // Базовая валидация для простых полей
    if (!formData.email || !formData.first_name || !formData.last_name) {
      return false;
    }
    
    // Если указан новый пароль, проверяем что указан текущий
    if (formData.new_password && !formData.current_password) {
      return false;
    }
    
    return true;
  };
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      toast({
        title: t('profile.validationError'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Подготавливаем данные для отправки
      const updateData: any = {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
      };
      
      // Добавляем профиль по роли
      if (isStudent()) {
        updateData.student_profile = formData.student_profile;
      } else if (isTeacher()) {
        updateData.teacher_profile = formData.teacher_profile;
      }
      
      // Добавляем пароли если они заполнены
      if (formData.current_password) {
        updateData.current_password = formData.current_password;
        if (formData.new_password) {
          updateData.new_password = formData.new_password;
        }
      }
      
      // Отправляем запрос на обновление
      const token = localStorage.getItem('access_token');
      const response = await axios.put(`${API_URL}/auth/profile/`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      toast({
        title: t('profile.updateSuccess'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Сбрасываем пароли после успешного обновления
      setFormData({
        ...formData,
        current_password: '',
        new_password: '',
      });
    } catch (err: any) {
      console.error('Profile update error:', err);
      const errorMessage = err.response?.data?.detail 
        || Object.values(err.response?.data || {}).flat().join(', ')
        || t('profile.updateError');
      setError(errorMessage as string);
      
      toast({
        title: t('profile.updateError'),
        description: errorMessage as string,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <ProtectedRoute>
      <Layout>
        <Box maxW="container.md" mx="auto" p={4}>
          <Flex direction={{ base: 'column', md: 'row' }} mb={6} align="center">
            <Center mb={{ base: 4, md: 0 }} mr={{ md: 6 }}>
              <Avatar 
                size="2xl" 
                name={`${user?.first_name} ${user?.last_name}`} 
                src={user?.student_profile?.avatar || user?.teacher_profile?.avatar}
              />
            </Center>
            
            <Box>
              <Heading as="h1" size="xl">
                {user?.first_name} {user?.last_name}
              </Heading>
              <Text color="gray.500" fontSize="lg">
                {user?.email}
              </Text>
              <Text mt={2} fontWeight="bold">
                {isStudent() ? t('profile.student') : t('profile.teacher')}
              </Text>
            </Box>
          </Flex>
          
          <Divider my={6} />
          
          <Tabs variant="enclosed">
            <TabList>
              <Tab>{t('profile.personalInfo')}</Tab>
              <Tab>{t('profile.security')}</Tab>
              {isStudent() && <Tab>{t('profile.studentInfo')}</Tab>}
              {isTeacher() && <Tab>{t('profile.teacherInfo')}</Tab>}
            </TabList>
            
            <TabPanels>
              {/* Личная информация */}
              <TabPanel>
                <Box bg={bgColor} p={6} borderRadius="md" shadow="md">
                  <form onSubmit={handleProfileUpdate}>
                    <Stack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>{t('profile.firstName')}</FormLabel>
                        <Input
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>{t('profile.lastName')}</FormLabel>
                        <Input
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>{t('profile.email')}</FormLabel>
                        <Input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </FormControl>
                      
                      <Button
                        mt={4}
                        colorScheme="brand"
                        isLoading={isLoading}
                        type="submit"
                      >
                        {t('profile.saveChanges')}
                      </Button>
                    </Stack>
                  </form>
                </Box>
              </TabPanel>
              
              {/* Безопасность */}
              <TabPanel>
                <Box bg={bgColor} p={6} borderRadius="md" shadow="md">
                  <form onSubmit={handleProfileUpdate}>
                    <Stack spacing={4}>
                      <FormControl>
                        <FormLabel>{t('profile.currentPassword')}</FormLabel>
                        <Input
                          name="current_password"
                          type="password"
                          value={formData.current_password}
                          onChange={handleInputChange}
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>{t('profile.newPassword')}</FormLabel>
                        <Input
                          name="new_password"
                          type="password"
                          value={formData.new_password}
                          onChange={handleInputChange}
                        />
                      </FormControl>
                      
                      <Button
                        mt={4}
                        colorScheme="brand"
                        isLoading={isLoading}
                        type="submit"
                      >
                        {t('profile.changePassword')}
                      </Button>
                    </Stack>
                  </form>
                </Box>
              </TabPanel>
              
              {/* Информация студента */}
              {isStudent() && (
                <TabPanel>
                  <Box bg={bgColor} p={6} borderRadius="md" shadow="md">
                    <form onSubmit={handleProfileUpdate}>
                      <Stack spacing={4}>
                        <FormControl>
                          <FormLabel>{t('profile.major')}</FormLabel>
                          <Input
                            name="student_profile.major"
                            value={formData.student_profile.major}
                            onChange={handleInputChange}
                          />
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel>{t('profile.yearOfStudy')}</FormLabel>
                          <Input
                            name="student_profile.year_of_study"
                            type="number"
                            min={1}
                            max={6}
                            value={formData.student_profile.year_of_study}
                            onChange={handleInputChange}
                          />
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel>{t('profile.bio')}</FormLabel>
                          <Input
                            name="student_profile.bio"
                            value={formData.student_profile.bio}
                            onChange={handleInputChange}
                          />
                        </FormControl>
                        
                        <Button
                          mt={4}
                          colorScheme="brand"
                          isLoading={isLoading}
                          type="submit"
                        >
                          {t('profile.saveChanges')}
                        </Button>
                      </Stack>
                    </form>
                  </Box>
                </TabPanel>
              )}
              
              {/* Информация преподавателя */}
              {isTeacher() && (
                <TabPanel>
                  <Box bg={bgColor} p={6} borderRadius="md" shadow="md">
                    <form onSubmit={handleProfileUpdate}>
                      <Stack spacing={4}>
                        <FormControl>
                          <FormLabel>{t('profile.position')}</FormLabel>
                          <Input
                            name="teacher_profile.position"
                            value={formData.teacher_profile.position}
                            onChange={handleInputChange}
                          />
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel>{t('profile.department')}</FormLabel>
                          <Input
                            name="teacher_profile.department"
                            value={formData.teacher_profile.department}
                            onChange={handleInputChange}
                          />
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel>{t('profile.academicDegree')}</FormLabel>
                          <Input
                            name="teacher_profile.academic_degree"
                            value={formData.teacher_profile.academic_degree}
                            onChange={handleInputChange}
                          />
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel>{t('profile.bio')}</FormLabel>
                          <Input
                            name="teacher_profile.bio"
                            value={formData.teacher_profile.bio}
                            onChange={handleInputChange}
                          />
                        </FormControl>
                        
                        <Button
                          mt={4}
                          colorScheme="brand"
                          isLoading={isLoading}
                          type="submit"
                        >
                          {t('profile.saveChanges')}
                        </Button>
                      </Stack>
                    </form>
                  </Box>
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>
        </Box>
      </Layout>
    </ProtectedRoute>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'ru', ['common'])),
    },
  };
};

export default Profile; 