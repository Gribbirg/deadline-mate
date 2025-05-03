import { NextApiRequest, NextApiResponse } from 'next';
import httpProxyMiddleware from 'next-http-proxy-middleware';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set no-cache headers
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  const target = 'http://localhost:8000';

  console.log(`Proxying request to: ${target}${req.url}`);
  
  // Вызываем middleware, но не возвращаем результат
  await httpProxyMiddleware(req, res, {
    target,
    changeOrigin: true,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
  
  // Не возвращаем ничего, так как middleware обрабатывает ответ
  return;
} 