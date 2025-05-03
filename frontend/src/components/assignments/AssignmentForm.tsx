import React, { useState } from 'react';
import {
  Box, Button, FormControl, FormLabel, Input,
  Textarea, Select, FormErrorMessage, Stack,
  Switch, NumberInput, NumberInputField, 
  NumberInputStepper, NumberIncrementStepper,
  NumberDecrementStepper, Flex, Text, useToast,
  useColorModeValue, useTheme
} from '@chakra-ui/react';
import { Global } from '@emotion/react';
import { useRouter } from 'next/router';
import { useAssignments } from '../../contexts/AssignmentContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'next-i18next';
import { Assignment, AssignmentFormData } from '../../contexts/types';

interface AssignmentFormProps {
  initialData?: Assignment;
  onSuccess?: () => void;
}

const AssignmentForm: React.FC<AssignmentFormProps> = ({ initialData, onSuccess }) => {
  const router = useRouter();
  const toast = useToast();
  const { createAssignment, updateAssignment, loading } = useAssignments();
  const { isTeacher } = useAuth();
  const { t } = useTranslation('common');
  const theme = useTheme();
  
  // Color mode values for dark theme compatibility
  const bgColor = useColorModeValue('white', 'gray.800');
  const inputBgColor = useColorModeValue('white', 'gray.700');
  const inputBorderColor = useColorModeValue('gray.200', 'gray.600');
  const labelColor = useColorModeValue('gray.700', 'gray.300');
  const primaryButtonBg = useColorModeValue('blue.500', 'blue.400');
  const primaryButtonHoverBg = useColorModeValue('blue.600', 'blue.500');
  const cancelButtonBg = useColorModeValue('gray.100', 'gray.700');
  const cancelButtonHoverBg = useColorModeValue('gray.200', 'gray.600');
  const switchTrackColor = useColorModeValue('blue.500', 'blue.400');
  const stepperBgColor = useColorModeValue('gray.200', 'gray.600');
  const incrementBgColor = useColorModeValue('gray.100', 'gray.700');
  const optionBgColor = useColorModeValue('white', 'gray.700');
  const optionColor = useColorModeValue('gray.800', 'gray.100');
  const optionHoverBgColor = useColorModeValue(theme.colors.gray[100], theme.colors.gray[600]);
  const optionSelectedBgColor = useColorModeValue(theme.colors.blue[50], theme.colors.blue[900]);
  
  // Значения по умолчанию для формы
  const defaultValues: AssignmentFormData = {
    title: '',
    description: '',
    status: 'draft',
    deadline: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // +7 дней
    max_points: 100,
    allow_late_submissions: true,
    late_penalty_percentage: 10
  };
  
  // Инициализация состояния формы
  const [formData, setFormData] = useState<AssignmentFormData>(
    initialData 
      ? {
          title: initialData.title,
          description: initialData.description,
          status: initialData.status,
          deadline: new Date(initialData.deadline).toISOString().slice(0, 16),
          max_points: initialData.max_points,
          allow_late_submissions: initialData.allow_late_submissions,
          late_penalty_percentage: initialData.late_penalty_percentage
        }
      : defaultValues
  );
  
  // Состояние ошибок валидации
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Обработка изменений в форме
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Очищаем ошибку при изменении поля
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Обработка изменений для числовых полей
  const handleNumberChange = (name: string, value: number) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Обработка изменений для переключателей
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  // Валидация формы
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = t('validation.required');
    }
    
    if (!formData.description.trim()) {
      newErrors.description = t('validation.required');
    }
    
    if (!formData.deadline) {
      newErrors.deadline = t('validation.required');
    } else {
      const deadlineDate = new Date(formData.deadline);
      if (isNaN(deadlineDate.getTime())) {
        newErrors.deadline = t('validation.invalidDate');
      }
    }
    
    if (formData.max_points <= 0) {
      newErrors.max_points = t('validation.positiveNumber');
    }
    
    if (formData.late_penalty_percentage < 0 || formData.late_penalty_percentage > 100) {
      newErrors.late_penalty_percentage = t('validation.percentageRange');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isTeacher()) {
      toast({
        title: t('assignments.error.unauthorized'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Валидация формы
    if (!validateForm()) {
      toast({
        title: t('validation.formError'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      if (initialData) {
        // Обновление существующего задания
        const result = await updateAssignment(initialData.id, formData);
        if (result) {
          toast({
            title: t('assignments.updateSuccess'),
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          if (onSuccess) {
            onSuccess();
          } else {
            router.push(`/assignments/${initialData.id}`);
          }
        }
      } else {
        // Создание нового задания
        const result = await createAssignment(formData);
        if (result) {
          toast({
            title: t('assignments.createSuccess'),
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          if (onSuccess) {
            onSuccess();
          } else {
            router.push(`/assignments/${result.id}`);
          }
        }
      }
    } catch (error: any) {
      toast({
        title: initialData 
          ? t('assignments.error.update')
          : t('assignments.error.create'),
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Отмена формы
  const handleCancel = () => {
    if (initialData) {
      router.push(`/assignments/${initialData.id}`);
    } else {
      router.push('/assignments');
    }
  };
  
  return (
    <>
      {/* Global styles to fix select dropdowns and date picker in dark mode */}
      <Global styles={{
        // Style select options in dark mode
        'option': {
          backgroundColor: useColorModeValue('white', theme.colors.gray[700]) + ' !important',
          color: useColorModeValue(theme.colors.gray[800], theme.colors.gray[100]) + ' !important',
        },
        // Style select option hover
        'option:hover, option:focus, option:active': {
          backgroundColor: useColorModeValue(theme.colors.gray[100], theme.colors.gray[600]) + ' !important',
        },
        // Style select option selected
        'option:checked': {
          backgroundColor: useColorModeValue(theme.colors.blue[50], theme.colors.blue[900]) + ' !important',
        },
        // Fix calendar popups for date inputs
        'input[type="datetime-local"]::-webkit-calendar-picker-indicator': {
          filter: useColorModeValue('none', 'invert(1)')
        }
      }} />
      
      <Box 
        as="form" 
        onSubmit={handleSubmit} 
        maxW="800px" 
        mx="auto"
        bg={bgColor}
        p={6}
        borderRadius="md"
        boxShadow="md"
      >
        <Stack spacing={4}>
          <FormControl isRequired isInvalid={!!errors.title}>
            <FormLabel color={labelColor}>{t('assignments.form.title')}</FormLabel>
            <Input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t('assignments.form.titlePlaceholder')}
              bg={inputBgColor}
              borderColor={inputBorderColor}
              color={optionColor}
              _hover={{ borderColor: 'blue.400' }}
              _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
            />
            <FormErrorMessage>{errors.title}</FormErrorMessage>
          </FormControl>
          
          <FormControl isRequired isInvalid={!!errors.description}>
            <FormLabel color={labelColor}>{t('assignments.form.description')}</FormLabel>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t('assignments.form.descriptionPlaceholder')}
              minH="150px"
              bg={inputBgColor}
              borderColor={inputBorderColor}
              color={optionColor}
              _hover={{ borderColor: 'blue.400' }}
              _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
            />
            <FormErrorMessage>{errors.description}</FormErrorMessage>
          </FormControl>
          
          <FormControl isRequired isInvalid={!!errors.status}>
            <FormLabel color={labelColor}>{t('assignments.form.status')}</FormLabel>
            <Select 
              name="status" 
              value={formData.status} 
              onChange={handleChange}
              bg={inputBgColor}
              borderColor={inputBorderColor}
              color={optionColor}
              _hover={{ borderColor: 'blue.400' }}
              _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
              sx={{
                '> option': {
                  bg: optionBgColor,
                  color: optionColor
                }
              }}
            >
              <option style={{backgroundColor: optionBgColor, color: optionColor}} value="draft">{t('assignments.status.draft')}</option>
              <option style={{backgroundColor: optionBgColor, color: optionColor}} value="published">{t('assignments.status.published')}</option>
              <option style={{backgroundColor: optionBgColor, color: optionColor}} value="archived">{t('assignments.status.archived')}</option>
            </Select>
            <FormErrorMessage>{errors.status}</FormErrorMessage>
          </FormControl>
          
          <FormControl isRequired isInvalid={!!errors.deadline}>
            <FormLabel color={labelColor}>{t('assignments.form.deadline')}</FormLabel>
            <Input
              name="deadline"
              type="datetime-local"
              value={formData.deadline}
              onChange={handleChange}
              bg={inputBgColor}
              borderColor={inputBorderColor}
              color={optionColor}
              _hover={{ borderColor: 'blue.400' }}
              _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
            />
            <FormErrorMessage>{errors.deadline}</FormErrorMessage>
          </FormControl>
          
          <FormControl isRequired isInvalid={!!errors.max_points}>
            <FormLabel color={labelColor}>{t('assignments.form.maxPoints')}</FormLabel>
            <NumberInput 
              value={formData.max_points} 
              onChange={(_, value) => handleNumberChange('max_points', value)}
              min={1}
              max={1000}
            >
              <NumberInputField 
                name="max_points"
                bg={inputBgColor}
                borderColor={inputBorderColor}
                color={optionColor}
                _hover={{ borderColor: 'blue.400' }}
                _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
              />
              <NumberInputStepper bg={stepperBgColor}>
                <NumberIncrementStepper color={optionColor} bg={incrementBgColor} />
                <NumberDecrementStepper color={optionColor} bg={incrementBgColor} />
              </NumberInputStepper>
            </NumberInput>
            <FormErrorMessage>{errors.max_points}</FormErrorMessage>
          </FormControl>
          
          <FormControl display="flex" alignItems="center" mt={4}>
            <FormLabel htmlFor="allow_late_submissions" mb="0" color={labelColor}>
              {t('assignments.form.allowLateSubmissions')}
            </FormLabel>
            <Switch 
              id="allow_late_submissions" 
              name="allow_late_submissions"
              isChecked={formData.allow_late_submissions}
              onChange={handleSwitchChange}
              colorScheme="blue"
              sx={{
                '.chakra-switch__track[data-checked]': {
                  bg: switchTrackColor
                }
              }}
            />
          </FormControl>
          
          {formData.allow_late_submissions && (
            <FormControl isInvalid={!!errors.late_penalty_percentage}>
              <FormLabel color={labelColor}>{t('assignments.form.latePenaltyPercentage')}</FormLabel>
              <Flex alignItems="center">
                <NumberInput 
                  value={formData.late_penalty_percentage} 
                  onChange={(_, value) => handleNumberChange('late_penalty_percentage', value)}
                  min={0}
                  max={100}
                  maxW="100px"
                >
                  <NumberInputField 
                    name="late_penalty_percentage"
                    bg={inputBgColor}
                    borderColor={inputBorderColor}
                    color={optionColor}
                    _hover={{ borderColor: 'blue.400' }}
                    _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
                  />
                  <NumberInputStepper bg={stepperBgColor}>
                    <NumberIncrementStepper color={optionColor} bg={incrementBgColor} />
                    <NumberDecrementStepper color={optionColor} bg={incrementBgColor} />
                  </NumberInputStepper>
                </NumberInput>
                <Text ml={2} color={labelColor}>%</Text>
              </Flex>
              <FormErrorMessage>{errors.late_penalty_percentage}</FormErrorMessage>
            </FormControl>
          )}
          
          <Flex mt={6} justifyContent="space-between">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              bg={cancelButtonBg}
              color={optionColor}
              _hover={{ bg: cancelButtonHoverBg }}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              colorScheme="blue" 
              isLoading={loading}
              bg={primaryButtonBg}
              _hover={{ bg: primaryButtonHoverBg }}
            >
              {initialData ? t('common.save') : t('common.create')}
            </Button>
          </Flex>
        </Stack>
      </Box>
    </>
  );
};

export default AssignmentForm; 