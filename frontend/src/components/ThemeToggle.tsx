import React from 'react';
import { useColorMode, Button, IconButton, Tooltip } from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { useTranslation } from 'next-i18next';

const ThemeToggle = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { t } = useTranslation('common');
  
  return (
    <Tooltip label={colorMode === 'dark' ? t('lightMode') : t('darkMode')}>
      <IconButton
        aria-label={colorMode === 'dark' ? t('lightMode') : t('darkMode')}
        icon={colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
        onClick={toggleColorMode}
        variant="ghost"
      />
    </Tooltip>
  );
};

export default ThemeToggle; 