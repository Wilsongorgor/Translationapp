// 发音数据库 - 结合本地缓存和在线API
// 先从本地缓存查询，如果没有则调用在线API

const pronunciationCache: Record<string, { uk: string; us: string; audio?: string }> = {
  // 常见短词
  'hi': { uk: 'haɪ', us: 'haɪ' },
  'bye': { uk: 'baɪ', us: 'baɪ' },
  'ok': { uk: 'ˌəʊˈkeɪ', us: 'oʊˈkeɪ' },
  'yes': { uk: 'jes', us: 'jes' },
  'no': { uk: 'nəʊ', us: 'noʊ' },
  'me': { uk: 'miː', us: 'miː' },
  'it': { uk: 'ɪt', us: 'ɪt' },
  'is': { uk: 'ɪz', us: 'ɪz' },
  'am': { uk: 'æm', us: 'æm' },
  'are': { uk: 'ɑːr', us: 'ɑːr' },
  'go': { uk: 'ɡəʊ', us: 'ɡoʊ' },
  
  // 问候和常用
  'hello': { uk: 'həˈləʊ', us: 'həˈloʊ' },
  'hey': { uk: 'heɪ', us: 'heɪ' },
  'goodbye': { uk: 'ɡʊdˈbaɪ', us: 'ɡʊdˈbaɪ' },
  'thanks': { uk: 'θæŋks', us: 'θæŋks' },
  'thank': { uk: 'θæŋk', us: 'θæŋk' },
  'please': { uk: 'pliːz', us: 'pliːz' },
  'sorry': { uk: 'ˈsɒri', us: 'ˈsɑːri' },
  'excuse': { uk: 'ɪkˈskjuːz', us: 'ɪkˈskjuːz' },
  'help': { uk: 'help', us: 'help' },
  
  // 日常词汇
  'world': { uk: 'wɜːld', us: 'wɜːrld' },
  'good': { uk: 'ɡʊd', us: 'ɡʊd' },
  'bad': { uk: 'bæd', us: 'bæd' },
  'nice': { uk: 'naɪs', us: 'naɪs' },
  'fine': { uk: 'faɪn', us: 'faɪn' },
  'great': { uk: 'ɡreɪt', us: 'ɡreɪt' },
  'wonderful': { uk: 'ˈwʌndəfl', us: 'ˈwʌndərfl' },
  'morning': { uk: 'ˈmɔːnɪŋ', us: 'ˈmɔːrnɪŋ' },
  'afternoon': { uk: 'ˌɑːftərˈnuːn', us: 'ˌæftərˈnuːn' },
  'evening': { uk: 'ˈiːvnɪŋ', us: 'ˈiːvnɪŋ' },
  'night': { uk: 'naɪt', us: 'naɪt' },
  'day': { uk: 'deɪ', us: 'deɪ' },
  'time': { uk: 'taɪm', us: 'taɪm' },
  'love': { uk: 'lʌv', us: 'lʌv' },
  'like': { uk: 'laɪk', us: 'laɪk' },
  'want': { uk: 'wɒnt', us: 'wɑːnt' },
  'need': { uk: 'niːd', us: 'niːd' },
  
  // 动作词
  'eat': { uk: 'iːt', us: 'iːt' },
  'drink': { uk: 'drɪŋk', us: 'drɪŋk' },
  'water': { uk: 'ˈwɔːtə', us: 'ˈwɔːtər' },
  'food': { uk: 'fuːd', us: 'fuːd' },
  'sleep': { uk: 'sliːp', us: 'sliːp' },
  'work': { uk: 'wɜːk', us: 'wɜːrk' },
  'play': { uk: 'pleɪ', us: 'pleɪ' },
  'run': { uk: 'rʌn', us: 'rʌn' },
  'walk': { uk: 'wɔːk', us: 'wɔːk' },
  'talk': { uk: 'tɔːk', us: 'tɔːk' },
  'read': { uk: 'riːd', us: 'riːd' },
  'write': { uk: 'raɪt', us: 'raɪt' },
  'listen': { uk: 'ˈlɪsən', us: 'ˈlɪsən' },
  'watch': { uk: 'wɒtʃ', us: 'wɑːtʃ' },
  'see': { uk: 'siː', us: 'siː' },
  'look': { uk: 'lʊk', us: 'lʊk' },
  'understand': { uk: 'ˌʌndəˈstænd', us: 'ˌʌndərˈstænd' },
  'know': { uk: 'nəʊ', us: 'noʊ' },
  'think': { uk: 'θɪŋk', us: 'θɪŋk' },
  
  // 地点和物品
  'home': { uk: 'həʊm', us: 'hoʊm' },
  'school': { uk: 'skuːl', us: 'skuːl' },
  'office': { uk: 'ˈɒfɪs', us: 'ˈɑːfɪs' },
  'hospital': { uk: 'ˈhɒspɪtl', us: 'ˈhɑːspɪtl' },
  'restaurant': { uk: 'ˈrestrɒnt', us: 'ˈrestrɑːnt' },
  'book': { uk: 'bʊk', us: 'bʊk' },
  'computer': { uk: 'kəmˈpjuːtə', us: 'kəmˈpjuːtər' },
  'phone': { uk: 'fəʊn', us: 'foʊn' },
  'car': { uk: 'kɑːr', us: 'kɑːr' },
  'house': { uk: 'haʊs', us: 'haʊs' },
  'door': { uk: 'dɔːr', us: 'dɔːr' },
  'window': { uk: 'ˈwɪndəʊ', us: 'ˈwɪndoʊ' },
  'table': { uk: 'ˈteɪbl', us: 'ˈteɪbl' },
  'chair': { uk: 'tʃeər', us: 'tʃer' },
  'bed': { uk: 'bed', us: 'bed' },
  
  // 人物和关系
  'you': { uk: 'juː', us: 'juː' },
  'we': { uk: 'wiː', us: 'wiː' },
  'he': { uk: 'hiː', us: 'hiː' },
  'she': { uk: 'ʃiː', us: 'ʃiː' },
  'they': { uk: 'ðeɪ', us: 'ðeɪ' },
  'friend': { uk: 'frend', us: 'frend' },
  'family': { uk: 'ˈfæməli', us: 'ˈfæməli' },
  'mother': { uk: 'ˈmʌðə', us: 'ˈmʌðər' },
  'father': { uk: 'ˈfɑːðə', us: 'ˈfɑːðər' },
  'sister': { uk: 'ˈsɪstə', us: 'ˈsɪstər' },
  'brother': { uk: 'ˈbrʌðə', us: 'ˈbrʌðər' },
  'child': { uk: 'tʃaɪld', us: 'tʃaɪld' },
  'man': { uk: 'mæn', us: 'mæn' },
  'woman': { uk: 'ˈwʊmən', us: 'ˈwʊmən' },
  'person': { uk: 'ˈpɜːsən', us: 'ˈpɜːrsən' },
  
  // 学习和工作
  'study': { uk: 'ˈstʌdi', us: 'ˈstʌdi' },
  'teacher': { uk: 'ˈtiːtʃə', us: 'ˈtiːtʃər' },
  'student': { uk: 'ˈstjuːdənt', us: 'ˈstuːdənt' },
  'learn': { uk: 'lɜːn', us: 'lɜːrn' },
  'teach': { uk: 'tiːtʃ', us: 'tiːtʃ' },
  'class': { uk: 'klɑːs', us: 'klæs' },
  'lesson': { uk: 'ˈlesn', us: 'ˈlesn' },
  'test': { uk: 'test', us: 'test' },
  'exam': { uk: 'ɪɡˈzæm', us: 'ɪɡˈzæm' },
  
  // 数字和时间
  'one': { uk: 'wʌn', us: 'wʌn' },
  'two': { uk: 'tuː', us: 'tuː' },
  'three': { uk: 'θriː', us: 'θriː' },
  'four': { uk: 'fɔːr', us: 'fɔːr' },
  'five': { uk: 'faɪv', us: 'faɪv' },
  'six': { uk: 'sɪks', us: 'sɪks' },
  'seven': { uk: 'ˈsevən', us: 'ˈsevən' },
  'eight': { uk: 'eɪt', us: 'eɪt' },
  'nine': { uk: 'naɪn', us: 'naɪn' },
  'ten': { uk: 'ten', us: 'ten' },
  'hundred': { uk: 'ˈhʌndrəd', us: 'ˈhʌndrəd' },
  'thousand': { uk: 'ˈθaʊzənd', us: 'ˈθaʊzənd' },
  'year': { uk: 'jɪə', us: 'jɪr' },
  'month': { uk: 'mʌnθ', us: 'mʌnθ' },
  'week': { uk: 'wiːk', us: 'wiːk' },
  'hour': { uk: 'ˈaʊə', us: 'ˈaʊər' },
  'minute': { uk: 'ˈmɪnɪt', us: 'ˈmɪnɪt' },
  'second': { uk: 'ˈsekənd', us: 'ˈsekənd' },
  
  // 颜色和形容词
  'red': { uk: 'red', us: 'red' },
  'blue': { uk: 'bluː', us: 'bluː' },
  'green': { uk: 'ɡriːn', us: 'ɡriːn' },
  'yellow': { uk: 'ˈjeləʊ', us: 'ˈjeloʊ' },
  'black': { uk: 'blæk', us: 'blæk' },
  'white': { uk: 'waɪt', us: 'waɪt' },
  'big': { uk: 'bɪɡ', us: 'bɪɡ' },
  'small': { uk: 'smɔːl', us: 'smɔːl' },
  'tall': { uk: 'tɔːl', us: 'tɔːl' },
  'short': { uk: 'ʃɔːt', us: 'ʃɔːrt' },
  'long': { uk: 'lɒŋ', us: 'lɔːŋ' },
  'new': { uk: 'njuː', us: 'nuː' },
  'old': { uk: 'əʊld', us: 'oʊld' },
  'hot': { uk: 'hɒt', us: 'hɑːt' },
  'cold': { uk: 'kəʊld', us: 'koʊld' },
  'warm': { uk: 'wɔːm', us: 'wɔːrm' },
  'cool': { uk: 'kuːl', us: 'kuːl' },
  'fast': { uk: 'fɑːst', us: 'fæst' },
  'slow': { uk: 'sləʊ', us: 'sloʊ' },
  'happy': { uk: 'ˈhæpi', us: 'ˈhæpi' },
  'sad': { uk: 'sæd', us: 'sæd' },
  'angry': { uk: 'ˈæŋɡri', us: 'ˈæŋɡri' },
  'tired': { uk: 'ˈtaɪəd', us: 'ˈtaɪərd' },
  'sick': { uk: 'sɪk', us: 'sɪk' },
  'healthy': { uk: 'ˈhelθi', us: 'ˈhelθi' },
}

