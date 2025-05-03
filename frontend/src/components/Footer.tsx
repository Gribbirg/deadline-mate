import React from 'react';
import { Box, Container, Text, Link, HStack, useColorModeValue } from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { useTranslation } from 'next-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation('common');
  const year = new Date().getFullYear();
  
  const bgColor = useColorModeValue('gray.100', 'gray.900');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  
  return (
    <Box as="footer" bg={bgColor} py={4} mt={8}>
      <Container maxW="container.xl">
        <Box display="flex" flexDirection={{ base: 'column', md: 'row' }} justifyContent="space-between" alignItems="center">
          <Text fontSize="sm" color={textColor}>
            &copy; {year} {t('footer.copyright')}
          </Text>
          
          <HStack spacing={4} mt={{ base: 2, md: 0 }}>
            <Link 
              href="https://github.com/Gribbirg/deadline-mate" 
              isExternal
              fontSize="sm"
              color={textColor}
            >
              GitHub <ExternalLinkIcon mx="2px" />
            </Link>
            
            <Link 
              href="/terms" 
              fontSize="sm"
              color={textColor}
            >
              {t('footer.terms')}
            </Link>
            
            <Link 
              href="/privacy" 
              fontSize="sm"
              color={textColor}
            >
              {t('footer.privacy')}
            </Link>
          </HStack>
        </Box>
        
        <Text fontSize="xs" color={textColor} textAlign="center" mt={2}>
          {t('footer.license')}
        </Text>
      </Container>
    </Box>
  );
};

export default Footer; 