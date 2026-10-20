'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { ArrowRight, BarChart3, Check, CheckCircle2, CircleDollarSign, Search, Target, UsersRound } from 'lucide-react'
import { TOTAL_DIA, VERAO } from '@/lib/dados/inicio'

type TabId = 'about' | 'data' | 'simulator'
type Audience = 'Engenharia' | 'Economia' | 'Público Geral'

type Study = { audience: Audience; title: string; level?: string; summary: string }

const tabs = [
  { id: 'about' as const, label: 'Quem Somos', icon: UsersRound },
  { id: 'data' as const, label: 'Pesquisas e Dados', icon: BarChart3 },
  { id: 'simulator' as const, label: 'O Preço do Fixo', icon: CircleDollarSign },
]

const SimulatorPage = dynamic(() => import('@/components/custo-do-fixo'), { ssr: false })

const curvePoints = [...VERAO, VERAO[0]]
const Lmax = Math.max(...curvePoints)
const Lmin = Math.min(...curvePoints)
const variations = curvePoints.slice(1).map((load, index) => Math.abs(load - curvePoints[index]))
const totalVariation = variations.reduce((total, value) => total + value, 0)
const cumulativeOperations = [0]
variations.forEach(value => cumulativeOperations.push(cumulativeOperations[cumulativeOperations.length - 1] + (value / totalVariation) * TOTAL_DIA))

function curveY(load: number) { return 10 + 28 * (Lmax - load) / (Lmax - Lmin) }
function curveYAtHour(hour: number) {
  const position = Math.max(0, Math.min(48, hour * 2))
  const lowerIndex = Math.floor(position)
  const upperIndex = Math.min(48, lowerIndex + 1)
  const fraction = position - lowerIndex
  const load = curvePoints[lowerIndex] + (curvePoints[upperIndex] - curvePoints[lowerIndex]) * fraction
  return curveY(load)
}
function formatCurveHour(hour: number) {
  const roundedHour = Math.round(hour * 2) / 2
  const wholeHour = Math.floor(roundedHour)
  return `${String(wholeHour).padStart(2, '0')}h${roundedHour - wholeHour >= 0.5 ? '30' : ''}`
}

function referenceHour(hour: number) {
  const wholeHour = Math.floor(hour)
  return `${wholeHour}h${hour - wholeHour >= 0.5 ? '30' : ''}`
}

function heroLead(hour: number) {
  const index = Math.round(hour * 2)
  const time = referenceHour(index / 2)
  if (index === 0) return 'Num dia útil de verão, à 0h, o contador do dia zera:'
  if (index === 48) return 'Num dia útil de verão, ao longo das 24 horas, o SIN faz cerca de'
  return `Num dia útil de verão, até ${Math.floor(index / 2) <= 1 ? 'a' : 'as'} ${time}, o SIN já fez cerca de`
}

function heroNarrative(hour: number) {
  const index = Math.round(hour * 2)
  const point = curvePoints[index]
  const time = referenceHour(index / 2)
  const article = Math.floor(index / 2) <= 1 ? 'À ' : 'Às '
  const previous = curvePoints[(index + 47) % 48]
  const next = curvePoints[(index + 1) % 48]
  const hourlyChange = next - previous
  const load = `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(point)} GW`
  const lead = index === 48 ? 'Ao fim do dia, ' : `${article}${time}, `

  if (index >= 23 && index <= 25) return `${article}${time}, a carga líquida do SIN chega ao vale do dia, ${load}. O sol, sobretudo nos telhados da geração distribuída, cobre boa parte do consumo: as linhas ficam leves, sobra reativo e a tensão sobe. É quando a rede mais precisa de reatores ligados.`
  if (index >= 38 && index <= 40) return `${article}${time}, a carga líquida bate o pico do dia, ${load}: o sol já se pôs e o consumo continua alto. Com as linhas carregadas, os reatores que entraram de manhã já saíram.`
  if (hourlyChange > 0.4) return `${lead}a carga líquida está em ${load} e sobe cerca de ${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(hourlyChange)} GW por hora: o sol vai embora e começa a rampa da tarde. Os reatores saem, um a um, para não faltar reativo.`
  if (hourlyChange < -0.4 && index >= 11 && index < 23) return `${lead}a carga líquida está em ${load} e caindo: o sol nasce e a geração distribuída tira carga da rede. As linhas ficam leves, sobra reativo, e o operador liga reatores, um degrau de cada vez.`
  if (hourlyChange < -0.4) return `${lead}a carga líquida está em ${load} e recua depois do pico da noite. Com a carga mais leve, os reatores voltam a entrar para segurar a tensão.`
  return `${lead}madrugada, a carga líquida está estável, perto de ${load}. Os reatores que entraram à noite seguem ligados.`
}

