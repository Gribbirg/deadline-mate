import React, { useState } from 'react';
import {
  Box, Button, FormControl, FormLabel, Textarea,
  FormErrorMessage, Stack, Radio, RadioGroup,
  NumberInput, NumberInputField, NumberInputStepper,
  NumberIncrementStepper, NumberDecrementStepper,
  useToast, Text, Flex, useColorModeValue
} from '@chakra-ui/react';
import { useAssignments } from '../../contexts/AssignmentContext';
import { useTranslation } from 'next-i18next';
import { Submission, AssignmentMin } from '../../contexts/types';

interface GradeSubmissionFormProps {
  submission: Submission;
  assignment: {
    max_points: number;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

const GradeSubmissionForm: React.FC<GradeSubmissionFormProps> = ({ 
  submission, 
  assignment,
  onSuccess, 
  onCancel 
}) => {
  const { t } = useTranslation('common');
  const { gradeSubmission, loading } = useAssignments();
  const toast = useToast();
  
  const [status, setStatus] = useState(submission.status);
  const [points, setPoints] = useState<number>(submission.points || 0);
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [errors, setErrors] = useState({
    points: '',
    feedback: ''
  });

  // Цвета для темного режима
  const bgColor = useColorModeValue('white', 'gray.800');
  const inputBgColor = useColorModeValue('white', 'gray.700');
  const inputBorderColor = useColorModeValue('gray.200', 'gray.600');
  const labelColor = useColorModeValue('gray.700', 'gray.200');
  const primaryButtonBg = useColorModeValue('blue.500', 'blue.400');
  const primaryButtonHoverBg = useColorModeValue('blue.600', 'blue.500');
  const cancelButtonBg = useColorModeValue('gray.100', 'gray.700');
  const cancelButtonHoverBg = useColorModeValue('gray.200', 'gray.600');

  // Валидация формы
  const validateForm = () => {
    const newErrors = {
      points: '',
      feedback: ''
    };
    let isValid = true;

    // Проверка баллов
    if (points === null || points === undefined) {
      newErrors.points = t('validation.required');
      isValid = false;
    } else if (points < 0) {
      newErrors.points = t('validation.positiveNumber');
      isValid = false;
    } else if (points > assignment.max_points) {
      newErrors.points = `Максимальное значение: ${assignment.max_points}`;
      isValid = false;
    }

    // Для статуса "оценено" или "возвращено" требуется обратная связь
    if ((status === 'graded' || status === 'returned') && !feedback.trim()) {
      newErrors.feedback = t('validation.required');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const success = await gradeSubmission(
        submission.id,
        status,
        points,
        feedback
      );
      
      if (success) {
        toast({
          title: t('success'),
          description: 'Ответ студента успешно оценен',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: t('assignments.error.generic'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box 
      as="form" 
      onSubmit={handleSubmit}
      bg={bgColor}
      p={6}
      borderRadius="md"
      boxShadow="sm"
    >
      <Stack spacing={6}>
        <Text fontSize="xl" fontWeight="bold" color={labelColor}>
          {t('assignments.gradeSubmission')}
        </Text>
        
        <FormControl>
          <FormLabel color={labelColor}>{t('assignments.submissionStatus')}</FormLabel>
          <RadioGroup value={status} onChange={(val) => setStatus(val as 'submitted' | 'graded' | 'returned')}>
            <Stack direction="row" spacing={5}>
              <Radio value="submitted" colorScheme="yellow">
                {t('assignments.submission.submitted')}
              </Radio>
              <Radio value="graded" colorScheme="green">
                {t('assignments.submission.graded')}
              </Radio>
              <Radio value="returned" colorScheme="red">
                {t('assignments.submission.returned')}
              </Radio>
            </Stack>
          </RadioGroup>
        </FormControl>
        
        <FormControl isInvalid={!!errors.points}>
          <FormLabel color={labelColor}>{t('assignments.form.maxPoints')}</FormLabel>
          <NumberInput 
            value={points} 
            onChange={(_, valueAsNumber) => setPoints(valueAsNumber)}
            min={0} 
            max={assignment.max_points}
            bg={inputBgColor}
            borderColor={inputBorderColor}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <FormErrorMessage>{errors.points}</FormErrorMessage>
        </FormControl>
        
        <FormControl isInvalid={!!errors.feedback}>
          <FormLabel color={labelColor}>{t('assignments.feedbackAndGrading')}</FormLabel>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Введите комментарий или обратную связь для студента"
            minH="150px"
            bg={inputBgColor}
            borderColor={inputBorderColor}
            _hover={{ borderColor: 'blue.400' }}
            _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
          />
          <FormErrorMessage>{errors.feedback}</FormErrorMessage>
        </FormControl>
        
        <Flex mt={6} justifyContent="space-between">
          <Button 
            variant="outline" 
            onClick={onCancel}
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
            {t('assignments.grade')}
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
};

export default GradeSubmissionForm; 