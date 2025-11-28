import axios from 'axios';
import { Task } from '@/database/types';

export const AiApiRequest = async (prompt: string): Promise<Task> => {
  const mainPrompt = `
شما یک سیستم هوشمند استخراج تسک هستید. وظیفه شما این است که ورودی کاربر را به یک تسک واحد مطابق ساختار زیر تبدیل کنید:

TaskInput = {
  title: string;
  description?: string;
  priority: 1 | 2 | 3 ;
  date: string;
  time: string;
  repeatDaily: boolean;
  isCompleted?: boolean;
};

قوانین:
1. فقط یک تسک تولید کن.
2. اگر کاربر تاریخ یا زمان نداد، مقدار منطقی حدس بزن.
3. اگر پرایوریتی مشخص نبود، مقدار 2 قرار بده.
4. عنوان بسیار کوتاه و دقیق باشد.
5. توضیحات شامل جزئیات اضافی باشد.
6. تاریخ فرمت YYYY-MM-DD و زمان HH:MM باشد.
7. اگر کاربر گفت "هر روز"، repeatDaily = true.
8. خروجی فقط یک JSON شامل TaskInput باشد. هیچ متن دیگری تولید نکن.
9. متن توضیحات فارسی باشد، ولی JSON انگلیسی بماند.

درخواست کاربر:
${prompt}
`;

  console.log(mainPrompt);

  const response = await axios.post(
    'https://api.piapi.ai/v1/chat/completions',
    {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: mainPrompt,
          response_format: 'json',
        },
      ],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.API_KEY}`,
      },
    }
  );
  console.log(response);

  const raw = response.data?.choices?.[0]?.message?.content;

  if (!raw) {
    throw new Error('پاسخ معتبری از هوش مصنوعی دریافت نشد.');
  }

  try {
    const task: Task = JSON.parse(raw);
    return task;
  } catch (error) {
    throw new Error('امکان تبدیل پاسخ هوش مصنوعی به تسک وجود ندارد.');
  }
};