const heroEstimateNote = 'A curva é a carga líquida média do SIN no verão de 2025–26 (ONS). O contador é uma estimativa: o ONS prevê cerca de 140 reatores chaveados num dia útil de verão de 2026, cada um entrando e saindo ao menos uma vez (≈ 280 manobras), distribuídas pelas horas conforme a carga líquida sobe ou desce.'

function BrandMark() {
  return <span className="flex items-center gap-1.5" aria-label="PoliVSR"><svg viewBox="0 0 28 28" className="size-7 skew-x-[-15deg]" role="img" aria-label="Marca PoliVSR"><ellipse cx="7" cy="14" rx="3.2" ry="10" fill="none" stroke="currentColor" strokeWidth="3" /><ellipse cx="14" cy="14" rx="3.2" ry="10" fill="none" stroke="currentColor" strokeWidth="3" /><ellipse cx="21" cy="14" rx="3.2" ry="10" fill="none" stroke="currentColor" strokeWidth="3" /></svg><span className="text-[1.35rem] font-extrabold tracking-[-.06em]">Poli<span className="text-[#e60000]">VSR</span></span></span>
}

function CurveChart({ hour, onChange }: { hour: number; onChange: (hour: number) => void }) {
  const draggingPointer = useRef<number | null>(null)
  const markerX = 4 + (hour / 24) * 92
  const markerY = curveYAtHour(hour)
  const points = curvePoints.map((load, index) => `${4 + (index / 48) * 92},${curveY(load)}`).join(' ')
  const updateHour = (clientX: number, element: HTMLDivElement) => {
    const svg = element.querySelector('svg')
    if (!svg) return
    const bounds = svg.getBoundingClientRect()
    if (!bounds.width) return
    onChange(Math.max(0, Math.min(24, ((clientX - bounds.left) / bounds.width) * 24)))
  }
  const stopDragging = (pointerId: number, element: HTMLDivElement) => {
    if (draggingPointer.current !== pointerId) return
    draggingPointer.current = null
    if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId)
  }
  return <div className="relative w-full max-w-5xl pointer-events-auto touch-pan-y" style={{ touchAction: 'pan-y' }} aria-label="Gráfico interativo da curva de pato" role="group" onPointerDown={event => { draggingPointer.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); updateHour(event.clientX, event.currentTarget) }} onPointerMove={event => { if (draggingPointer.current === event.pointerId) updateHour(event.clientX, event.currentTarget) }} onPointerUp={event => stopDragging(event.pointerId, event.currentTarget)} onPointerCancel={event => stopDragging(event.pointerId, event.currentTarget)}><svg viewBox="0 0 100 46" className="pointer-events-none h-auto w-full overflow-visible" aria-hidden="true"><defs><linearGradient id="curve-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e60000" stopOpacity=".48" /><stop offset="1" stopColor="#e60000" stopOpacity="0" /></linearGradient><linearGradient id="curve-stroke"><stop stopColor="#ff7777" /><stop offset=".5" stopColor="#e60000" /><stop offset="1" stopColor="#ff7777" /></linearGradient></defs><path d="M4 10H96M4 24H96M4 38H96" stroke="white" strokeOpacity=".1" strokeWidth=".25" /><polygon points={`4,${curveY(curvePoints[0])} ${points} 96,42 4,42`} fill="url(#curve-fill)" /><polyline points={points} fill="none" stroke="url(#curve-stroke)" strokeWidth=".85" vectorEffect="non-scaling-stroke" /><line x1={markerX} x2={markerX} y1="5" y2="42" stroke="white" strokeOpacity=".8" strokeDasharray="1 1" strokeWidth=".35" /><circle cx={markerX} cy={markerY} r="1.6" fill="#e60000" stroke="white" strokeWidth=".55" /></svg><input aria-label="Hora do dia" aria-valuetext={formatCurveHour(hour)} type="range" min="0" max="24" step={0.5} value={hour} onChange={event => onChange(Number(event.currentTarget.value))} className="pointer-events-none absolute inset-0 z-50 h-full w-full opacity-0" /><div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-[.18em] text-slate-500"><span>00h</span><span>Curva de pato · {formatCurveHour(hour)}</span><span>24h</span></div></div>
}

