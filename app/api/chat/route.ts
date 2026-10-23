import { NextResponse } from 'next/server'
import base from '@/lib/chatbot/base.json'
import { buscar, formatarContexto, type Trecho } from '@/lib/chatbot/busca'
import {
  MARCA_CONTATO,
  montarPromptSistema,
  RESPOSTA_FORA_DO_ESCOPO,
} from '@/lib/chatbot/prompt'

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
const FALLBACK_SEM_CONCORRENTES = 'O PoliVSR estuda o VSR da Hitachi Energy. Para outras dúvidas, fale com a equipe.'
const MAX_CONTEXT_TEXT_CHARS = 7000
const knowledgeBase = base as Trecho[]
const versaoVigente = knowledgeBase.find(trecho => trecho.titulo === 'Versão vigente')
const CONCORRENTES_NOMES = /\b(?:Siemens|Vernova|General Electric|Hyundai|CHINT|Trench|Toshiba|Hyosung|Kon[cč]ar|Reinhausen|Maschinenfabrik|Mitsubishi|TBEA)\b/iu
const CONCORRENTES_SIGLAS = /\b(?:GE|WEG|ABB|BTW)\b/u
const PEDIDOS_CRIATIVOS = /\b(poemas?|poesias?|piadas?|m[uú]sicas?|rap|can[cç][aã]o|conto|hist[oó]rinha|roteiro|finja|encene|interprete|como se (?:fosse|voc[eê] fosse)|personagens?|my little|pon[e]?y|pok[eé]mon|marvel|disney|harry potter|anime)\b/iu
const PEDIDO_ANALOGIA_COM_TEMA = /\banalogia\s+(?:a|à|ao|com|usando|de|do|da|sobre|envolvendo|no estilo)\s+(?!(?:(?:a|o|as|os|um|uma)\s+)?(?:espuma|chope|cerveja)\b)\S/iu

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function corrigirNomes(texto: string): string {
  return texto.replace(/\bHit[a-zà-ü]*/giu, palavra =>
    palavra.length >= 5 && palavra.toLowerCase() !== 'hitachi' ? 'Hitachi' : palavra,
  )
}

function removerConcorrentes(texto: string): string {
  return texto
    .split(/(?<=[.!?])\s+/)
    .filter(frase => !CONCORRENTES_NOMES.test(frase) && !CONCORRENTES_SIGLAS.test(frase))
    .join(' ')
    .trim()
}

function deveRecusarPedidoCriativo(pergunta: string): boolean {
  return PEDIDOS_CRIATIVOS.test(pergunta)
    || (/\banalogia\b/iu.test(pergunta) && PEDIDO_ANALOGIA_COM_TEMA.test(pergunta))
}

