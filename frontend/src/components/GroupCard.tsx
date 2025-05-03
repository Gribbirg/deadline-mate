import React from 'react';
import {
  Box,
  Text,
  Heading,
  Badge,
  Flex,
  Stack,
  useColorModeValue,
  Button,
  Divider,
  HStack,
  Link,
  Icon,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { Group } from '../contexts/GroupContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'next-i18next';
import { FaUsers, FaUserGraduate } from 'react-icons/fa';

interface GroupCardProps {
  group: Group;
  onDelete?: (id: number) => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, onDelete }) => {
  const { t } = useTranslation('common');
  const { isTeacher } = useAuth();
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
          {t('group.codeLabel')}: <strong>{group.code}</strong>
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
      
      {isTeacher() && (
        <>
          <Divider />
          <Flex justify="space-between" p={3}>
            <NextLink href={`/groups/${group.id}`} passHref legacyBehavior>
              <Button as="a" size="sm" colorScheme="brand" variant="outline">
                {t('group.view')}
              </Button>
            </NextLink>

            <Flex>
              <NextLink href={`/groups/${group.id}/edit`} passHref legacyBehavior>
                <Button as="a" size="sm" colorScheme="brand" variant="outline" mr={2}>
                  {t('group.edit')}
                </Button>
              </NextLink>

              {onDelete && (
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  onClick={() => onDelete(group.id)}
                >
                  {t('group.delete')}
                </Button>
              )}
            </Flex>
          </Flex>
        </>
      )}
    </Box>
  );
};

export default GroupCard; 