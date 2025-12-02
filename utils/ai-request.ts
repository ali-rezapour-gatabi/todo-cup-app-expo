import axios from 'axios';
import { Task } from '@/database/types';

const extractJsonFromMarkdown = (raw: string): string => {
  const fencedJsonMatch = raw.match(/```json\s*([\s\S]*?)```/i) || raw.match(/```([\s\S]*?)```/);

  if (fencedJsonMatch && fencedJsonMatch[1]) {
    return fencedJsonMatch[1].trim();
  }

  return raw.trim();
};

const getTodayString = (): string => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const AiApiRequest = async (prompt: string): Promise<Task> => {
  const today = getTodayString();

  const mainPrompt = `
شما یک سیستم هوشمند استخراج تسک هستید. ورودی کاربر را به یک تسک واحد مطابق ساختار زیر تبدیل کنید:

TaskInput = {
  title: string;
  description?: string;
  priority: 1 | 2 | 3;
  date: string;
  time: string;
  repeatDaily: boolean;
  isCompleted?: boolean;
};

قوانین مهم:
1. فقط یک تسک تولید کن.
2. اگر کاربر تاریخ نداد، تاریخ امروز (${today}) را قرار بده.
3. اگر کاربر زمان نداد، یک زمان منطقی مثل "12:00" قرار بده.
4. اگر پرایوریتی مشخص نبود، مقدار 2 قرار بده.
5. عنوان باید بسیار کوتاه و دقیق باشد.
6. توضیحات شامل جزئیات اضافه و کاملاً فارسی باشد.
7. تاریخ فرمت YYYY-MM-DD و زمان HH:MM باشد.
8. اگر کاربر گفت "هر روز"، repeatDaily = true قرار بده.
9. خروجی باید فقط و فقط یک JSON object معتبر باشد.
10. از قرار دادن JSON داخل code block مثل \`\`\`json یا \`\`\` خودداری کن.
11. هیچ متن اضافی قبل یا بعد از JSON تولید نکن.

درخواست کاربر:
${prompt}
`;

  const body = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: mainPrompt,
      },
    ],
    temperature: 0.2,
  };

  const response = await axios.post('https://api.piapi.ai/v1/chat/completions', body, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer bd4e67ef8345d48afc2c9865b9045d443c0aa0e1c14959a4205a45d8f4ac728c`,
    },
  });

  const raw = response.data?.choices?.[0]?.message?.content;

  if (!raw) {
    throw new Error('پاسخ معتبری از مدل دریافت نشد.');
  }

  try {
    const cleaned = extractJsonFromMarkdown(raw);

    console.log('AI RAW:', raw);
    console.log('AI CLEANED:', cleaned);

    const parsed: Task = JSON.parse(cleaned);

    if (!parsed.title || !parsed.date || !parsed.time) {
      throw new Error('JSON ناقص است.');
    }

    return parsed;
  } catch (err) {
    console.error('JSON parse error:', err);
    throw new Error('امکان تبدیل پاسخ مدل به تسک وجود ندارد.');
  }
};
