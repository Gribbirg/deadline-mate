import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { appWithTranslation } from 'next-i18next';
import theme from '../styles/theme';
import { AuthProvider } from '../contexts/AuthContext';
import { GroupProvider } from '../contexts/GroupContext';
import { AssignmentProvider } from '../contexts/AssignmentContext';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { t } = useTranslation('common');
  
  // Функция для определения заголовка страницы на основе пути
  const getPageTitle = () => {
    const path = router.pathname;
    
    // Карта заголовков страниц
    const titleMap: Record<string, string> = {
      '/': t('appName'),
      '/login': `${t('login')} | ${t('appName')}`,
      '/register': `${t('register')} | ${t('appName')}`,
      '/dashboard': `${t('dashboard')} | ${t('appName')}`,
      '/assignments': `${t('assignments')} | ${t('appName')}`,
      '/groups': `${t('groups')} | ${t('appName')}`,
      '/profile': `${t('profile')} | ${t('appName')}`,
      '/settings': `${t('settings')} | ${t('appName')}`,
      '/terms': `${t('footer.terms')} | ${t('appName')}`,
      '/privacy': `${t('footer.privacy')} | ${t('appName')}`
    };
    
    // Для динамических маршрутов
    if (path.startsWith('/assignments/')) {
      return `${t('assignments')} | ${t('appName')}`;
    }
    if (path.startsWith('/groups/')) {
      return `${t('groups')} | ${t('appName')}`;
    }
    
    return titleMap[path] || t('appName');
  };
  
  return (
    <>
      <Head>
        <title>{getPageTitle()}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <AuthProvider>
        <GroupProvider>
          <AssignmentProvider>
            <ChakraProvider theme={theme}>
              <ColorModeScript initialColorMode={theme.config.initialColorMode} />
              <Component {...pageProps} />
            </ChakraProvider>
          </AssignmentProvider>
        </GroupProvider>
      </AuthProvider>
    </>
  );
}

export default appWithTranslation(MyApp); 