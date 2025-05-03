import React, { useState } from 'react';
import {
  Box,
  SimpleGrid,
  Heading,
  Text,
  Button,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Input,
  InputGroup,
  InputLeftElement,
  HStack,
  Select,
  Flex,
  useToast,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useTranslation } from 'next-i18next';
import { Group, useGroups } from '../contexts/GroupContext';
import GroupCard from './GroupCard';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

interface GroupListProps {
  title?: string;
  emptyText?: string;
  showControls?: boolean;
}

const GroupList: React.FC<GroupListProps> = ({
  title = 'Группы',
  emptyText = 'Группы не найдены',
  showControls = true,
}) => {
  const { t } = useTranslation('common');
  const { groups, loading, error, deleteGroup } = useGroups();
  const { isTeacher } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('name');
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [groupToDelete, setGroupToDelete] = useState<number | null>(null);

  // Обработка удаления группы
  const handleDelete = async () => {
    if (groupToDelete) {
      try {
        const success = await deleteGroup(groupToDelete);
        if (success) {
          toast({
            title: t('group.deleteSuccess'),
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (error) {
        toast({
          title: t('group.deleteError'),
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
      onClose();
      setGroupToDelete(null);
    }
  };

  // Открытие диалога подтверждения удаления
  const confirmDelete = (id: number) => {
    setGroupToDelete(id);
    onOpen();
  };

  // Фильтрация и сортировка групп
  const filteredGroups = React.useMemo(() => {
    // Make sure groups is an array before using spread operator
    const groupsArray = Array.isArray(groups) ? groups : [];
    let result = [...groupsArray];

    // Фильтрация по поисковому запросу
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (group) =>
          group.name.toLowerCase().includes(query) ||
          group.code.toLowerCase().includes(query) ||
          (group.description && group.description.toLowerCase().includes(query))
      );
    }

    // Сортировка
    result.sort((a, b) => {
      switch (sortOrder) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'nameDesc':
          return b.name.localeCompare(a.name);
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'members':
          return b.member_count - a.member_count;
        default:
          return 0;
      }
    });

    return result;
  }, [groups, searchQuery, sortOrder]);

  if (loading) {
    return <Text>{t('common.loading')}</Text>;
  }

  if (error) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="red.500" fontSize="lg" mb={4}>{error}</Text>
        <Button 
          colorScheme="brand" 
          onClick={() => window.location.reload()}
        >
          {t('common.retry')}
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h2" size="lg">
          {title}
        </Heading>
        {isTeacher() && showControls && (
          <Button colorScheme="brand" onClick={() => router.push('/groups/create')}>
            {t('group.create')}
          </Button>
        )}
      </Flex>

      {showControls && (
        <HStack mb={6} spacing={4}>
          <InputGroup maxW="md">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder={t('group.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
          <Select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            maxW="xs"
          >
            <option value="name">{t('group.sortNameAsc')}</option>
            <option value="nameDesc">{t('group.sortNameDesc')}</option>
            <option value="newest">{t('group.sortNewest')}</option>
            <option value="oldest">{t('group.sortOldest')}</option>
            <option value="members">{t('group.sortMembers')}</option>
          </Select>
        </HStack>
      )}

      {filteredGroups.length === 0 ? (
        <Text color="gray.500" textAlign="center" py={10}>
          {emptyText}
        </Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {filteredGroups.map((group) => (
            <GroupCard key={group.id} group={group} onDelete={confirmDelete} />
          ))}
        </SimpleGrid>
      )}

      {/* Диалог подтверждения удаления */}
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {t('group.deleteConfirmTitle')}
            </AlertDialogHeader>

            <AlertDialogBody>
              {t('group.deleteConfirmMessage')}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                {t('group.delete')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default GroupList; 