import axios from 'axios';

export async function translateWithAI(text: string, targetLang: string = 'Chinese'): Promise<string> {
  const apiKey = localStorage.getItem('openai_api_key');
  if (!apiKey) throw new Error('API Key not configured');
  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: `Translate to ${targetLang}. Return only translation.` },
        { role: 'user', content: text },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    },
    { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
  );
  return res.data.choices?.[0]?.message?.content || text;
}

export async function translateText(
  text: string,
  targetLang?: string,
  engine: 'google' | 'ai' = 'google'
): Promise<string | { translatedText: string; detectedLanguage: string; targetLanguage: string }> {
  if (!text?.trim()) throw new Error('Text cannot be empty');
  if (engine === 'ai') return translateWithAI(text, targetLang || 'Chinese');
  try {
    const result = await window.electron.translateText(text, targetLang);
    if (result.success) {
      return {
        translatedText: result.data,
        detectedLanguage: result.detectedLanguage || '',
        targetLanguage: result.targetLanguage || '',
      };
    }
    throw new Error(result.error || 'Translation failed');
  } catch (e: any) {
    throw new Error(e?.message || 'Translation failed');
  }
}