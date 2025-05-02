import React from 'react';
import { Box, Container, Flex, Heading, Spacer, useColorModeValue } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { t } = useTranslation('common');
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const headerBgColor = useColorModeValue('white', 'gray.800');
  
  return (
    <Box minH="100vh" bg={bgColor}>
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
        <Heading size="md">{t('appName')}</Heading>
        <Spacer />
        <ThemeToggle />
        <LanguageToggle />
      </Flex>
      
      <Container maxW="container.xl" pt="80px" pb="20px">
        <Box as="main">{children}</Box>
      </Container>
    </Box>
  );
};

export default Layout; 