import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Проверяем метод
  if (req.method !== 'GET') {
    return res.status(405).json({ detail: 'Метод не разрешен' });
  }

  // Проверяем токен авторизации
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ detail: 'Отсутствует токен авторизации' });
  }

  try {
    // Получаем параметры поиска и приводим к строке
    const searchParam = req.query.search;
    const search = Array.isArray(searchParam) ? searchParam[0] : searchParam;
    
    if (search && search.trim().length < 1) {
      return res.status(400).json({ 
        detail: 'Введите текст для поиска' 
      });
    }
    
    // Добавляем timestamp для предотвращения кэширования
    const timestamp = new Date().getTime();
    
    // Формируем URL с учетом параметра поиска
    let url = `http://localhost:8000/api/auth/teachers/?_=${timestamp}`;
    if (search) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    
    console.log('Запрос к бэкенду для поиска преподавателей:', url);
    
    // Делаем запрос к API бэкенда
    const response = await axios({
      method: 'get',
      url,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    // Возвращаем результаты
    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Ошибка при получении списка преподавателей:', error);
    
    // Обрабатываем ошибки от сервера
    if (error.response) {
      const { status, data } = error.response;
      return res.status(status).json(data);
    }
    
    // Обрабатываем остальные ошибки
    return res.status(500).json({ detail: 'Внутренняя ошибка сервера' });
  }
} 