const blocks = [
  ['Quem somos', 'Somos o PoliVSR, um núcleo de Inteligência de Rede formado por pesquisadores da Poli-USP, viabilizado por fomento à pesquisa da Hitachi Energy. Atuamos na validação técnica e econômica independente para os novos desafios do Sistema Interligado Nacional (SIN). Com a expansão das linhas e o crescimento das renováveis intermitentes, a demanda flutua drasticamente e a tensão se eleva em cargas leves. O PoliVSR investiga e quantifica em quais cenários a adoção de tecnologias de ajuste contínuo (VSR) traz viabilidade financeira e resiliência à rede, substituindo a rigidez operacional atual.'],
  ['O que é o VSR e por que investigamos esta alternativa?', 'Hoje, a rede utiliza amplamente reatores fixos que operam em estados binários (ligado/desligado). Para controlar a tensão em cenários voláteis, realizam-se manobras de disjuntor que, ao longo do tempo, geram desgaste mecânico e elétrico. O Variable Shunt Reactor (VSR) atua de forma dinâmica lenta, semelhante a um dimmer. Equipado com um comutador sob carga (OLTC), ele altera o número de espiras ativas em pequenos degraus automáticos, ajustando a absorção de potência reativa sem desconectar o ativo. Nosso estudo propõe avaliar como essa estabilidade se converte em economia frente a outras alternativas.'],
] as const

function PageEndNavigation({ activeTab, onNavigate }: { activeTab: TabId; onNavigate: (tab: TabId) => void }) {
  const availableTabs = tabs.filter(tab => tab.id !== activeTab)
  return <nav className="border-t border-slate-200 bg-white px-6 py-12" aria-label="Explorar outras páginas"><div className="mx-auto flex max-w-5xl flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-8">{availableTabs.map(tab => { const Icon = tab.icon; return <button key={tab.id} onClick={() => onNavigate(tab.id)} className={`flex items-center gap-2 text-sm font-bold transition ${tab.id === 'simulator' ? 'rounded-full bg-red-600 px-5 py-2.5 text-white shadow-[0_0_12px_3px_rgba(230,0,0,0.38)] hover:bg-red-700' : 'rounded px-4 py-3 text-slate-600 hover:bg-slate-100 hover:text-[#e60000]'}`}><Icon aria-hidden="true" />{tab.label}</button> })}</div></nav>
}

