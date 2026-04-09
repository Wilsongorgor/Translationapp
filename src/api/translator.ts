// OpenAI API for advanced translation
export async function translateWithAI(
  text: string,
  targetLang: string = 'Chinese'
): Promise<string> {
  try {
    const apiKey = localStorage?.getItem?.('openai_api_key') || process.env.REACT_APP_OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Please set it in AI Translator settings.')
    }

    const axios = await import('axios').then(m => m.default)
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following text to ${targetLang}. Return only the translation without any explanation.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data.choices?.[0]?.message?.content || text
  } catch (error) {
    console.error('AI translation error:', error)
    throw error
  }
}

// Main translator using Electron IPC (translate in main process)
export async function translateText(
  text: string,
  targetLang?: string,
  engine: 'google' | 'baidu' | 'ali' | 'ai' = 'google'
): Promise<string | { translatedText: string; detectedLanguage: string; targetLanguage: string }> {
  if (!text || !text.trim()) {
    throw new Error('Text cannot be empty')
  }

  // AI translation uses direct API call
  if (engine === 'ai') {
    return translateWithAI(text, targetLang || 'Chinese')
  }

  // Other engines use IPC to main process
  try {
    console.log(`[Renderer API] 调用 IPC 翻译: 文本="${text.substring(0, 50)}", 目标语言=${targetLang || 'auto'}`)
    
    const result = await window.electron.translateText(text, targetLang)
    
    if (result.success) {
      console.log(`[Renderer API] ✅ 翻译成功`)
      
      // 返回包含检测信息的对象，以便 UI 可以显示检测语言和目标语言
      return {
        translatedText: result.data,
        detectedLanguage: result.detectedLanguage || '',
        targetLanguage: result.targetLanguage || '',
      }
    } else {
      console.error(`[Renderer API] ❌ 翻译失败: ${result.error}`)
      throw new Error(`翻译失败: ${result.error}`)
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[Renderer API] ❌ 异常错误: ${errorMsg}`)
    throw new Error(`翻译失败，请检查网络连接: ${errorMsg}`)
  }
}
