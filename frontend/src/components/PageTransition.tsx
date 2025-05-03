import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Fade } from '@chakra-ui/react';

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const router = useRouter();
  const [isChangingRoute, setIsChangingRoute] = useState(false);

  useEffect(() => {
    const handleStart = () => {
      setIsChangingRoute(true);
    };

    const handleComplete = () => {
      // Небольшая задержка для плавной анимации
      setTimeout(() => {
        setIsChangingRoute(false);
      }, 100);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  return (
    <Fade in={!isChangingRoute} transition={{ enter: { duration: 0.3 } }}>
      <Box display={isChangingRoute ? 'none' : 'block'}>
        {children}
      </Box>
    </Fade>
  );
};

export default PageTransition; 