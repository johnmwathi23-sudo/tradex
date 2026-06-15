import crypto from "crypto"

const API_BASE = "https://www.okx.com"

interface OKXConfig {
  apiKey: string
  secretKey: string
  passphrase: string
  projectId?: string
}

function getConfig(): OKXConfig {
  const apiKey = process.env.OKX_API_KEY
  const secretKey = process.env.OKX_SECRET_KEY
  const passphrase = process.env.OKX_PASSPHRASE
  if (!apiKey || !secretKey || !passphrase) {
    throw new Error("OKX credentials not configured")
  }
  return { apiKey, secretKey, passphrase }
}

function sign(method: string, path: string, body: string, secretKey: string): string {
  const timestamp = new Date().toISOString()
  const message = timestamp + method + path + body
  return crypto.createHmac("sha256", secretKey).update(message).digest("base64")
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const config = getConfig()
  const bodyStr = body ? JSON.stringify(body) : ""
  const timestamp = new Date().toISOString()
  const signature = sign(method, path, bodyStr, config.secretKey)

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "OK-ACCESS-KEY": config.apiKey,
      "OK-ACCESS-SIGN": signature,
      "OK-ACCESS-TIMESTAMP": timestamp,
      "OK-ACCESS-PASSPHRASE": config.passphrase,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json()

  if (!res.ok || data.code !== "0") {
    throw new Error(`OKX API error: ${data.msg || data.code}`)
  }

  return data.data
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function requestWithRetry<T>(
  method: string,
  path: string,
  body?: unknown,
  retries = 3
): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await request<T>(method, path, body)
    } catch (err) {
      if (attempt === retries - 1) throw err
      const delay = Math.pow(2, attempt) * 1000
      console.warn(`OKX retry ${attempt + 1}/${retries} after ${delay}ms:`, (err as Error).message)
      await sleep(delay)
    }
  }
  throw new Error("Unreachable")
}

export const okxClient = {
  get: <T>(path: string) => requestWithRetry<T>("GET", path),
  post: <T>(path: string, body?: unknown) => requestWithRetry<T>("POST", path, body),
}