function Hero({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
const [hour, setHour] = useState(0)
  useEffect(() => {
    const now = new Date(); setHour(now.getHours() + (now.getMinutes() >= 30 ? 0.5 : 0))
  }, [])
  const maneuvers = Math.round(cumulativeOperations[Math.round(hour * 2)])
  return <><section className="bg-slate-950 px-5 pb-24 pt-32 text-left text-white sm:px-8 sm:pt-40"><div className="mx-auto flex max-w-6xl flex-col items-start"><p className="mb-5 self-center text-center text-xs font-bold uppercase tracking-[.3em] text-red-400">PoliVSR · pesquisa aplicada</p><p className="text-2xl font-semibold text-white sm:text-3xl">{heroLead(hour)}</p><h1 className="my-2 text-7xl font-black leading-none tracking-[-.07em] text-red-600 sm:text-8xl lg:text-[9rem]">{maneuvers} manobras</h1><p className="text-2xl font-semibold text-white sm:text-3xl">de disjuntor para ligar e desligar reatores.</p><p className="mt-3 max-w-xl text-base text-slate-300 sm:text-lg">{heroNarrative(hour)}</p><div className="mt-14 w-full"><CurveChart hour={hour} onChange={setHour} /></div><p className="mt-8 text-sm text-slate-400 sm:text-base">Arraste sobre a curva para acompanhar a operação ao longo do dia.</p><p className="mt-2 max-w-3xl text-xs leading-5 text-slate-400">{heroEstimateNote}</p><button type="button" onClick={() => onNavigate('simulator')} className="relative z-0 mx-auto mt-10 overflow-hidden rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-[0_0_12px_3px_rgba(230,0,0,0.38)] animate-cta-aurora transition hover:bg-red-700">Acessar Calculadora de OPEX</button></div></section><section id="about-project" className="relative z-10 -mt-16 rounded-xl bg-white px-6 py-24 shadow-xl"><div className="mx-auto max-w-5xl"><p className="mb-4 text-xs font-bold uppercase tracking-[.25em] text-red-600">O projeto PoliVSR</p><h2 className="text-4xl font-black tracking-tight sm:text-6xl">Da pesquisa aplicada à rede do futuro.</h2><div className="mt-16 divide-y divide-slate-200">{blocks.map(([title, text], index) => <article key={title} className={`grid gap-6 py-12 md:grid-cols-[.8fr_1.4fr] ${index % 2 ? 'bg-slate-50' : 'bg-white'}`}><h3 className="text-2xl font-bold">{title}</h3><p className="text-lg leading-8 text-slate-600">{text}</p></article>)}</div></div></section><WindingRoadmapSection /><PageEndNavigation activeTab="about" onNavigate={onNavigate} /><ContactSection /></>
}

function WindingRoadmapSection() {
  const phases = [
    {
      number: 0,
      status: 'Concluída',
      title: 'Base e modelo',
      description: 'Base de dados com 92 arquivos públicos do ONS, ANEEL e BC; modelo físico e financeiro (Monte Carlo). Calculadora “O Custo do Fixo” criada no Hackathon Hitachi Energy 2026.',
      result: 'Comparação entre VSR e reator fixo com dados públicos.',
    },
    {
      number: 1,
      status: 'Próxima (previsão de 0 a 6 meses)',
      title: 'Mapa de oportunidades',
      description: 'Aplicar a calculadora aos reatores novos previstos nos planos do ONS (PAR/PEL) e nos próximos leilões de transmissão.',
      result: 'Lista das subestações onde um VSR tende a sair mais barato.',
    },
    {
      number: 2,
      status: 'Planejada (previsão de cerca de 1 ano)',
      title: 'Medição com transmissoras',
      description: 'Projeto de P&D com uma transmissora (programa ANEEL), usando dados reais de manobras, desgaste de disjuntores e histórico de falhas.',
      result: 'Calculadora calibrada com a operação real e plano de troca preventiva.',
    },
    {
      number: 3,
      status: 'Planejada',
      title: 'Estudo de caso real',
      description: 'Escolher uma ou duas subestações do plano de expansão da transmissora parceira e comparar em detalhe o VSR e o reator fixo no local.',
      result: 'Decisão técnica e econômica para uma obra concreta.',
    },
    {
      number: 4,
      status: 'Planejada (opcional)',
      title: 'Piloto em campo',
      description: 'Instalar um VSR em uma dessas subestações e acompanhar o funcionamento por um a dois anos.',
      result: 'Os primeiros dados de VSR em operação na rede brasileira.',
    },
    {
      number: 5,
      status: 'Planejada',
      title: 'Regras e referências de preço',
      description: 'Com os resultados, propor a inclusão do VSR na tabela de preços de referência da ANEEL e nos estudos de leilões.',
      result: 'Permitir que transmissoras escolham o VSR quando for a opção mais barata.',
    },
  ]
  const timeline = [
    { label: 'F1 · 6 meses', start: 0, end: 6, highlighted: true },
    { label: 'F2 · ~1 ano', start: 6, end: 18, highlighted: false },
    { label: 'F3 · 6 meses', start: 18, end: 24, highlighted: false },
    { label: 'F4 · 2 anos', start: 24, end: 48, highlighted: false },
    { label: 'F5 · 1 ano', start: 48, end: 60, highlighted: false },
  ]
  const yearTicks = ['0', '1 ano', '2 anos', '3 anos', '4 anos', '5 anos']
  const rowHeight = 300
  const roadmapPath = [
    `M500 ${rowHeight / 2}`,
    ...phases.slice(0, -1).map((_, index) => {
      const side = index % 2 === 0 ? -1 : 1
      const y = rowHeight * index + rowHeight / 2
      return `C ${500 + side * 70} ${y + rowHeight * 0.33} ${500 + side * 70} ${y + rowHeight * 0.67} 500 ${rowHeight * (index + 1) + rowHeight / 2}`
    }),
  ].join(' ')

  return <section className="relative z-10 bg-gray-50 px-6 py-24 text-slate-900 sm:px-10">
    <div className="relative z-10 mx-auto max-w-6xl">
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-red-600">Próximos passos</p>
        <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Roadmap</h2>
        <p className="mt-5 text-lg leading-8 text-slate-600">Um caminho progressivo para transformar pesquisa aplicada em decisões mais seguras para a rede.</p>
      </header>
      <div className="mx-auto mt-8 max-w-3xl rounded-xl bg-white p-4 shadow-sm sm:mt-10 sm:p-6" aria-label="Cronograma das fases 1 a 5, de 0 a 5 anos">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold">Cronograma</h3>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className="size-2.5 rounded-full bg-red-600" aria-hidden="true" />
            Próxima
          </span>
        </div>
        <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-x-2">
          <span aria-hidden="true" />
          <div className="relative h-4 text-[9px] font-medium text-slate-500 sm:text-xs">
            {yearTicks.map((tick, index) => <span
              key={tick}
              className="absolute top-0 whitespace-nowrap"
              style={{
                left: `${index * 20}%`,
                transform: index === 0 ? 'none' : index === yearTicks.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
              }}
            >{tick}</span>)}
          </div>
        </div>
        <div className="mt-2 space-y-2">
          {timeline.map(phase => <div key={phase.label} className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-x-2">
            <span className="text-[10px] font-semibold text-slate-600 sm:text-xs">{phase.label}</span>
            <div className="relative h-3 overflow-hidden rounded-full bg-slate-50">
              {yearTicks.map((tick, index) => <span
                key={tick}
                className="pointer-events-none absolute inset-y-0 z-0 border-l border-slate-200"
                style={{ left: `${index * 20}%` }}
              />)}
              <span
                className={`absolute inset-y-0 z-10 rounded-full ${phase.highlighted ? 'bg-red-600' : 'bg-slate-300'}`}
                style={{ left: `${phase.start / 60 * 100}%`, width: `${(phase.end - phase.start) / 60 * 100}%` }}
              />
            </div>
          </div>)}
        </div>
      </div>
      <div className="relative mx-auto mt-12 max-w-5xl pl-16 lg:pl-0">
        <div className="absolute bottom-6 left-6 top-6 z-0 border-l-[3px] border-dashed border-red-300 lg:hidden" aria-hidden="true" />
        <svg className="pointer-events-none absolute inset-x-0 top-0 hidden h-full w-full overflow-visible lg:block" viewBox={`0 0 1000 ${phases.length * rowHeight}`} preserveAspectRatio="none" aria-hidden="true">
          <path d={roadmapPath} fill="none" stroke="#e60000" strokeDasharray="2 14" strokeLinecap="round" strokeWidth="6" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="relative space-y-6 lg:space-y-0">
          {phases.map(phase => {
            const completed = phase.number === 0
            const next = phase.number === 1
            const right = phase.number % 2 === 0
            const badgeClass = completed
              ? 'bg-slate-800 text-white'
              : phase.number === 1
                ? 'bg-red-50 text-red-700'
                : 'bg-slate-100 text-slate-900'
            const nodeClass = completed
              ? 'bg-red-600 text-white'
              : next
                ? 'bg-white text-red-600 ring-4 ring-red-200'
                : 'bg-white text-slate-500 ring-2 ring-slate-200'
            return <article key={phase.number} className={`relative -ml-16 flex min-h-0 items-start pl-16 lg:ml-0 lg:h-[300px] lg:items-center lg:pl-0 ${right ? 'lg:justify-end' : 'lg:justify-start'}`}>
              <div className="absolute left-0 top-5 z-20 size-12 lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2" aria-hidden="true">
                {next && <span className="absolute inset-0 rounded-full bg-red-200/70 animate-ping motion-reduce:animate-none" />}
                <span className={`relative z-10 grid size-12 place-items-center rounded-full border-4 border-gray-50 text-lg font-black shadow-md ${nodeClass}`}>
                  {completed ? <Check className="size-5 stroke-[3]" /> : phase.number}
                </span>
              </div>
              <div className={`relative z-10 w-full rounded-2xl bg-white p-6 shadow-lg ring-1 transition duration-200 lg:w-[42%] lg:hover:-translate-y-1 lg:hover:shadow-xl ${next ? 'ring-red-100' : 'ring-slate-100'}`}>
                <div className={`mb-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${badgeClass}`}>{phase.status}</div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-red-600">Fase {phase.number}</p>
                <h3 className="mt-1 text-xl font-bold sm:text-2xl">{phase.title}</h3>
                <p className="mt-3 leading-7 text-slate-700">{phase.description}</p>
                <footer className="mt-5 flex items-start gap-2 border-t border-slate-100 pt-4 text-sm font-semibold leading-6 text-slate-900">
                  <Target className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden="true" />
                  <span><span className="text-red-600">Resultado:</span> {phase.result}</span>
                </footer>
              </div>
            </article>
          })}
        </div>
      </div>
    </div>
  </section>
}

function ContactSection() {
  const [sent, setSent] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
  }, [])

  return <section className="bg-gray-950 px-6 py-24 text-white">
    <div className="mx-auto max-w-5xl">
      <h2 className="mb-4 text-4xl font-bold">Traga a estabilidade do VSR para a sua concessão.</h2>
      <p className="mb-12 max-w-3xl text-lg text-gray-400">O grupo de pesquisa PoliVSR atua na modelagem técnica e comercial de Variable Shunt Reactors no SIN. Se a sua transmissora enfrenta elevados custos com desgaste mecânico e sobretensões na carga leve, apoie a criação deste laboratório. Mapeamos, de forma acadêmica, a viabilidade operacional de mitigar o OPEX invisível na sua concessão.</p>
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <div className="flex flex-col gap-6 text-gray-300">
          <p><strong className="text-white">Projeto Conceitual:</strong> Hackathon Hitachi Energy 2026</p>
          <p><strong className="text-white">Repositório do Projeto / Equipe:</strong> <a href="https://github.com/JPauloSar/PoliVSR-Hackathon-Hitachi" target="_blank" rel="noopener noreferrer" className="break-all underline underline-offset-4 hover:text-white">github.com/JPauloSar/PoliVSR-Hackathon-Hitachi</a></p>
          <p><strong className="text-white">Email:</strong> pesquisa@polivsr.usp.br</p>
          <p><strong className="text-white">Ambiente de Pesquisa:</strong> Poli-USP, São Paulo - SP</p>
          <p><strong className="text-white">Apoio e Fomento:</strong> Hitachi Energy HUB, Guarulhos - SP</p>
        </div>
        <form className="flex flex-col gap-4" onSubmit={event => {
          event.preventDefault()
          const form = event.currentTarget
          form.reset()
          if (timerRef.current !== null) window.clearTimeout(timerRef.current)
          setSent(true)
          timerRef.current = window.setTimeout(() => {
            setSent(false)
            timerRef.current = null
          }, 5000)
        }}>
          <input className="rounded border border-gray-700 bg-gray-900 p-3 text-white" placeholder="Nome completo" name="nome" aria-label="Nome completo" required />
          <input className="rounded border border-gray-700 bg-gray-900 p-3 text-white" placeholder="Empresa (Concessionária / Agente)" name="empresa" aria-label="Empresa (Concessionária / Agente)" required />
          <input className="rounded border border-gray-700 bg-gray-900 p-3 text-white" placeholder="E-mail corporativo" name="email" aria-label="E-mail corporativo" type="email" required />
          <textarea className="h-32 rounded border border-gray-700 bg-gray-900 p-3 text-white" placeholder="Como as sobretensões afetam o OPEX da sua operação hoje?" name="mensagem" aria-label="Como as sobretensões afetam o OPEX da sua operação hoje?" required />
          <button type="submit" className="rounded bg-red-600 p-4 text-center font-bold hover:bg-red-700">Solicitar Estudo de Viabilidade</button>
          <p role="status" aria-live="polite" className="flex items-center gap-2 rounded border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-300">
            {sent && <><CheckCircle2 aria-hidden="true" size={18} /><span>Envio confirmado. Obrigado pelo contato!</span></>}
          </p>
        </form>
      </div>
    </div>
  </section>
}

