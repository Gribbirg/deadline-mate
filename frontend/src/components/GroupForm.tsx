import React, { useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  Button,
  Stack,
  useToast,
  Switch,
  FormHelperText,
} from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { Group, useGroups } from '../contexts/GroupContext';

interface GroupFormProps {
  initialData?: Partial<Group>;
  isEditing?: boolean;
}

const GroupForm: React.FC<GroupFormProps> = ({
  initialData = {},
  isEditing = false,
}) => {
  const { t } = useTranslation('common');
  const { createGroup, updateGroup, loading } = useGroups();
  const router = useRouter();
  const toast = useToast();

  const [formData, setFormData] = useState<Partial<Group>>({
    name: '',
    description: '',
    is_active: true,
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = t('validation.required');
    } else if (formData.name.length > 100) {
      newErrors.name = t('validation.tooLong', { max: 100 });
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = t('validation.tooLong', { max: 500 });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      if (isEditing && initialData.id) {
        await updateGroup(initialData.id, formData);
        toast({
          title: t('group.updateSuccess'),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        router.push(`/groups/${initialData.id}`);
      } else {
        const newGroup = await createGroup(formData);
        if (newGroup) {
          toast({
            title: t('group.createSuccess'),
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          router.push(`/groups/${newGroup.id}`);
        }
      }
    } catch (error) {
      toast({
        title: isEditing ? t('group.updateError') : t('group.createError'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <Stack spacing={6}>
        <FormControl isRequired isInvalid={!!errors.name}>
          <FormLabel>{t('group.name')}</FormLabel>
          <Input
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
          />
          <FormErrorMessage>{errors.name}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.description}>
          <FormLabel>{t('group.description')}</FormLabel>
          <Textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={4}
          />
          <FormErrorMessage>{errors.description}</FormErrorMessage>
          <FormHelperText>{t('group.descriptionHelp')}</FormHelperText>
        </FormControl>

        {isEditing && (
          <FormControl display="flex" alignItems="center">
            <FormLabel htmlFor="is_active" mb="0">
              {t('group.isActive')}
            </FormLabel>
            <Switch
              id="is_active"
              name="is_active"
              isChecked={formData.is_active}
              onChange={handleSwitchChange}
            />
          </FormControl>
        )}

        <Stack direction="row" spacing={4} justifyContent="flex-end">
          <Button
            variant="outline"
            onClick={() => router.push('/groups')}
            colorScheme="gray"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            colorScheme="brand"
            isLoading={loading}
            loadingText={
              isEditing ? t('group.updating') : t('group.creating')
            }
          >
            {isEditing ? t('group.update') : t('group.create')}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default GroupForm; 