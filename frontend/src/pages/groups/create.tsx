import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import { ChevronLeftIcon, CheckIcon } from '@chakra-ui/icons';
import Layout from '../../components/Layout';
import { GroupProvider, useGroups } from '../../contexts/GroupContext';
import { useAuth } from '../../contexts/AuthContext';
import NextLink from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';

const GroupCreatePage = () => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const toast = useToast();
  const { createGroup, loading, error } = useGroups();
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
      const newGroup = await createGroup(form);
      if (newGroup) {
        toast({
          title: t('group.createSuccess'),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        router.push(`/groups/${newGroup.id}`);
      }
    } catch (err) {
      toast({
        title: t('group.createError'),
        description: String(err),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Проверка прав доступа - только преподаватели могут создавать группы
  if (!isTeacher()) {
    return (
      <Layout>
        <Container maxW="container.md" py={8}>
          <Heading color="red.500" mb={4}>{t('common.accessDenied')}</Heading>
          <Box>{t('group.onlyTeachersCanCreate')}</Box>
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
      <Container maxW="container.md" py={8}>
        {/* Хлебные крошки */}
        <Breadcrumb mb={6}>
          <BreadcrumbItem>
            <NextLink href="/groups" passHref legacyBehavior>
              <BreadcrumbLink>{t('group.breadcrumbGroups')}</BreadcrumbLink>
            </NextLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>{t('group.breadcrumbCreate')}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <Heading as="h1" mb={6}>{t('group.createTitle')}</Heading>

        {error && (
          <Box color="red.500" mb={4}>
            {error}
          </Box>
        )}

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
                onClick={() => router.push('/groups')}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                colorScheme="brand"
                leftIcon={<CheckIcon />}
                isLoading={submitting}
                loadingText={t('group.creating')}
              >
                {t('group.create')}
              </Button>
            </Flex>
          </Stack>
        </Box>
      </Container>
    </Layout>
  );
};

const GroupCreatePageWithProvider = () => (
  <ProtectedRoute>
    <GroupProvider>
      <GroupCreatePage />
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

export default GroupCreatePageWithProvider; 