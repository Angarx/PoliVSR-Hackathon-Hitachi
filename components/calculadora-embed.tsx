'use client'

import { useEffect, useRef } from 'react'

// A calculadora e a página de Monte Carlo são páginas estáticas em public/calculadora/,
// geradas a partir dos dados do PoliVSR (pasta PoliVSR-dados, site/fonte/montar_paginas.py).
// Com ?embed=1 elas escondem o cabeçalho e o rodapé próprios, porque o site já tem os seus.
const PAGINA = '/calculadora/o-custo-do-fixo.html?embed=1'

// Ajusta a altura do iframe ao conteúdo da página embutida (mesma origem), para não haver
// barra de rolagem dupla, e cuida da rolagem quando se troca entre calculadora e Monte Carlo.
export function acompanharIframe(frame: HTMLIFrameElement): () => void {
  let observador: ResizeObserver | null = null
  let anterior = ''

  const medir = () => {
    const doc = frame.contentDocument
    if (!doc || !doc.documentElement) return
    const altura = Math.ceil(doc.documentElement.getBoundingClientRect().height)
    if (altura > 0) frame.style.height = `${altura}px`
  }

  const aoCarregar = () => {
    if (observador) observador.disconnect()
    const doc = frame.contentDocument
    const janela = frame.contentWindow as (Window & { ResizeObserver: typeof ResizeObserver }) | null
    if (!doc || !doc.documentElement || !janela) return
    medir()
    observador = new janela.ResizeObserver(medir)
    observador.observe(doc.documentElement)
    const atual = janela.location.pathname
    if (anterior) {
      // Indo para o Monte Carlo: começa do topo. Voltando para a calculadora: volta ao botão do Monte Carlo.
      const topoDoIframe = frame.getBoundingClientRect().top + window.scrollY
      const botao = anterior.endsWith('monte-carlo.html') ? doc.querySelector('.mc-link') : null
      const alvo = botao ? topoDoIframe + botao.getBoundingClientRect().top - 120 : 0
      window.scrollTo({ top: Math.max(0, alvo), left: 0, behavior: 'instant' as ScrollBehavior })
    }
    anterior = atual
  }

  frame.addEventListener('load', aoCarregar)
  if (frame.contentDocument?.readyState === 'complete' && frame.contentWindow?.location.href !== 'about:blank') aoCarregar()
  return () => {
    frame.removeEventListener('load', aoCarregar)
    if (observador) observador.disconnect()
  }
}

export default function CalculadoraEmbed() {
  const frameRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    return acompanharIframe(frame)
  }, [])

  return (
    <section className="bg-slate-50 pt-20">
      <iframe
        ref={frameRef}
        src={PAGINA}
        title="O Custo do Fixo: simulador do VSR contra reatores fixos"
        className="block w-full border-0"
        style={{ height: 1800 }}
      />
    </section>
  )
}
