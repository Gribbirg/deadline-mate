import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { appWithTranslation } from 'next-i18next';
import theme from '../styles/theme';
import { AuthProvider } from '../contexts/AuthContext';
import { GroupProvider } from '../contexts/GroupContext';
import { AssignmentProvider } from '../contexts/AssignmentContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
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
  );
}

export default appWithTranslation(MyApp); 