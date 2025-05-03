import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set headers to clear cache
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  // Send the script that clears the cache on the client side
  res.status(200).send(`
    <html>
      <head>
        <title>Clearing Cache</title>
        <script>
          // Clear localStorage
          localStorage.clear();
          
          // Clear sessionStorage
          sessionStorage.clear();
          
          // Try to clear caches API
          if (window.caches) {
            caches.keys().then(function(keyList) {
              return Promise.all(keyList.map(function(key) {
                return caches.delete(key);
              }));
            });
          }
          
          // Redirect back to the application
          setTimeout(function() {
            window.location.href = '/groups';
          }, 1000);
        </script>
      </head>
      <body>
        <h1>Clearing cache...</h1>
        <p>You will be redirected in a moment.</p>
      </body>
    </html>
  `);
} 