const audienceDescriptions: Record<Audience, string> = { 'Público Geral': 'Textos explicativos e didáticos sobre a tecnologia VSR e o funcionamento do sistema elétrico. Conteúdo formatado sem jargões para facilitar o primeiro contato com a nossa pesquisa.', Engenharia: 'Pesquisas acadêmicas e estudos de engenharia sobre os impactos na confiabilidade e controle dinâmico do grid. Acompanhe os avanços técnicos da substituição de reatores fixos por modelos de derivação variável.', Economia: 'Estudos sobre os impactos financeiros, redução de OPEX e viabilidade de mercado. Direcionado a concessionárias e investidores que buscam entender o custo-benefício e o retorno financeiro da tecnologia.' }

const studies: Study[] = [
  { audience: 'Público Geral', title: 'Entenda o Efeito Ferranti na Prática', summary: 'Por que a tensão sobe perigosamente quando o consumo do país cai durante o dia.' },
  { audience: 'Público Geral', title: 'O que é a Curva de Pato?', summary: 'Como os painéis solares mudaram o comportamento do Sistema Interligado Nacional.' },
  { audience: 'Público Geral', title: 'Interruptor vs. Dimmer', summary: 'A diferença fundamental entre o reator fixo e a regulação suave do VSR.' },
  { audience: 'Engenharia', title: 'Análise de Sobretensões em Regime Permanente no SIN', level: 'Mestrado', summary: 'Mapeamento das regiões Norte e Nordeste em condições de carga mínima.' },
  { audience: 'Engenharia', title: 'Impacto das Manobras na Vida Útil de Disjuntores de 500 kV', level: 'IC', summary: 'Quantificação do desgaste mecânico e elétrico causado pelo chaveamento constante.' },
  { audience: 'Engenharia', title: 'Controle Dinâmico Lento e o uso de OLTC em Reatores', level: 'Doutorado', summary: 'Modelagem do comportamento do comutador de derivação para estabilidade de tensão.' },
  { audience: 'Economia', title: 'Calculadora de Payback: CAPEX vs OPEX do VSR', level: 'Mestrado', summary: 'Comparativo financeiro da adoção da tecnologia frente aos custos de manutenção de longo prazo.' },
  { audience: 'Economia', title: 'Custos Operacionais Invisíveis da Rigidez do Grid', level: 'IC', summary: 'O preço real que as transmissoras pagam pela limitação dos reatores fixos atuais.' },
]

