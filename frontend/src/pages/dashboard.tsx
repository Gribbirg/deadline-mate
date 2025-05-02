import React from 'react';
import { GetServerSideProps } from 'next';
import {
  Box,
  Heading,
  Text,
  Flex,
  Stack,
  Button,
  Badge,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

const Dashboard = () => {
  const { t } = useTranslation('common');
  const { user, isStudent, isTeacher } = useAuth();
  const bgColor = useColorModeValue('white', 'gray.800');
  
  return (
    <ProtectedRoute>
      <Layout>
        <Box p={4}>
          <Flex
            direction="column"
            align="start"
            mb={6}
          >
            <Heading as="h1" size="xl" mb={2}>
              {t('dashboard.welcome')} {user?.first_name} {user?.last_name}
            </Heading>
            
            <Flex align="center" mt={2}>
              <Text fontSize="md" mr={2}>{t('dashboard.role')}:</Text>
              <Badge colorScheme={isStudent() ? 'green' : 'blue'}>
                {isStudent() ? t('dashboard.student') : t('dashboard.teacher')}
              </Badge>
            </Flex>
          </Flex>
          
          <Divider my={4} />
          
          {/* Содержимое для студента */}
          {isStudent() && (
            <Stack spacing={4}>
              <Heading as="h2" size="lg">
                {t('dashboard.studentSection')}
              </Heading>
              
              <Box bg={bgColor} p={4} borderRadius="md" shadow="md">
                <Heading as="h3" size="md" mb={2}>
                  {t('dashboard.upcomingDeadlines')}
                </Heading>
                <Text color="gray.500">{t('dashboard.noDeadlines')}</Text>
              </Box>
              
              <Box bg={bgColor} p={4} borderRadius="md" shadow="md">
                <Heading as="h3" size="md" mb={2}>
                  {t('dashboard.recentAssignments')}
                </Heading>
                <Text color="gray.500">{t('dashboard.noAssignments')}</Text>
              </Box>
              
              <Button colorScheme="brand" size="md">
                {t('dashboard.viewAllAssignments')}
              </Button>
            </Stack>
          )}
          
          {/* Содержимое для преподавателя */}
          {isTeacher() && (
            <Stack spacing={4}>
              <Heading as="h2" size="lg">
                {t('dashboard.teacherSection')}
              </Heading>
              
              <Box bg={bgColor} p={4} borderRadius="md" shadow="md">
                <Heading as="h3" size="md" mb={2}>
                  {t('dashboard.managedGroups')}
                </Heading>
                <Text color="gray.500">{t('dashboard.noGroups')}</Text>
              </Box>
              
              <Box bg={bgColor} p={4} borderRadius="md" shadow="md">
                <Heading as="h3" size="md" mb={2}>
                  {t('dashboard.createdAssignments')}
                </Heading>
                <Text color="gray.500">{t('dashboard.noCreatedAssignments')}</Text>
              </Box>
              
              <Stack direction="row" spacing={4}>
                <Button colorScheme="brand" size="md">
                  {t('dashboard.createAssignment')}
                </Button>
                <Button colorScheme="brand" variant="outline" size="md">
                  {t('dashboard.createGroup')}
                </Button>
              </Stack>
            </Stack>
          )}
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

export default Dashboard; 