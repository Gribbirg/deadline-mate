import React, { useState, useEffect } from 'react';
import {
  Box, Button, FormControl, FormLabel, Select,
  FormErrorMessage, Stack, Flex, Text,
  Input, useToast, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody,
  ModalCloseButton, ModalFooter, useDisclosure,
  useColorModeValue
} from '@chakra-ui/react';
import { useAssignments } from '../../contexts/AssignmentContext';
import { useGroups } from '../../contexts/GroupContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'next-i18next';
import { Assignment, AssignmentGroupFormData } from '../../contexts/types';

interface AssignToGroupFormProps {
  assignment: Assignment;
  onSuccess?: () => void;
}

const AssignToGroupForm: React.FC<AssignToGroupFormProps> = ({ assignment, onSuccess }) => {
  const toast = useToast();
  const { assignToGroup, loading } = useAssignments();
  const { groups, fetchGroups } = useGroups();
  const { isTeacher } = useAuth();
  const { t } = useTranslation('common');
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Color mode values for dark theme compatibility
  const modalBg = useColorModeValue('white', 'gray.800');
  const inputBgColor = useColorModeValue('white', 'gray.700');
  const inputBorderColor = useColorModeValue('gray.200', 'gray.600');
  const labelColor = useColorModeValue('gray.700', 'gray.300');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const helperTextColor = useColorModeValue('gray.500', 'gray.400');
  const deadlineTextColor = useColorModeValue('blue.600', 'blue.300');
  const primaryButtonBg = useColorModeValue('blue.500', 'blue.400');
  const primaryButtonHoverBg = useColorModeValue('blue.600', 'blue.500');
  const assignButtonBg = useColorModeValue('green.500', 'green.400');
  const assignButtonHoverBg = useColorModeValue('green.600', 'green.500');
  const cancelButtonBg = useColorModeValue('gray.100', 'gray.700');
  const cancelButtonHoverBg = useColorModeValue('gray.200', 'gray.600');
  
  // Состояние формы
  const [formData, setFormData] = useState<AssignmentGroupFormData>({
    assignment_id: assignment.id,
    group_id: 0,
    custom_deadline: ''
  });
  
  // Состояние ошибок валидации
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Загрузка списка групп при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      fetchGroups().catch(error => {
        toast({
          title: t('groups.error.load'),
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      });
    }
  }, [isOpen, fetchGroups, toast, t]);
  
  // Обработка изменений в форме
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'group_id' ? parseInt(value) : value }));
    // Очищаем ошибку при изменении поля
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Валидация формы
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.group_id) {
      newErrors.group_id = t('validation.required');
    }
    
    if (formData.custom_deadline) {
      const deadlineDate = new Date(formData.custom_deadline);
      if (isNaN(deadlineDate.getTime())) {
        newErrors.custom_deadline = t('validation.invalidDate');
      }
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
      // Создаем новый объект данных, чтобы не передавать пустую строку для custom_deadline
      const dataToSend = {
        assignment_id: formData.assignment_id,
        group_id: formData.group_id
      };
      
      // Добавляем custom_deadline только если он не пустой
      if (formData.custom_deadline) {
        Object.assign(dataToSend, { custom_deadline: formData.custom_deadline });
      }
      
      const result = await assignToGroup(dataToSend);
      if (result) {
        toast({
          title: t('assignments.assignSuccess'),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: any) {
      toast({
        title: t('assignments.error.assign'),
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  return (
    <>
      <Button 
        colorScheme="green" 
        onClick={onOpen}
        bg={assignButtonBg}
        _hover={{ bg: assignButtonHoverBg }}
      >
        {t('assignments.assignToGroup')}
      </Button>
      
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent bg={modalBg}>
          <ModalHeader color={textColor}>{t('assignments.assignToGroup')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box as="form" id="assign-form" onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <Text fontWeight="medium" color={textColor}>
                  {t('assignments.assigningTitle', { title: assignment.title })}
                </Text>
                
                <FormControl isRequired isInvalid={!!errors.group_id}>
                  <FormLabel color={labelColor}>{t('assignments.form.selectGroup')}</FormLabel>
                  <Select
                    name="group_id"
                    value={formData.group_id || ''}
                    onChange={handleChange}
                    placeholder={t('assignments.form.selectGroupPlaceholder')}
                    bg={inputBgColor}
                    borderColor={inputBorderColor}
                    _hover={{ borderColor: 'blue.400' }}
                    _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
                  >
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </Select>
                  <FormErrorMessage>{errors.group_id}</FormErrorMessage>
                </FormControl>
                
                <FormControl isInvalid={!!errors.custom_deadline}>
                  <FormLabel color={labelColor}>{t('assignments.form.customDeadline')}</FormLabel>
                  <Input
                    name="custom_deadline"
                    type="datetime-local"
                    value={formData.custom_deadline}
                    onChange={handleChange}
                    bg={inputBgColor}
                    borderColor={inputBorderColor}
                    _hover={{ borderColor: 'blue.400' }}
                    _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
                  />
                  <Text fontSize="sm" color={helperTextColor} mt={1}>
                    {t('assignments.form.customDeadlineHelp')}
                  </Text>
                  <FormErrorMessage>{errors.custom_deadline}</FormErrorMessage>
                </FormControl>
                
                <Text fontSize="sm" color={deadlineTextColor}>
                  {t('assignments.form.originalDeadline', {
                    date: new Date(assignment.deadline).toLocaleString()
                  })}
                </Text>
              </Stack>
            </Box>
          </ModalBody>
          
          <ModalFooter>
            <Button 
              variant="outline" 
              mr={3} 
              onClick={onClose}
              bg={cancelButtonBg}
              _hover={{ bg: cancelButtonHoverBg }}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit"
              form="assign-form"
              colorScheme="blue" 
              isLoading={loading}
              bg={primaryButtonBg}
              _hover={{ bg: primaryButtonHoverBg }}
            >
              {t('assignments.assign')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AssignToGroupForm; 