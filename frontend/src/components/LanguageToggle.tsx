import React from 'react';
import { useRouter } from 'next/router';
import { Button, Menu, MenuButton, MenuList, MenuItem, IconButton } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useTranslation } from 'next-i18next';

const LanguageToggle = () => {
  const router = useRouter();
  const { t } = useTranslation('common');
  
  const changeLanguage = (locale: string) => {
    router.push(router.pathname, router.asPath, { locale });
  };
  
  return (
    <Menu>
      <MenuButton
        as={IconButton}
        aria-label={t('language')}
        icon={<ChevronDownIcon />}
        variant="ghost"
      >
        {router.locale === 'ru' ? 'RU' : 'EN'}
      </MenuButton>
      <MenuList>
        <MenuItem onClick={() => changeLanguage('ru')}>Русский</MenuItem>
        <MenuItem onClick={() => changeLanguage('en')}>English</MenuItem>
      </MenuList>
    </Menu>
  );
};

export default LanguageToggle; 