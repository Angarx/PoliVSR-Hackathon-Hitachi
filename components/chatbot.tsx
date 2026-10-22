'use client'

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { MessageCircle, SendHorizontal, X } from 'lucide-react'
import { CONTATO_EMAIL } from '@/lib/chatbot/prompt'

type Mensagem = {
  papel: 'usuario' | 'assistente'
  texto: string
  contato?: boolean
  erro?: boolean
}

const sugestoes = [
  'O que é um VSR?',
  'Quando o VSR compensa?',
  'O que é o PoliVSR?',
]

const mensagemInicial = 'Oi! Tiro dúvidas sobre o VSR e o projeto PoliVSR.'

export default function Chatbot() {
  const [aberto, setAberto] = useState(false)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [rascunho, setRascunho] = useState('')
  const [carregando, setCarregando] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fimRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return

    textareaRef.current?.focus({ preventScroll: true })
    const fecharComEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setAberto(false)
    }
    window.addEventListener('keydown', fecharComEscape)
    return () => window.removeEventListener('keydown', fecharComEscape)
  }, [aberto])

  useEffect(() => {
    if (!aberto) return

    const bodyOverflow = document.body.style.overflow
    const atualizarBloqueio = () => {
      document.body.style.overflow = window.matchMedia('(max-width: 639px)').matches
        ? 'hidden'
        : bodyOverflow
    }

    atualizarBloqueio()
    window.addEventListener('resize', atualizarBloqueio)
    return () => {
      document.body.style.overflow = bodyOverflow
      window.removeEventListener('resize', atualizarBloqueio)
    }
  }, [aberto])

  useEffect(() => {
    if (aberto) fimRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [aberto, mensagens, carregando])

  async function enviar(pergunta: string) {
    const texto = pergunta.trim()
    if (!texto || carregando) return

    const usuario: Mensagem = { papel: 'usuario', texto }
    const historico = [...mensagens, usuario]
    setMensagens(historico)
    setRascunho('')
    setCarregando(true)
    if (textareaRef.current) textareaRef.current.style.height = '40px'

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagens: historico
            .filter(mensagem => !mensagem.erro)
            .slice(-12)
            .map(({ papel, texto: mensagem }) => ({
              papel,
              texto: mensagem,
            })),
        }),
      })
      const data = await response.json().catch(() => ({})) as {
        resposta?: unknown
        contato?: unknown
        erro?: unknown
      }

      if (!response.ok || typeof data.resposta !== 'string') {
        const erro = response.status === 429 && data.erro === 'limite'
          ? 'Muitas perguntas seguidas. Tente de novo em alguns minutos.'
          : 'Não consegui responder agora. Tente de novo em instantes.'
        setMensagens([...historico, { papel: 'assistente', texto: erro, erro: true }])
        return
      }

      setMensagens([
        ...historico,
        {
          papel: 'assistente',
          texto: data.resposta,
          contato: data.contato === true,
        },
      ])
    } catch {
      setMensagens([
        ...historico,
        {
          papel: 'assistente',
          texto: 'Não consegui responder agora. Tente de novo em instantes.',
          erro: true,
        },
      ])
    } finally {
      setCarregando(false)
    }
  }

  function enviarFormulario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void enviar(rascunho)
  }

  function tratarTecla(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void enviar(rascunho)
    }
  }

  function atualizarRascunho(value: string) {
    setRascunho(value)
    if (!textareaRef.current) return
    textareaRef.current.style.height = '40px'
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 112)}px`
  }

  return (
    <>
      {!aberto && (
        <button
          type="button"
          aria-label="Abrir assistente PoliVSR"
          onClick={() => setAberto(true)}
          className="fixed right-5 z-50 flex size-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.25rem)' }}
        >
          <MessageCircle aria-hidden="true" size={25} />
        </button>
      )}

      {aberto && (
        <section
          role="dialog"
          aria-label="Assistente PoliVSR"
          aria-modal="true"
          className="fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl ring-1 ring-slate-200 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:h-[560px] sm:w-[380px] sm:rounded-2xl"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h2 className="font-bold text-slate-900">Assistente PoliVSR</h2>
              <p className="text-xs text-slate-500">Responde com os dados do projeto</p>
            </div>
            <button
              type="button"
              aria-label="Fechar"
              onClick={() => setAberto(false)}
              className="flex size-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              <X aria-hidden="true" size={20} />
            </button>
          </header>

          <div
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
          >
            {mensagens.length === 0 ? (
              <>
                <p className="max-w-[85%] self-start whitespace-pre-wrap rounded-2xl rounded-bl-md bg-slate-100 px-3 py-2 text-sm text-slate-900">
                  {mensagemInicial}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sugestoes.map(sugestao => (
                    <button
                      key={sugestao}
                      type="button"
                      disabled={carregando}
                      onClick={() => void enviar(sugestao)}
                      className="rounded-full border border-red-300 px-3 py-1.5 text-left text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {sugestao}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              mensagens.map((mensagem, index) => (
                <div
                  key={`${index}-${mensagem.papel}`}
                  className={mensagem.papel === 'usuario' ? 'ml-auto max-w-[85%]' : 'mr-auto max-w-[85%]'}
                >
                  <p
                    className={`whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                      mensagem.papel === 'usuario'
                        ? 'rounded-br-md bg-red-600 text-white'
                        : 'rounded-bl-md bg-slate-100 text-slate-900'
                    }`}
                  >
                    {mensagem.texto}
                  </p>
                  {mensagem.contato && (
                    <div className="mt-2 flex flex-col items-start gap-1 pl-1">
                      <a
                        href={`mailto:${CONTATO_EMAIL}`}
                        className="text-xs font-semibold text-red-700 underline underline-offset-2"
                      >
                        Falar com a equipe
                      </a>
                      <span className="text-xs text-slate-500">
                        ou pelo formulário no fim da página inicial
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}

            {carregando && (
              <div
                aria-label="Assistente está respondendo"
                className="mr-auto flex gap-1 rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3"
              >
                <span className="size-2 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.3s]" />
                <span className="size-2 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.15s]" />
                <span className="size-2 animate-bounce rounded-full bg-slate-500" />
              </div>
            )}
            <div ref={fimRef} />
          </div>

          <form onSubmit={enviarFormulario} className="flex shrink-0 items-end gap-2 border-t border-slate-100 p-3">
            <textarea
              ref={textareaRef}
              rows={1}
              maxLength={600}
              value={rascunho}
              onChange={event => atualizarRascunho(event.currentTarget.value)}
              onKeyDown={tratarTecla}
              placeholder="Pergunte sobre o VSR…"
              aria-label="Pergunte sobre o VSR"
              className="max-h-28 min-h-10 flex-1 resize-none overflow-y-auto rounded-xl border border-slate-300 px-3 py-1.5 text-base leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              style={{ height: 40 }}
            />
            <button
              type="submit"
              aria-label="Enviar mensagem"
              disabled={carregando || !rascunho.trim()}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <SendHorizontal aria-hidden="true" size={19} />
            </button>
          </form>
        </section>
      )}
    </>
  )
}
