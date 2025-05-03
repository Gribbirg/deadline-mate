import React from 'react';
import { 
  Box, 
  Container, 
  Flex, 
  Heading, 
  Spacer, 
  useColorModeValue,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  Text,
  HStack,
  Link as ChakraLink,
  IconButton
} from '@chakra-ui/react';
import { ChevronDownIcon, HamburgerIcon } from '@chakra-ui/icons';
import { useTranslation } from 'next-i18next';
import NextLink from 'next/link';
import Image from 'next/image';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import Logo from './Logo';
import Footer from './Footer';
import { useAuth } from '../contexts/AuthContext';
import PageTransition from './PageTransition';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { t } = useTranslation('common');
  const { user, isAuthenticated, logout, isStudent, isTeacher } = useAuth();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const headerBgColor = useColorModeValue('white', 'gray.800');
  
  return (
    <Box minH="100vh" bg={bgColor} display="flex" flexDirection="column">
      <Flex
        as="header"
        position="fixed"
        w="100%"
        bg={headerBgColor}
        boxShadow="sm"
        h="60px"
        alignItems="center"
        px={4}
        zIndex={10}
      >
        <NextLink href={isAuthenticated ? '/dashboard' : '/'} legacyBehavior>
          <ChakraLink _hover={{ textDecoration: 'none' }}>
            <Logo textSize="md" hideTextOnMobile={true} />
          </ChakraLink>
        </NextLink>
        
        {/* Навигация для аутентифицированных пользователей */}
        {isAuthenticated && (
          <HStack spacing={4} ml={8} display={{ base: 'none', md: 'flex' }}>
            <NextLink href="/dashboard" legacyBehavior>
              <ChakraLink>{t('nav.dashboard')}</ChakraLink>
            </NextLink>
            
            {/* Ссылки для студентов */}
            {isStudent() && (
              <>
                <NextLink href="/assignments" legacyBehavior>
                  <ChakraLink>{t('nav.assignments')}</ChakraLink>
                </NextLink>
                <NextLink href="/groups" legacyBehavior>
                  <ChakraLink>{t('nav.groups')}</ChakraLink>
                </NextLink>
              </>
            )}
            
            {/* Ссылки для преподавателей */}
            {isTeacher() && (
              <>
                <NextLink href="/groups" legacyBehavior>
                  <ChakraLink>{t('nav.groups')}</ChakraLink>
                </NextLink>
                <NextLink href="/assignments" legacyBehavior>
                  <ChakraLink>{t('nav.manageAssignments')}</ChakraLink>
                </NextLink>
              </>
            )}
          </HStack>
        )}
        
        <Spacer />
        
        {/* Мобильное меню для маленьких экранов */}
        <Box display={{ base: 'block', md: 'none' }} mr={2}>
          {isAuthenticated && (
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="Navigation"
                icon={<HamburgerIcon />}
                variant="ghost"
              />
              <MenuList>
                <NextLink href="/dashboard" legacyBehavior>
                  <MenuItem as="a">{t('nav.dashboard')}</MenuItem>
                </NextLink>
                
                {isStudent() && (
                  <>
                    <NextLink href="/assignments" legacyBehavior>
                      <MenuItem as="a">{t('nav.assignments')}</MenuItem>
                    </NextLink>
                    <NextLink href="/groups" legacyBehavior>
                      <MenuItem as="a">{t('nav.groups')}</MenuItem>
                    </NextLink>
                  </>
                )}
                
                {isTeacher() && (
                  <>
                    <NextLink href="/groups" legacyBehavior>
                      <MenuItem as="a">{t('nav.groups')}</MenuItem>
                    </NextLink>
                    <NextLink href="/assignments" legacyBehavior>
                      <MenuItem as="a">{t('nav.manageAssignments')}</MenuItem>
                    </NextLink>
                  </>
                )}
              </MenuList>
            </Menu>
          )}
        </Box>
        
        <ThemeToggle />
        <LanguageToggle />
        
        {/* Меню пользователя */}
        {isAuthenticated ? (
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              variant="ghost"
              ml={2}
            >
              <HStack>
                <Avatar size="xs" name={`${user?.first_name} ${user?.last_name}`} />
                <Text display={{ base: 'none', md: 'block' }}>
                  {user?.first_name}
                </Text>
              </HStack>
            </MenuButton>
            <MenuList>
              <NextLink href="/profile" legacyBehavior>
                <MenuItem as="a">{t('user.profile')}</MenuItem>
              </NextLink>
              <NextLink href="/settings" legacyBehavior>
                <MenuItem as="a">{t('user.settings')}</MenuItem>
              </NextLink>
              <MenuDivider />
              <MenuItem onClick={logout}>{t('user.logout')}</MenuItem>
            </MenuList>
          </Menu>
        ) : (
          <HStack spacing={2} ml={2}>
            <NextLink href="/login" legacyBehavior>
              <Button as="a" variant="ghost" size="sm">
                {t('login')}
              </Button>
            </NextLink>
            <NextLink href="/register" legacyBehavior>
              <Button as="a" colorScheme="brand" size="sm">
                {t('register')}
              </Button>
            </NextLink>
          </HStack>
        )}
      </Flex>
      
      <Container maxW="container.xl" pt="80px" pb="20px" flex="1">
        <Box as="main">
          <PageTransition>
            {children}
          </PageTransition>
        </Box>
      </Container>
      
      <Footer />
    </Box>
  );
};

export default Layout; 