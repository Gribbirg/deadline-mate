import React from 'react';
import { Box, Heading, Flex } from '@chakra-ui/react';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';

interface LogoProps {
  size?: number | Record<string, number>;
  showText?: boolean;
  hideTextOnMobile?: boolean;
  textSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const Logo: React.FC<LogoProps> = ({ 
  size = 40, 
  showText = true, 
  hideTextOnMobile = false,
  textSize = 'md' 
}) => {
  const { t } = useTranslation('common');

  return (
    <Flex alignItems="center">
      <Box 
        position="relative" 
        width={typeof size === 'number' ? `${size}px` : size} 
        height={typeof size === 'number' ? `${size}px` : size} 
        mr={showText ? 2 : 0}
        borderRadius="full"
        overflow="hidden"
      >
        <Image
          src="/images/logo.jpg"
          alt={t('appName')}
          fill
          style={{ objectFit: 'cover' }}
          fetchPriority="high"
        />
      </Box>
      {showText && (
        <Heading 
          size={textSize} 
          display={hideTextOnMobile ? { base: 'none', sm: 'block' } : undefined}
        >
          {t('appName')}
        </Heading>
      )}
    </Flex>
  );
};

export default Logo; 