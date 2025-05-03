import React from 'react';
import { Box, Container, Heading, Text, VStack, useColorModeValue } from '@chakra-ui/react';
import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Layout from '../components/Layout';

const PrivacyPage: NextPage = () => {
  const { t } = useTranslation('common');
  const bgColor = useColorModeValue('white', 'gray.800');
  
  return (
    <Layout>
      <Container maxW="container.md" py={8}>
        <Box bg={bgColor} p={6} borderRadius="md" boxShadow="md">
          <VStack spacing={6} align="start">
            <Heading as="h1" size="xl">
              {t('footer.privacy')}
            </Heading>
            
            <Text>
              This Privacy Policy explains how Deadline Mate collects, uses, and protects your personal information
              when you use our platform. We are committed to ensuring the privacy and security of your data.
            </Text>
            
            <Heading as="h2" size="md">
              1. Information We Collect
            </Heading>
            <Text>
              We collect information you provide directly to us when creating an account, such as your name,
              email address, and academic information. We also collect data about how you use our service,
              including assignments, submissions, and interaction with the platform.
            </Text>
            
            <Heading as="h2" size="md">
              2. How We Use Your Information
            </Heading>
            <Text>
              We use the information we collect to provide, maintain, and improve our services, to communicate
              with you, and to personalize your experience. Educational data is used to facilitate the
              learning process between students and teachers.
            </Text>
            
            <Heading as="h2" size="md">
              3. Data Sharing and Disclosure
            </Heading>
            <Text>
              We do not sell your personal information. We may share your information with teachers and students
              as necessary for educational purposes. We may also share data with service providers who help us
              deliver our services.
            </Text>
            
            <Heading as="h2" size="md">
              4. Data Security
            </Heading>
            <Text>
              We implement appropriate security measures to protect your personal information against unauthorized
              access, alteration, disclosure, or destruction. However, no method of transmission over the internet
              is 100% secure.
            </Text>
            
            <Heading as="h2" size="md">
              5. Your Rights
            </Heading>
            <Text>
              Depending on your location, you may have certain rights regarding your personal data, including the
              right to access, correct, or delete your data. Contact us to exercise these rights.
            </Text>
            
            <Heading as="h2" size="md">
              6. Cookies and Tracking Technologies
            </Heading>
            <Text>
              We use cookies and similar technologies to collect information about your browsing activities and
              to remember your preferences. You can set your browser to refuse cookies, but this may limit your
              ability to use some features of our service.
            </Text>
            
            <Heading as="h2" size="md">
              7. Changes to This Policy
            </Heading>
            <Text>
              We may update this Privacy Policy from time to time. We will notify you of any significant changes.
              Your continued use of Deadline Mate after such modifications constitutes your acceptance of the updated policy.
            </Text>
            
            <Heading as="h2" size="md">
              8. Contact Us
            </Heading>
            <Text>
              If you have any questions about this Privacy Policy, please contact us.
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

export default PrivacyPage; 