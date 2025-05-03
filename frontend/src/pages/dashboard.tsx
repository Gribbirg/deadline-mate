import React, { useEffect, useState } from 'react';
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
  SimpleGrid,
  Link,
  LinkBox,
  LinkOverlay,
  Icon,
  HStack,
} from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { useRouter } from 'next/router';
import { GroupProvider, useGroups, Group } from '../contexts/GroupContext';
import { FaUsers, FaUserGraduate } from 'react-icons/fa';
import NextLink from 'next/link';

// Компонент карточки группы
const GroupCard = ({ group }: { group: Group }) => {
  const { t } = useTranslation('common');
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeBadgeColor = useColorModeValue('green.50', 'green.900');
  const activeBadgeTextColor = useColorModeValue('green.700', 'green.200');
  const inactiveBadgeColor = useColorModeValue('red.50', 'red.900');
  const inactiveBadgeTextColor = useColorModeValue('red.700', 'red.200');
  const codeColor = useColorModeValue('gray.600', 'gray.400');
  
  return (
    <Box 
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      overflow="hidden"
      transition="all 0.3s"
      _hover={{ 
        transform: 'translateY(-4px)', 
        shadow: 'md', 
        borderColor: 'brand.400'
      }}
    >
      <Box p={4} position="relative">
        <Flex justifyContent="space-between" alignItems="center" mb={2}>
          <Heading 
            as="h3" 
            size="md" 
            isTruncated
            noOfLines={1}
            fontWeight="700"
          >
            <NextLink href={`/groups/${group.id}`} passHref legacyBehavior>
              <Link _hover={{ textDecoration: 'none' }}>
                {group.name}
              </Link>
            </NextLink>
          </Heading>
          <Box 
            py={1} 
            px={2} 
            bg={group.is_active ? activeBadgeColor : inactiveBadgeColor} 
            borderRadius="md"
          >
            <Text 
              fontSize="xs" 
              fontWeight="bold"
              color={group.is_active ? activeBadgeTextColor : inactiveBadgeTextColor}
            >
              {group.is_active ? t('group.active') : t('group.inactive')}
            </Text>
          </Box>
        </Flex>
        
        <Text fontSize="sm" color={codeColor} mb={3}>
          {t('group.code')}: <strong>{group.code}</strong>
        </Text>
        
        {group.description && (
          <Text color="gray.500" fontSize="sm" noOfLines={2} mb={4}>
            {group.description}
          </Text>
        )}
      </Box>
      
      <Divider />
      
      <Flex p={3} justifyContent="space-between">
        <HStack spacing={4}>
          <Flex align="center">
            <Icon as={FaUserGraduate} mr={1} color="blue.400" />
            <Text fontSize="sm" fontWeight="medium">
              {group.member_count} 
            </Text>
          </Flex>
          <Flex align="center">
            <Icon as={FaUsers} mr={1} color="purple.400" />
            <Text fontSize="sm" fontWeight="medium">
              {group.teacher_count}
            </Text>
          </Flex>
        </HStack>
        <Text fontSize="xs" color="gray.500">
          {new Date(group.created_at).toLocaleDateString()}
        </Text>
      </Flex>
    </Box>
  );
};

const DashboardContent = () => {
  const { t } = useTranslation('common');
  const { user, isStudent, isTeacher } = useAuth();
  const bgColor = useColorModeValue('white', 'gray.800');
  const router = useRouter();
  const { groups, fetchGroups, loading, error } = useGroups();
  
  useEffect(() => {
    if (isTeacher()) {
      fetchGroups();
    }
  }, [isTeacher, fetchGroups]);
  
  return (
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
          
          <Button 
            colorScheme="brand" 
            size="md"
            onClick={() => router.push('/assignments')}
          >
            {t('dashboard.viewAllAssignments')}
          </Button>
        </Stack>
      )}
      
      {/* Содержимое для преподавателя */}
      {isTeacher() && (
        <Stack spacing={6}>
          <Heading as="h2" size="lg">
            {t('dashboard.teacherSection')}
          </Heading>
          
          <Box 
            borderWidth="1px" 
            borderColor={useColorModeValue('gray.200', 'gray.700')} 
            borderRadius="lg" 
            overflow="hidden"
          >
            <Flex 
              justify="space-between" 
              align="center" 
              bg={useColorModeValue('gray.50', 'gray.800')} 
              p={4} 
              borderBottomWidth="1px" 
              borderColor={useColorModeValue('gray.200', 'gray.700')}
            >
              <Heading as="h3" size="md">
                {t('dashboard.managedGroups')}
              </Heading>
              <HStack>
                <Button 
                  size="sm" 
                  leftIcon={<Icon as={FaUsers} />}
                  colorScheme="brand"
                  variant="outline"
                  onClick={() => router.push('/groups')}
                >
                  {t('dashboard.viewAllGroups')}
                </Button>
                <Button
                  size="sm"
                  colorScheme="brand"
                  leftIcon={<Icon as={FaUsers} />}
                  onClick={() => router.push('/groups/create')}
                >
                  {t('group.create')}
                </Button>
              </HStack>
            </Flex>
            
            <Box p={4}>
              {loading ? (
                <Text p={4}>{t('common.loading')}</Text>
              ) : error ? (
                <Text color="red.500" p={4}>{error}</Text>
              ) : groups.length === 0 ? (
                <Box p={4} textAlign="center">
                  <Text color="gray.500" mb={4}>{t('dashboard.noGroups')}</Text>
                  <Button
                    colorScheme="brand"
                    leftIcon={<Icon as={FaUsers} />}
                    onClick={() => router.push('/groups/create')}
                  >
                    {t('group.create')}
                  </Button>
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {groups.slice(0, 6).map(group => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </SimpleGrid>
              )}
            </Box>
          </Box>
          
          <Box bg={bgColor} p={5} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor={useColorModeValue('gray.200', 'gray.700')}>
            <Heading as="h3" size="md" mb={4}>
              {t('dashboard.createdAssignments')}
            </Heading>
            <Text color="gray.500" mb={4}>{t('dashboard.noCreatedAssignments')}</Text>
            <Button 
              colorScheme="brand" 
              size="md" 
              onClick={() => router.push('/assignments/create')}
            >
              {t('dashboard.createAssignment')}
            </Button>
          </Box>
        </Stack>
      )}
    </Box>
  );
};

const Dashboard = () => {
  return (
    <ProtectedRoute>
      <Layout>
        <GroupProvider>
          <DashboardContent />
        </GroupProvider>
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