// 尝试从 phonetics API 获取发音
async function fetchPronunciationFromAPI(word: string): Promise<{ uk: string; us: string } | null> {
  try {
    // 使用 Free Dictionary API
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`)
    if (!response.ok) return null
    
    const data = await response.json()
    if (!data || !Array.isArray(data) || !data[0]) return null
    
    const entry = data[0]
    const phonetics = entry.phonetics || []
    
    // 提取音标 - 区分英式和美式
    let uk = '', us = ''
    for (const p of phonetics) {
      if (p.text) {
        const text = p.text.trim()
        if (text) {
          // 优先识别带有标记的音标
          if (p.text.includes('UK') || p.text.includes('/ˈ') || !uk) {
            if (!uk) uk = text
          } else {
            if (!us) us = text
          }
        }
      }
    }
    
    // 如果没有分开，两个都用第一个音标
    if (!us && uk) us = uk
    if (!uk && us) uk = us
    
    if (uk || us) {
      const result = { uk: uk || '无', us: us || '无' }
      // 缓存结果
      pronunciationCache[word.toLowerCase()] = result
      console.log(`发音API返回 ${word}:`, result)
      return result
    }
    
    console.log(`API未找到单词: ${word}`)
    return null
  } catch (error) {
    console.error('Failed to fetch pronunciation for', word, error)
    return null
  }
}

export async function getPronunciation(word: string): Promise<{ uk: string; us: string } | null> {
  const cleanWord = word.toLowerCase().trim()
  
  // 先从缓存查询
  if (pronunciationCache[cleanWord]) {
    return pronunciationCache[cleanWord]
  }
  
  // 如果缓存中没有，尝试从API获取
  const result = await fetchPronunciationFromAPI(cleanWord)
  return result
}

export function getPronunciationFromSentence(text: string): Array<{ word: string; uk: string; us: string }> {
  // 从句子中提取单词并获取音标
  const words = text.toLowerCase().match(/\b\w+\b/g) || []
  const result: Array<{ word: string; uk: string; us: string }> = []

  // 添加去重
  const uniqueWords = Array.from(new Set(words))

  for (const word of uniqueWords) {
    const pron = getPronunciation(word)
    if (pron) {
      result.push({ word, uk: pron.uk, us: pron.us })
    }
  }

  return result
}

// 合成语音函数（使用Web Speech API）
export function speakWord(word: string, lang: 'en-US' | 'en-GB' = 'en-US') {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = lang
    utterance.rate = 0.8 // 降低速度便于理解
    speechSynthesis.cancel() // 取消任何正在进行的语音
    speechSynthesis.speak(utterance)
  }
}
