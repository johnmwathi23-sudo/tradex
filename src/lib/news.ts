export interface NewsItem {
  title: string
  summary: string
  source: string
  url: string
  publishedAt: string
}

const RSS_FEEDS = [
  "https://feeds.content.dowjones.io/public/rss/mw_topstories",
  "https://www.investing.com/rss/news.rss",
  "https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC,^IXIC,DXY,EURUSD=X,GBPUSD=X,BTC-USD&region=US&lang=en-US",
]

async function parseRSS(url: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    const xml = await res.text()
    const items: NewsItem[] = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi
    let match
    while ((match = itemRegex.exec(xml)) !== null) {
      const content = match[1]
      const title = content.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || ""
      const description = content.match(/<description[^>]*>([^<]*)<\/description>/i)?.[1]?.trim() || ""
      const link = content.match(/<link[^>]*>([^<]*)<\/link>/i)?.[1]?.trim() || ""
      const pubDate = content.match(/<pubDate[^>]*>([^<]*)<\/pubDate>/i)?.[1]?.trim() || ""
      if (title) {
        items.push({
          title,
          summary: description.replace(/<[^>]*>/g, "").slice(0, 300),
          source: url,
          url: link,
          publishedAt: pubDate,
        })
      }
    }
    return items
  } catch {
    return []
  }
}

let cachedNews: NewsItem[] = []
let newsCacheTime = 0
const NEWS_CACHE_TTL = 300000

export async function fetchFinancialNews(): Promise<NewsItem[]> {
  if (Date.now() - newsCacheTime < NEWS_CACHE_TTL) return cachedNews

  const results = await Promise.allSettled(RSS_FEEDS.map(parseRSS))
  const allNews: NewsItem[] = []
  for (const r of results) {
    if (r.status === "fulfilled") allNews.push(...r.value)
  }

  allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
  cachedNews = allNews.slice(0, 30)
  newsCacheTime = Date.now()
  return cachedNews
}

export function extractKeywords(headlines: NewsItem[]): string[] {
  const words = headlines.flatMap((h) => h.title.toLowerCase().split(/\s+/))
  const freq: Record<string, number> = {}
  const stopwords = new Set(["the", "a", "an", "in", "on", "at", "to", "for", "of", "by", "with", "and", "or", "is", "are", "was", "were", "be", "been", "has", "have", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "shall", "can", "need", "dare", "ought", "used", "its", "it's", "that", "this", "these", "those", "from", "as", "into", "through", "during", "before", "after", "above", "below", "between", "out", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "each", "every", "both", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "just", "because", "but", "which", "who", "whom", "what", "whose"])
  for (const w of words) {
    const clean = w.replace(/[^a-z0-9$%]/g, "")
    if (clean.length > 3 && !stopwords.has(clean)) {
      freq[clean] = (freq[clean] || 0) + 1
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word)
}
