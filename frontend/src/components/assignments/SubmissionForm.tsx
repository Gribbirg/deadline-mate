import React, { useState } from 'react';
import {
  Box, Button, FormControl, FormLabel, Textarea,
  FormErrorMessage, Stack, Flex, Text,
  useToast, Alert, AlertIcon, AlertTitle,
  AlertDescription, useColorModeValue
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useAssignments } from '../../contexts/AssignmentContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'next-i18next';
import { Assignment } from '../../contexts/types';

interface SubmissionFormProps {
  assignment: Assignment;
  onSuccess?: () => void;
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({ assignment, onSuccess }) => {
  const router = useRouter();
  const toast = useToast();
  const { submitAssignment, loading } = useAssignments();
  const { isStudent } = useAuth();
  const { t } = useTranslation('common');
  
  // Color mode values for dark theme compatibility
  const bgColor = useColorModeValue('white', 'gray.800');
  const inputBgColor = useColorModeValue('white', 'gray.700');
  const inputBorderColor = useColorModeValue('gray.200', 'gray.600');
  const labelColor = useColorModeValue('gray.700', 'gray.300');
  const primaryButtonBg = useColorModeValue('blue.500', 'blue.400');
  const primaryButtonHoverBg = useColorModeValue('blue.600', 'blue.500');
  const cancelButtonBg = useColorModeValue('gray.100', 'gray.700');
  const cancelButtonHoverBg = useColorModeValue('gray.200', 'gray.600');
  
  // Состояние формы
  const [comment, setComment] = useState<string>('');
  
  // Состояние ошибок валидации
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Валидация формы
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!comment.trim()) {
      newErrors.comment = t('validation.commentRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isStudent()) {
      toast({
        title: t('assignments.error.unauthorized'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Проверка на истекший дедлайн
    if (assignment.is_deadline_expired && !assignment.allow_late_submissions) {
      toast({
        title: t('assignments.error.deadlineExpired'),
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
      const result = await submitAssignment(assignment.id, {
        comment
      });
      
      if (result) {
        toast({
          title: t('assignments.submitSuccess'),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/assignments`);
        }
      }
    } catch (error: any) {
      toast({
        title: t('assignments.error.submit'),
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Отмена формы
  const handleCancel = () => {
    router.push(`/assignments/${assignment.id}`);
  };
  
  // Проверка на просроченный дедлайн
  const isLateSubmission = assignment.is_deadline_expired;
  
  return (
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
      <Stack spacing={6}>
        <Text fontSize="xl" fontWeight="bold" color={labelColor}>
          {t('assignments.submitTitle', { title: assignment.title })}
        </Text>
        
        {isLateSubmission && (
          <Alert status={assignment.allow_late_submissions ? "warning" : "error"} borderRadius="md">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>
                {assignment.allow_late_submissions 
                  ? t('assignments.lateSubmissionAllowed') 
                  : t('assignments.lateSubmissionForbidden')}
              </AlertTitle>
              <AlertDescription display="block">
                {assignment.allow_late_submissions 
                  ? t('assignments.latePenaltyWarning', { 
                      percent: assignment.late_penalty_percentage 
                    })
                  : t('assignments.deadlineExpiredInfo')}
              </AlertDescription>
            </Box>
          </Alert>
        )}
        
        <FormControl isInvalid={!!errors.comment}>
          <FormLabel color={labelColor}>{t('assignments.form.comment')}</FormLabel>
          <Textarea
            placeholder={t('assignments.form.commentPlaceholder')}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            minH="150px"
            bg={inputBgColor}
            borderColor={inputBorderColor}
            _focus={{
              borderColor: 'blue.400',
              boxShadow: '0 0 0 1px blue.400'
            }}
          />
          <FormErrorMessage>{errors.comment}</FormErrorMessage>
        </FormControl>
        
        <Flex mt={6} justifyContent="space-between">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            bg={cancelButtonBg}
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
            {t('assignments.submit')}
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
};

export default SubmissionForm; 