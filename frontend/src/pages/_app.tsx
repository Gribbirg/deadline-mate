import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { appWithTranslation } from 'next-i18next';
import theme from '../styles/theme';
import { AuthProvider } from '../contexts/AuthContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ChakraProvider theme={theme}>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <Component {...pageProps} />
      </ChakraProvider>
    </AuthProvider>
  );
}

export default appWithTranslation(MyApp); 