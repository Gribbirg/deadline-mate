import React, { useEffect, useCallback } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import {
  Box,
  Container,
  Heading,
  Text,
  Badge,
  Button,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Stack,
  IconButton,
  useToast,
  Skeleton,
} from '@chakra-ui/react';
import { ChevronLeftIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import NextLink from 'next/link';
import Layout from '../../../components/Layout';
import { GroupProvider, useGroups } from '../../../contexts/GroupContext';
import { useAuth } from '../../../contexts/AuthContext';

const GroupDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation('common');
  const { currentGroup, fetchGroup, loading, error, removeStudentFromGroup, removeTeacherFromGroup, joinAsTeacher } = useGroups();
  const { isTeacher, user } = useAuth();
  const toast = useToast();

  // Загрузка данных группы при монтировании компонента
  useEffect(() => {
    if (id) {
      fetchGroup(Number(id));
    }
  }, [id, fetchGroup]);

  // Проверка, является ли текущий пользователь создателем группы
  const isGroupCreator = () => {
    return isTeacher() && currentGroup && user?.teacher_profile?.id === currentGroup.created_by;
  };

  // Обработчик удаления студента из группы
  const handleRemoveStudent = async (membershipId: number) => {
    if (window.confirm(t('group.confirmRemoveStudent'))) {
      try {
        const success = await removeStudentFromGroup(Number(id), membershipId);
        if (success) {
          toast({
            title: t('group.removeStudentSuccess'),
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (err) {
        toast({
          title: t('group.removeStudentError'),
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  // Обработчик удаления преподавателя из группы
  const handleRemoveTeacher = async (teacherId: number) => {
    if (window.confirm(t('group.confirmRemoveTeacher'))) {
      try {
        const success = await removeTeacherFromGroup(Number(id), teacherId);
        if (success) {
          toast({
            title: t('group.removeTeacherSuccess'),
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (err) {
        toast({
          title: t('group.removeTeacherError'),
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  // Проверка, является ли текущий пользователь преподавателем группы
  const isTeacherInGroup = useCallback(() => {
    if (!currentGroup?.teachers || !user?.teacher_profile?.id) return false;
    
    // Проверяем, является ли пользователь создателем группы
    if (user.teacher_profile.id === currentGroup.created_by) return true;
    
    // Проверяем, есть ли пользователь в списке преподавателей группы
    return currentGroup.teachers.some(
      teacher => teacher.teacher === user.teacher_profile.id && teacher.is_active
    );
  }, [currentGroup, user]);

  // Обработчик присоединения к группе в качестве преподавателя
  const handleJoinAsTeacher = async () => {
    try {
      await joinAsTeacher(Number(id));
      toast({
        title: t('group.joinAsTeacherSuccess'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: t('group.joinAsTeacherError'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Отображение загрузки
  if (loading) {
    return (
      <Layout>
        <Container maxW="container.xl" py={8}>
          <Skeleton height="40px" mb={6} />
          <Skeleton height="20px" mb={4} />
          <Skeleton height="20px" mb={4} />
          <Skeleton height="300px" mb={6} />
        </Container>
      </Layout>
    );
  }

  // Отображение ошибки
  if (error || !currentGroup) {
    return (
      <Layout>
        <Container maxW="container.xl" py={8}>
          <Text color="red.500">{error || t('group.notFound')}</Text>
          <Button
            leftIcon={<ChevronLeftIcon />}
            onClick={() => router.push('/groups')}
            mt={4}
          >
            {t('group.backToGroups')}
          </Button>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxW="container.xl" py={8}>
        {/* Хлебные крошки */}
        <Breadcrumb mb={6}>
          <BreadcrumbItem>
            <NextLink href="/groups" passHref legacyBehavior>
              <BreadcrumbLink>{t('group.breadcrumbGroups')}</BreadcrumbLink>
            </NextLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>{currentGroup.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        {/* Заголовок и кнопки действий */}
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Heading as="h1" size="xl">
              {currentGroup.name}
            </Heading>
            <Flex align="center" mt={2}>
              <Badge colorScheme={currentGroup.is_active ? 'green' : 'red'} mr={4}>
                {currentGroup.is_active ? t('group.active') : t('group.inactive')}
              </Badge>
              <Text fontSize="sm" color="gray.600">
                {t('group.code')}: <strong>{currentGroup.code}</strong>
              </Text>
            </Flex>
          </Box>

          <Stack direction="row">
            {isTeacher() && (
              <>
                <NextLink href={`/groups/${currentGroup.id}/edit`} passHref legacyBehavior>
                  <Button as="a" leftIcon={<EditIcon />} colorScheme="brand">
                    {t('group.edit')}
                  </Button>
                </NextLink>
                <NextLink href={`/groups/${currentGroup.id}/members`} passHref legacyBehavior>
                  <Button as="a" colorScheme="brand" variant="outline">
                    {t('group.manageMembers')}
                  </Button>
                </NextLink>
                {isTeacher() && !isTeacherInGroup() && (
                  <Button 
                    colorScheme="blue" 
                    onClick={handleJoinAsTeacher}
                  >
                    {t('group.becomeTeacher')}
                  </Button>
                )}
              </>
            )}
          </Stack>
        </Flex>

        {/* Описание */}
        {currentGroup.description && (
          <Box mb={8}>
            <Heading as="h3" size="md" mb={2}>
              {t('group.description')}
            </Heading>
            <Text>{currentGroup.description}</Text>
          </Box>
        )}

        {/* Информация о создателе */}
        <Box mb={6}>
          <Text fontSize="sm" color="gray.600">
            {t('group.createdBy')}: <strong>{currentGroup.created_by_name}</strong>
          </Text>
          <Text fontSize="sm" color="gray.600">
            {t('group.createdAt')}: {new Date(currentGroup.created_at).toLocaleDateString()}
          </Text>
        </Box>

        <Divider my={6} />

        {/* Список преподавателей */}
        <Box mb={8}>
          <Heading as="h3" size="md" mb={4}>
            {t('group.teachers')} ({currentGroup.teachers?.length || 0})
          </Heading>

          {!currentGroup.teachers || currentGroup.teachers.length === 0 ? (
            <Text>{t('group.noTeachers')}</Text>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>{t('group.teacherName')}</Th>
                  <Th>{t('group.memberJoinedAt')}</Th>
                  {isGroupCreator() && <Th width="100px">{t('common.actions')}</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {currentGroup.teachers.map((teacher) => (
                  <Tr key={teacher.id}>
                    <Td>{teacher.teacher_name}</Td>
                    <Td>{new Date(teacher.joined_at).toLocaleDateString()}</Td>
                    {isGroupCreator() && (
                      <Td>
                        <IconButton
                          aria-label={t('group.removeTeacher')}
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleRemoveTeacher(teacher.id)}
                        />
                      </Td>
                    )}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>

        {/* Список участников */}
        <Box>
          <Heading as="h3" size="md" mb={4}>
            {t('group.members')} ({currentGroup.members?.length || 0})
          </Heading>

          {!currentGroup.members || currentGroup.members.length === 0 ? (
            <Text>{t('group.noMembers')}</Text>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>{t('group.memberName')}</Th>
                  <Th>{t('group.memberRole')}</Th>
                  <Th>{t('group.memberJoinedAt')}</Th>
                  {isTeacher() && <Th width="100px">{t('common.actions')}</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {currentGroup.members.map((member) => (
                  <Tr key={member.id}>
                    <Td>{member.student_name}</Td>
                    <Td>
                      <Badge colorScheme={member.role === 'monitor' ? 'purple' : 'blue'}>
                        {member.role === 'monitor'
                          ? t('group.roleModerator')
                          : t('group.roleMember')}
                      </Badge>
                    </Td>
                    <Td>{new Date(member.joined_at).toLocaleDateString()}</Td>
                    {isTeacher() && (
                      <Td>
                        <IconButton
                          aria-label={t('group.removeStudent')}
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleRemoveStudent(member.id)}
                        />
                      </Td>
                    )}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
      </Container>
    </Layout>
  );
};

const GroupDetailPageWithProvider = () => (
  <GroupProvider>
    <GroupDetailPage />
  </GroupProvider>
);

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'ru', ['common'])),
    },
  };
};

export default GroupDetailPageWithProvider; 