function validateMessages(value: unknown): Mensagem[] | null {
  if (!isRecord(value) || !Array.isArray(value.mensagens)) return null
  if (value.mensagens.length < 1 || value.mensagens.length > 50) return null

  const ultimasMensagens = value.mensagens.slice(-12)
  const mensagens: Mensagem[] = []
  for (const [index, item] of ultimasMensagens.entries()) {
    if (!isRecord(item) || (item.papel !== 'usuario' && item.papel !== 'assistente')) return null
    if (typeof item.texto !== 'string') return null
    const texto = item.texto.trim()
    if (!texto || (index === ultimasMensagens.length - 1 && texto.length > 600)) return null
    mensagens.push({ papel: item.papel, texto: texto.slice(0, 600) })
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

function parseGroqApiKeys(value: string | undefined): string[] {
  const normalized = (value ?? '')
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .replace(/^GROQ_API_KEYS\s*=\s*/i, '')
  const keys = normalized
    .split(/[\s,;]+/)
    .map(key => key.replace(/^["']+|["']+$/g, ''))
    .filter(key => /^gsk_[A-Za-z0-9]+$/.test(key))
  return [...new Set(keys)]
}

function indicaContatoComEquipe(texto: string): boolean {
  const normalized = texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  return /\b(?:fale|falar|converse|conversar|entre em contato|contato com|contate|contatar|procure|consulte|consultar|indique|indicar|busque|buscar)\b.{0,100}\b(?:equipe|time)\b/.test(normalized)
    || /\b(?:equipe|time)\b.{0,80}\b(?:pode|podera|consegue|vai)\b.{0,50}\b(?:ajudar|orientar|informar|esclarecer|atender)\b/.test(normalized)
}

function semInformacao(texto: string): boolean {
  const normalized = texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
  return /\b(?:nao (?:tenho|ha|encontrei|possuo|consta)|sem)\b.{0,40}\binformac/.test(normalized)
}

function montarContexto(perguntaAtual: string, perguntaAnterior?: string): string {
  const atuais = buscar(perguntaAtual, knowledgeBase, 5)
  const extras = perguntaAnterior
    ? buscar(`${perguntaAtual} ${perguntaAnterior}`, knowledgeBase, 3)
    : []
  const candidatos = [...(versaoVigente ? [versaoVigente] : []), ...atuais, ...extras]
  const selecionados: Trecho[] = []
  const ids = new Set<string>()
  let totalTexto = 0

  for (const trecho of candidatos) {
    if (ids.has(trecho.id) || totalTexto + trecho.texto.length > MAX_CONTEXT_TEXT_CHARS) continue
    selecionados.push(trecho)
    ids.add(trecho.id)
    totalTexto += trecho.texto.length
  }

  return formatarContexto(selecionados)
}

async function callGroq(
  model: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  keys: string[],
): Promise<Response | null> {
  const start = Math.floor(Math.random() * keys.length)
  const failures: Array<{ keyIndex: number; status: number | 'timeout' | 'network' }> = []

  for (let attempt = 0; attempt < keys.length; attempt += 1) {
    const keyIndex = (start + attempt) % keys.length
    const key = keys[keyIndex]
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
      failures.push({ keyIndex: keyIndex + 1, status: response.status })
      if (
        response.status < 500
        && response.status !== 401
        && response.status !== 403
        && response.status !== 429
      ) {
        break
      }
    } catch (error) {
      failures.push({
        keyIndex: keyIndex + 1,
        status: error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'network',
      })
    }
  }

  for (const failure of failures) {
    console.error(JSON.stringify({ model, key_index: failure.keyIndex, status: failure.status }))
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

  const keys = parseGroqApiKeys(process.env.GROQ_API_KEYS)
  if (!keys.length) {
    return NextResponse.json({ erro: 'sem_chave' }, { status: 500 })
  }

  const userMessages = mensagens.filter(mensagem => mensagem.papel === 'usuario')
  const latestQuestion = userMessages.at(-1)?.texto ?? ''
  if (deveRecusarPedidoCriativo(latestQuestion)) {
    return NextResponse.json({ resposta: RESPOSTA_FORA_DO_ESCOPO, contato: false })
  }
  const previousQuestion = userMessages.at(-2)?.texto
  const contexto = montarContexto(latestQuestion, previousQuestion)
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

  const resposta = corrigirNomes(generated.replaceAll(MARCA_CONTATO, '')).trim()
  const respostaFiltrada = removerConcorrentes(resposta)
  const respostaRemovida = !respostaFiltrada
  const respostaParaContato = respostaFiltrada || FALLBACK_SEM_CONCORRENTES
  const faltaInformacao = semInformacao(respostaParaContato)
  const indicaContato = indicaContatoComEquipe(respostaParaContato)
  const respostaFinal = faltaInformacao && !indicaContato
    ? `${respostaParaContato} Fale com a equipe PoliVSR.`
    : respostaParaContato
  return NextResponse.json({
    resposta: respostaFinal || FALLBACK_ANSWER,
    contato: respostaRemovida || indicaContato || faltaInformacao || !resposta,
  })
}
