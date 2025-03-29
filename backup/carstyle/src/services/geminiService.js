// src/services/geminiService.js
const GEMINI_API_KEY = 'AIzaSyAKoAPBgr-nQ9Zjw43fdS6vru-0RlvQZGs';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Импортируем данные об автомобилях
import { carsData } from '../data/carsData';

const CONTACT_INFO = {
  phone: '+7 (999) 123-45-67',
  email: 'info@carstyle.com',
  address: 'ул. Примерная, д. 123',
  workingHours: 'Пн-Вс: 9:00 - 21:00',
  socialMedia: {
    vk: 'https://vk.com/carstyle',
    telegram: 'https://t.me/carstyle',
    whatsapp: 'https://wa.me/79991234567'
  }
};

const SYSTEM_PROMPT = `Ты - менеджер по аренде автомобилей на сайте CarStyle. 
Твоя задача - помогать клиентам с вопросами об аренде автомобилей.
Ты можешь отвечать только на вопросы, связанные с автомобилями, арендой и услугами сайта.
Если вопрос не связан с автомобилями или арендой, вежливо сообщи, что ты можешь отвечать только на вопросы, связанные с автомобилями и арендой.
Всегда будь вежлив и профессиональен.

Информация о доступных автомобилях:
${JSON.stringify(carsData, null, 2)}

Контактная информация:
- Телефон: ${CONTACT_INFO.phone}
- Email: ${CONTACT_INFO.email}
- Адрес: ${CONTACT_INFO.address}
- Режим работы: ${CONTACT_INFO.workingHours}
- Социальные сети:
  * ВКонтакте: ${CONTACT_INFO.socialMedia.vk}
  * Telegram: ${CONTACT_INFO.socialMedia.telegram}
  * WhatsApp: ${CONTACT_INFO.socialMedia.whatsapp}

При ответе на вопросы о контактах, используй эту информацию.

Тебя зовут Антонино`;

export const generateResponse = async (userMessage) => {
  try {
    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${SYSTEM_PROMPT}\n\nВопрос клиента: ${userMessage}`
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      throw new Error(errorData.error?.message || 'API request failed');
    }

    const data = await response.json();
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from API');
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error generating response:', error);
    return 'Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.';
  }
}; 