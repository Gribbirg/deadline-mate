import React, { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import {
  Box,
  Container,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  FormErrorMessage,
  Stack,
  useToast,
  Switch,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  Skeleton,
} from '@chakra-ui/react';
import { ChevronLeftIcon, CheckIcon } from '@chakra-ui/icons';
import Layout from '../../../components/Layout';
import { GroupProvider, useGroups } from '../../../contexts/GroupContext';
import { useAuth } from '../../../contexts/AuthContext';
import NextLink from 'next/link';
import ProtectedRoute from '../../../components/ProtectedRoute';

const GroupEditPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation('common');
  const toast = useToast();
  const { currentGroup, fetchGroup, loading, error, updateGroup } = useGroups();
  const { isTeacher } = useAuth();

  const [form, setForm] = useState({
    name: '',
    description: '',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Загрузка данных группы
  useEffect(() => {
    if (id) {
      fetchGroup(Number(id));
    }
  }, [id, fetchGroup]);

  // Заполнение формы данными группы
  useEffect(() => {
    if (currentGroup) {
      setForm({
        name: currentGroup.name,
        description: currentGroup.description || '',
        is_active: currentGroup.is_active,
      });
    }
  }, [currentGroup]);

  // Валидация формы
  const validateForm = () => {
    const errors = {
      name: '',
    };
    let isValid = true;

    if (!form.name.trim()) {
      errors.name = t('group.errorNameRequired');
      isValid = false;
    } else if (form.name.length > 100) {
      errors.name = t('group.errorNameTooLong');
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Обработка изменений формы
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Обработка изменения чекбокса
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await updateGroup(Number(id), form);
      if (result) {
        toast({
          title: t('group.updateSuccess'),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        router.push(`/groups/${id}`);
      }
    } catch (err) {
      toast({
        title: t('group.updateError'),
        description: String(err),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Отображение загрузки
  if (loading && !currentGroup) {
    return (
      <Layout>
        <Container maxW="container.md" py={8}>
          <Skeleton height="40px" mb={6} />
          <Skeleton height="20px" mb={4} />
          <Skeleton height="20px" mb={4} />
          <Skeleton height="300px" mb={6} />
        </Container>
      </Layout>
    );
  }

  // Отображение ошибки
  if (error) {
    return (
      <Layout>
        <Container maxW="container.md" py={8}>
          <Heading color="red.500" mb={4}>{t('error')}</Heading>
          <Box color="red.500" mb={4}>{error}</Box>
          <Button
            leftIcon={<ChevronLeftIcon />}
            onClick={() => router.push('/groups')}
          >
            {t('group.backToGroups')}
          </Button>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxW="container.md" py={8}>
        {/* Хлебные крошки */}
        <Breadcrumb mb={6}>
          <BreadcrumbItem>
            <NextLink href="/groups" passHref legacyBehavior>
              <BreadcrumbLink>{t('group.breadcrumbGroups')}</BreadcrumbLink>
            </NextLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <NextLink href={`/groups/${id}`} passHref legacyBehavior>
              <BreadcrumbLink>{currentGroup?.name}</BreadcrumbLink>
            </NextLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>{t('group.edit')}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <Heading as="h1" mb={6}>{t('group.editTitle')}</Heading>

        <Box as="form" onSubmit={handleSubmit}>
          <Stack spacing={4}>
            <FormControl isRequired isInvalid={!!formErrors.name}>
              <FormLabel>{t('group.nameLabel')}</FormLabel>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder={t('group.namePlaceholder')}
              />
              <FormErrorMessage>{formErrors.name}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>{t('group.descriptionLabel')}</FormLabel>
              <Textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder={t('group.descriptionPlaceholder')}
                resize="vertical"
                rows={4}
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="is_active" mb="0">
                {t('group.isActiveLabel')}
              </FormLabel>
              <Switch
                id="is_active"
                name="is_active"
                isChecked={form.is_active}
                onChange={handleSwitchChange}
                colorScheme="green"
              />
            </FormControl>

            <Flex justify="space-between" mt={6}>
              <Button
                variant="outline"
                leftIcon={<ChevronLeftIcon />}
                onClick={() => router.push(`/groups/${id}`)}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                colorScheme="brand"
                leftIcon={<CheckIcon />}
                isLoading={submitting}
                loadingText={t('saving')}
              >
                {t('save')}
              </Button>
            </Flex>
          </Stack>
        </Box>
      </Container>
    </Layout>
  );
};

const GroupEditPageWithProvider = () => (
  <ProtectedRoute>
    <GroupProvider>
      <GroupEditPage />
    </GroupProvider>
  </ProtectedRoute>
);

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'ru', ['common'])),
    },
  };
};

export default GroupEditPageWithProvider; 