function ArticleView({ article, onBack, onSelect, onNavigate }: { article: Study; onBack: () => void; onSelect?: (article: Study) => void; onNavigate: (tab: TabId) => void }) {
  const related = studies.filter(study => study.audience === article.audience && study.title !== article.title).slice(0, 2)
  return <section className="min-h-screen bg-white px-6 pb-24 pt-32 text-gray-900 sm:px-10"><div className="mx-auto max-w-5xl"><button onClick={onBack} className="mb-14 text-sm font-bold text-[#e60000] hover:underline">← Voltar para Pesquisas</button><header className="max-w-4xl"><p className="text-sm font-bold uppercase tracking-[.2em] text-gray-400">{article.audience}</p><h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">{article.title}</h1>{article.level && <span className="mt-6 inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">{article.level}</span>}<p className="mt-5 text-sm text-gray-500">Última atualização: 15 de Outubro de 2026</p></header><article className="mx-auto mt-14 max-w-3xl text-lg leading-relaxed text-gray-700"><p>{article.summary} Este estudo apresenta uma leitura aprofundada dos dados operacionais e dos impactos da tecnologia VSR no sistema elétrico brasileiro.</p><p className="mt-7">A pesquisa combina modelagem, medições e análise de cenários para transformar evidências técnicas em decisões mais seguras. Os resultados ajudam a compreender como a regulação variável pode reduzir manobras, preservar ativos e ampliar a flexibilidade do grid.</p><p className="mt-7">Ao aproximar universidade, indústria e agentes de transmissão, o PoliVSR cria uma base pública para a evolução do sistema. Novos dados serão incorporados conforme os estudos avancem.</p><button className="mt-12 rounded bg-red-600 px-6 py-4 text-base font-bold text-white hover:bg-red-700">Acessar Publicação Oficial</button></article><div className="mx-auto mt-24 max-w-3xl border-t border-gray-200 pt-10"><h2 className="text-2xl font-bold">Artigos Relacionados</h2><div className="mt-6 grid gap-4 sm:grid-cols-2">{related.map(item => <button key={item.title} onClick={() => onSelect?.(item)} className="rounded border border-gray-200 p-5 text-left transition hover:border-red-600 hover:shadow-[0_0_20px_rgba(230,0,0,0.3)]"><span className="text-sm font-bold text-red-600">{item.audience}</span><p className="mt-2 font-bold">{item.title}</p></button>)}</div></div></div></section>
}

