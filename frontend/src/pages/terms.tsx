import React from 'react';
import { Box, Container, Heading, Text, VStack, useColorModeValue } from '@chakra-ui/react';
import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Layout from '../components/Layout';

const TermsPage: NextPage = () => {
  const { t } = useTranslation('common');
  const bgColor = useColorModeValue('white', 'gray.800');
  
  return (
    <Layout>
      <Container maxW="container.md" py={8}>
        <Box bg={bgColor} p={6} borderRadius="md" boxShadow="md">
          <VStack spacing={6} align="start">
            <Heading as="h1" size="xl">
              {t('footer.terms')}
            </Heading>
            
            <Text>
              This document outlines the terms and conditions for using the Deadline Mate platform.
              By accessing or using our service, you agree to be bound by these terms.
            </Text>
            
            <Heading as="h2" size="md">
              1. Acceptance of Terms
            </Heading>
            <Text>
              By using Deadline Mate, you acknowledge that you have read, understood, and agree to be bound by these
              Terms of Service. If you do not agree with any part of these terms, you may not use our service.
            </Text>
            
            <Heading as="h2" size="md">
              2. User Accounts
            </Heading>
            <Text>
              To use certain features of the service, you must register for an account. You are responsible for maintaining
              the confidentiality of your account information and for all activities that occur under your account.
            </Text>
            
            <Heading as="h2" size="md">
              3. User Content
            </Heading>
            <Text>
              Users retain ownership of content they create and share on Deadline Mate. By submitting content, you grant
              us a limited license to use, store, and share your content as necessary to provide the service.
            </Text>
            
            <Heading as="h2" size="md">
              4. Acceptable Use
            </Heading>
            <Text>
              You agree not to use Deadline Mate for any unlawful purpose or in any way that could damage, disable, 
              overburden, or impair the service. You must not attempt to gain unauthorized access to any part of the service.
            </Text>
            
            <Heading as="h2" size="md">
              5. Changes to Terms
            </Heading>
            <Text>
              We reserve the right to modify these terms at any time. We will provide notice of significant changes.
              Your continued use of Deadline Mate after such modifications constitutes your acceptance of the updated terms.
            </Text>
            
            <Heading as="h2" size="md">
              6. Termination
            </Heading>
            <Text>
              We reserve the right to suspend or terminate your account at our sole discretion, without notice, 
              for conduct that we believe violates these Terms of Service or is harmful to other users, us, 
              or third parties, or for any other reason.
            </Text>
            
            <Heading as="h2" size="md">
              7. Disclaimer of Warranties
            </Heading>
            <Text>
              Deadline Mate is provided "as is" without any warranties, expressed or implied. We do not guarantee 
              that the service will be error-free or uninterrupted.
            </Text>
            
            <Heading as="h2" size="md">
              8. Contact
            </Heading>
            <Text>
              If you have any questions about these Terms of Service, please contact us.
            </Text>
            
            <Text fontSize="sm" color="gray.500" mt={4}>
              Last updated: {new Date().toLocaleDateString()}
            </Text>
          </VStack>
        </Box>
      </Container>
    </Layout>
  );
};

export const getStaticProps = async ({ locale }: { locale: string }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
};

export default TermsPage; 