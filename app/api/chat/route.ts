import { NextResponse } from 'next/server'
import base from '@/lib/chatbot/base.json'
import { buscar, formatarContexto, type Trecho } from '@/lib/chatbot/busca'
import { MARCA_CONTATO, montarPromptSistema } from '@/lib/chatbot/prompt'

export const runtime = 'nodejs'

type Mensagem = {
  papel: 'usuario' | 'assistente'
  texto: string
}

type GroqResponse = {
  choices?: Array<{
    message?: {
      content?: unknown
    }
  }>
}

type RequestBucket = {
  startedAt: number
  count: number
}

const requestBuckets = new Map<string, RequestBucket>()
const RATE_LIMIT = 20
const RATE_WINDOW_MS = 10 * 60 * 1000
const FALLBACK_ANSWER = 'Não consegui responder agora. Fale com a equipe PoliVSR.'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateMessages(value: unknown): Mensagem[] | null {
  if (!isRecord(value) || !Array.isArray(value.mensagens)) return null
  if (value.mensagens.length < 1 || value.mensagens.length > 12) return null

  const mensagens: Mensagem[] = []
  for (const item of value.mensagens) {
    if (!isRecord(item) || (item.papel !== 'usuario' && item.papel !== 'assistente')) return null
    if (typeof item.texto !== 'string') return null
    const texto = item.texto.trim()
    if (!texto || texto.length > 600) return null
    mensagens.push({ papel: item.papel, texto })
  }

  return mensagens.at(-1)?.papel === 'usuario' ? mensagens : null
}

function allowRequest(request: Request): boolean {
  const now = Date.now()
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const bucket = requestBuckets.get(ip)

  if (!bucket || now - bucket.startedAt >= RATE_WINDOW_MS) {
    requestBuckets.set(ip, { startedAt: now, count: 1 })
  } else if (bucket.count >= RATE_LIMIT) {
    return false
  } else {
    bucket.count += 1
  }

  if (requestBuckets.size > 5000) {
    for (const [address, entry] of requestBuckets) {
      if (now - entry.startedAt >= RATE_WINDOW_MS) requestBuckets.delete(address)
    }
  }
  return true
}

async function callGroq(
  model: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  keys: string[],
): Promise<Response | null> {
  const start = Math.floor(Math.random() * keys.length)

  for (let attempt = 0; attempt < keys.length; attempt += 1) {
    const key = keys[(start + attempt) % keys.length]
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          max_completion_tokens: 600,
          reasoning_effort: 'low',
        }),
        signal: AbortSignal.timeout(20_000),
      })

      if (response.ok) return response
      if (response.status !== 429 && response.status < 500) return null
    } catch {
      continue
    }
  }

  return null
}

export async function POST(request: Request) {
  if (!allowRequest(request)) {
    return NextResponse.json({ erro: 'limite' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'entrada_invalida' }, { status: 400 })
  }

  const mensagens = validateMessages(body)
  if (!mensagens) {
    return NextResponse.json({ erro: 'entrada_invalida' }, { status: 400 })
  }

  const keys = (process.env.GROQ_API_KEYS ?? '')
    .split(',')
    .map(key => key.trim())
    .filter(Boolean)
  if (!keys.length) {
    return NextResponse.json({ erro: 'sem_chave' }, { status: 500 })
  }

  const userMessages = mensagens.filter(mensagem => mensagem.papel === 'usuario')
  const latestQuestion = userMessages.at(-1)?.texto ?? ''
  const previousQuestion = userMessages.at(-2)?.texto
  const retrievalQuestion = previousQuestion
    ? `${previousQuestion}\n${latestQuestion}`
    : latestQuestion
  const contexto = formatarContexto(buscar(retrievalQuestion, base as Trecho[]))
  const groqMessages = [
    { role: 'system' as const, content: montarPromptSistema(contexto) },
    ...mensagens.slice(-6).map(mensagem => ({
      role: mensagem.papel === 'usuario' ? 'user' as const : 'assistant' as const,
      content: mensagem.texto,
    })),
  ]

  let response = await callGroq('openai/gpt-oss-120b', groqMessages, keys)
  if (!response) {
    response = await callGroq('openai/gpt-oss-20b', groqMessages, keys)
  }
  if (!response) {
    return NextResponse.json({ erro: 'indisponivel' }, { status: 502 })
  }

  let generated = ''
  try {
    const result = await response.json() as GroqResponse
    const content = result.choices?.[0]?.message?.content
    generated = typeof content === 'string' ? content.trim() : ''
  } catch {
    return NextResponse.json({ erro: 'indisponivel' }, { status: 502 })
  }

  if (!generated) {
    return NextResponse.json({ resposta: FALLBACK_ANSWER, contato: true })
  }

  const contato = generated.includes(MARCA_CONTATO)
  const resposta = generated.replaceAll(MARCA_CONTATO, '').trim()
  return NextResponse.json({
    resposta: resposta || FALLBACK_ANSWER,
    contato: contato || !resposta,
  })
}