function DataPage({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const [activeAudience, setActiveAudience] = useState<Audience>('Engenharia')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArticle, setSelectedArticle] = useState<Study | null>(null)
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior }) }, [selectedArticle])
  if (selectedArticle) return <ArticleView article={selectedArticle} onBack={() => setSelectedArticle(null)} onNavigate={onNavigate} />
  const visibleStudies = studies.filter(study => study.audience === activeAudience && study.title.toLowerCase().includes(searchQuery.toLowerCase()))
  return <><section className="min-h-screen bg-white px-6 pb-24 pt-32 text-gray-900 sm:px-10"><div className="mx-auto max-w-6xl"><div className="py-10 text-center sm:py-16"><p className="text-xs font-bold uppercase tracking-[.3em] text-[#e60000]">Repositório público</p><h1 className="mt-4 text-5xl font-black tracking-tight sm:text-7xl">Pesquisas e dados.</h1><div className="relative mx-auto mt-10 w-full max-w-2xl"><label htmlFor="study-search" className="sr-only">Buscar pesquisa</label><input id="study-search" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Busque pelo nome da pesquisa..." className="w-full rounded border border-gray-200 bg-white py-4 pl-12 pr-5 text-base shadow-sm outline-none transition focus:border-[#e60000] focus:ring-2 focus:ring-red-100" /><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" /></div><div className="mt-8 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Filtrar pesquisas por público">{(['Engenharia', 'Economia', 'Público Geral'] as Audience[]).map(audience => <button key={audience} role="tab" aria-selected={activeAudience === audience} onClick={() => setActiveAudience(audience)} className={`rounded px-5 py-3 text-sm font-bold transition ${activeAudience === audience ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{audience}</button>)}</div><p className="mx-auto mt-8 max-w-3xl rounded bg-gray-50 p-6 text-center text-sm leading-7 text-gray-700 sm:text-base">{audienceDescriptions[activeAudience]}</p></div><div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{visibleStudies.map(study => <button key={study.title} onClick={() => setSelectedArticle(study)} className="flex min-h-64 cursor-pointer flex-col rounded border border-gray-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-red-600 hover:shadow-[0_0_20px_rgba(230,0,0,0.3)]">{study.level && <span className="w-fit rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">{study.level}</span>}<h2 className="mt-5 text-xl font-bold leading-snug">{study.title}</h2><p className="mt-3 flex-1 text-sm leading-6 text-gray-600">{study.summary}</p><span className="mt-5 self-end text-sm font-bold text-red-600">Ler estudo →</span></button>)}</div>{visibleStudies.length === 0 && <p className="py-20 text-center text-gray-500">Nenhuma pesquisa encontrada.</p>}</div></section></>
}

