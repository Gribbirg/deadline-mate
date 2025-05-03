import React, { useState } from 'react';
import { Box, Button, Container, Input, Text, VStack, Heading, Code, useToast, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react';
import axios from 'axios';
import Layout from '../components/Layout';

const DebugPage: React.FC = () => {
  const [url, setUrl] = useState('/api/groups/groups/');
  const [response, setResponse] = useState<any>(null);
  const [requestInfo, setRequestInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setRequestInfo(null);

    try {
      // Add cache-busting parameter
      const timestampedUrl = `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`;
      
      const token = localStorage.getItem('access_token');
      
      const headers = {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
      console.log(`Making request to: ${timestampedUrl}`, headers);
      
      const result = await axios({
        method: 'GET',
        url: timestampedUrl,
        headers,
        validateStatus: function (status) {
          return true; // always resolve, don't reject on any status code
        }
      });
      
      setRequestInfo({
        url: timestampedUrl,
        method: 'GET',
        headers,
        status: result.status,
        statusText: result.statusText,
        redirected: result.request?.responseURL !== timestampedUrl, 
        finalUrl: result.request?.responseURL || timestampedUrl,
      });
      
      setResponse(result.data);
      
      if (result.status >= 200 && result.status < 300) {
        toast({
          title: 'Success',
          description: `Request successful (${result.status})`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Non-success status',
          description: `Request returned status ${result.status} ${result.statusText}`,
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err: any) {
      console.error('Error in debug fetch:', err);
      setError(err.message || 'Unknown error');
      
      if (err.response) {
        setRequestInfo({
          url,
          method: 'GET',
          status: err.response.status,
          statusText: err.response.statusText,
          headers: err.response.headers,
          redirected: err.request?.responseURL !== url,
          finalUrl: err.request?.responseURL || url,
        });
      }
      
      toast({
        title: 'Error',
        description: `Request failed: ${err.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const clearBrowserCache = () => {
    if (typeof window !== 'undefined') {
      // Clear localStorage tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      if (window.caches) {
        // Clear all caches
        caches.keys().then((keyList) => {
          return Promise.all(
            keyList.map((key) => {
              return caches.delete(key);
            })
          );
        });
        toast({
          title: 'Cache cleared',
          description: 'Browser cache has been cleared (tokens removed too)',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Cache API not available',
          description: 'Your browser does not support the Cache API, but tokens were removed',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  return (
    <Layout>
      <Container maxW="container.lg" py={8}>
        <VStack spacing={6} align="stretch">
          <Heading>API Debug Tool</Heading>
          
          <Box>
            <Text mb={2}>Enter API URL:</Text>
            <Input 
              value={url} 
              onChange={(e) => setUrl(e.target.value)} 
              placeholder="/api/path/to/endpoint"
              mb={4}
            />
            <Button 
              colorScheme="brand" 
              onClick={handleFetch} 
              isLoading={loading}
              mr={2}
            >
              Fetch
            </Button>
            <Button 
              onClick={clearBrowserCache}
              variant="outline"
            >
              Clear Browser Cache & Tokens
            </Button>
          </Box>
          
          {requestInfo && (
            <Box p={4} bg="blue.50" borderRadius="md">
              <Heading size="sm" mb={2}>Request Information</Heading>
              <Code p={4} borderRadius="md" bg="blue.100" display="block" whiteSpace="pre" overflowX="auto">
                {JSON.stringify(requestInfo, null, 2)}
              </Code>
            </Box>
          )}
          
          {error && (
            <Box p={4} bg="red.50" borderRadius="md">
              <Heading size="sm" color="red.500" mb={2}>Error</Heading>
              <Text>{error}</Text>
            </Box>
          )}
          
          {response && (
            <Accordion allowToggle defaultIndex={[0]}>
              <AccordionItem>
                <h2>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      <Heading size="sm">Response Data</Heading>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <Code p={4} borderRadius="md" bg="gray.100" display="block" whiteSpace="pre" overflowX="auto">
                    {JSON.stringify(response, null, 2)}
                  </Code>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          )}
        </VStack>
      </Container>
    </Layout>
  );
};

export default DebugPage; 