function Placeholder({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  return <><SimulatorPage /><PageEndNavigation activeTab="simulator" onNavigate={onNavigate} /></>
}

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabId>('about')
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior }) }, [activeTab])
  return <main className="min-h-screen bg-white text-slate-950"><header className="fixed inset-x-0 top-0 z-20 border-b border-slate-200 bg-white"><div className="mx-auto flex h-20 max-w-7xl items-center gap-8 px-6 sm:px-10 lg:px-16"><button onClick={() => setActiveTab('about')} aria-label="Ir para o início"><BrandMark /></button><nav className="hidden items-center gap-8 md:flex" aria-label="Navegação principal">{tabs.map(tab => { const Icon = tab.icon; return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 text-sm font-bold transition-colors ${tab.id === 'simulator' ? 'rounded-full bg-red-600 px-5 py-2.5 text-white shadow-[0_0_12px_3px_rgba(230,0,0,0.38)] hover:bg-red-700' : `rounded-full px-3 py-2 ${activeTab === tab.id ? 'bg-slate-200 text-slate-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}`}><Icon data-icon="inline-start" />{tab.label}</button> })}</nav><nav className="ml-auto flex items-center gap-1 md:hidden" aria-label="Navegação principal mobile">{tabs.map(tab => { const Icon = tab.icon; return <button key={tab.id} onClick={() => setActiveTab(tab.id)} aria-label={tab.label} aria-current={activeTab === tab.id ? 'page' : undefined} title={tab.label} className={`flex items-center justify-center transition-colors ${tab.id === 'simulator' ? 'min-w-24 rounded-full bg-red-600 px-4 py-2 text-white shadow-[0_0_11px_2px_rgba(230,0,0,0.35)]' : `size-11 rounded-full ${activeTab === tab.id ? 'bg-slate-200 text-slate-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}`}><Icon aria-hidden="true" /></button> })}</nav></div></header>{activeTab === 'about' ? <Hero onNavigate={setActiveTab} /> : activeTab === 'data' ? <><DataPage onNavigate={setActiveTab} /><PageEndNavigation activeTab="data" onNavigate={setActiveTab} /></> : <Placeholder onNavigate={setActiveTab} />}</main>
}
