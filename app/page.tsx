'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, BarChart3, Building2, CircleDollarSign, FileText, Search, UsersRound, UtilityPole, Wind } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import calculatorData from '@/lib/dados/site_calculadora.json'
import { TOTAL_DIA, VERAO } from '@/lib/dados/inicio'

type TabId = 'about' | 'data' | 'simulator'
type Audience = 'Engenharia' | 'Economia' | 'Público Geral'

type Study = { audience: Audience; title: string; level?: string; summary: string }

const tabs = [
  { id: 'about' as const, label: 'Quem Somos', icon: UsersRound },
  { id: 'data' as const, label: 'Pesquisas e Dados', icon: BarChart3 },
  { id: 'simulator' as const, label: 'O Preço do Fixo', icon: CircleDollarSign },
]

const curvePoints = [...VERAO, VERAO[0]]
const Lmax = Math.max(...curvePoints)
const Lmin = Math.min(...curvePoints)
const variations = curvePoints.slice(1).map((load, index) => Math.abs(load - curvePoints[index]))
const totalVariation = variations.reduce((total, value) => total + value, 0)
const cumulativeOperations = [0]
variations.forEach(value => cumulativeOperations.push(cumulativeOperations[cumulativeOperations.length - 1] + (value / totalVariation) * TOTAL_DIA))
const model: any = calculatorData

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
function interpolate(grade: number[], series: number[], price: number) {
  if (!grade.length || !series.length) return 0
  if (price <= grade[0]) return series[0]
  const lastIndex = grade.length - 1
  if (price >= grade[lastIndex]) return series[lastIndex]
  const upperIndex = grade.findIndex((value, index) => index < lastIndex && value <= price && grade[index + 1] >= price)
  const lowerIndex = upperIndex - 1
  const fraction = (price - grade[lowerIndex]) / (grade[upperIndex] - grade[lowerIndex])
  return series[lowerIndex] + (series[upperIndex] - series[lowerIndex]) * fraction
}

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
  ['O que estamos fazendo', 'Estruturamos metodologias e ferramentas de simulação para calcular o impacto financeiro e operativo do Reator de Derivação Variável (VSR) no OPEX das concessionárias. Este site atua como nosso repositório técnico e painel de dados abertos. (Nota de Transparência: Como este é um projeto conceitual do Hackathon Hitachi 2026, os painéis interativos da versão atual utilizam simulações ilustrativas e dados em fase de calibração). Nossa equipe trabalha processando estatísticas reais de operação do ONS e EPE para fundamentar a evolução do sistema.'],
  ['O que queremos', 'Acreditamos na aliança transparente entre a universidade e a indústria para acelerar a inovação. Queremos atrair concessionárias de transmissão para estudos práticos conjuntos, modelando a redução de custos operacionais e o alívio no desgaste de ativos. Nosso papel acadêmico é fornecer ao planejamento do setor (ONS e EPE) embasamento técnico rigoroso para investigar se a tecnologia VSR é, de fato, a decisão mais eficiente para o Nordeste e outras regiões críticas do Brasil.'],
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
 const reactors = 140
  const maneuvers = Math.round(cumulativeOperations[Math.round(hour * 2)])
  return <><section className="bg-slate-950 px-5 pb-24 pt-32 text-left text-white sm:px-8 sm:pt-40"><div className="mx-auto flex max-w-6xl flex-col items-start"><p className="mb-5 self-center text-center text-xs font-bold uppercase tracking-[.3em] text-red-400">PoliVSR · pesquisa aplicada</p><p className="text-2xl font-semibold text-white sm:text-3xl">Apenas hoje,</p><h1 className="my-2 text-7xl font-black leading-none tracking-[-.07em] text-red-600 sm:text-8xl lg:text-[9rem]">{maneuvers} Manobras</h1><p className="text-2xl font-semibold text-white sm:text-3xl">agressivas de disjuntor foram realizadas no SIN.</p><p className="mt-3 max-w-xl text-base text-slate-300 sm:text-lg">{reactors} reatores fixos operam como interruptores brutos na rede apenas para conter as sobretensões diárias geradas pela sobra de reativo em linhas de carga leve.</p><div className="mt-14 w-full"><CurveChart hour={hour} onChange={setHour} /></div><p className="mt-8 text-sm text-slate-400 sm:text-base">Arraste sobre a curva para acompanhar a operação ao longo do dia.</p><button type="button" onClick={() => onNavigate('simulator')} className="relative z-0 mx-auto mt-10 overflow-hidden rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-[0_0_12px_3px_rgba(230,0,0,0.38)] animate-cta-aurora transition hover:bg-red-700">Acessar Calculadora de OPEX</button></div></section><section id="about-project" className="relative z-10 -mt-16 rounded-xl bg-white px-6 py-24 shadow-xl"><div className="mx-auto max-w-5xl"><p className="mb-4 text-xs font-bold uppercase tracking-[.25em] text-red-600">O projeto PoliVSR</p><h2 className="text-4xl font-black tracking-tight sm:text-6xl">Da pesquisa aplicada à rede do futuro.</h2><div className="mt-16 divide-y divide-slate-200">{blocks.map(([title, text], index) => <article key={title} className={`grid gap-6 py-12 md:grid-cols-[.8fr_1.4fr] ${index % 2 ? 'bg-slate-50' : 'bg-white'}`}><h3 className="text-2xl font-bold">{title}</h3><p className="text-lg leading-8 text-slate-600">{text}</p></article>)}</div></div></section><PageEndNavigation activeTab="about" onNavigate={onNavigate} /><ContactSection /></>
}

function ContactSection() { return <section className="bg-gray-950 px-6 py-24 text-white"><div className="mx-auto max-w-5xl"><h2 className="mb-4 text-4xl font-bold">Traga a estabilidade do VSR para a sua concessão.</h2><p className="mb-12 max-w-3xl text-lg text-gray-400">O grupo de pesquisa PoliVSR atua na modelagem técnica e comercial de Variable Shunt Reactors no SIN. Se a sua transmissora enfrenta elevados custos com desgaste mecânico e sobretensões na carga leve, apoie a criação deste laboratório. Mapeamos, de forma acadêmica, a viabilidade operacional de mitigar o OPEX invisível na sua concessão.</p><div className="grid grid-cols-1 gap-12 md:grid-cols-2"><div className="flex flex-col gap-6 text-gray-300"><p><strong className="text-white">Projeto Conceitual:</strong> Hackathon Hitachi Energy 2026</p><p><strong className="text-white">Repositório do Projeto / Equipe:</strong> [Inserir Link do LinkedIn/GitHub aqui]</p><p><strong className="text-white">Email:</strong> pesquisa@polivsr.usp.br</p><p><strong className="text-white">Ambiente de Pesquisa:</strong> Poli-USP, São Paulo - SP</p><p><strong className="text-white">Apoio e Fomento:</strong> Hitachi Energy HUB, Guarulhos - SP</p></div><form className="flex flex-col gap-4"><input className="rounded border border-gray-700 bg-gray-900 p-3 text-white" placeholder="Nome completo" /><input className="rounded border border-gray-700 bg-gray-900 p-3 text-white" placeholder="Empresa (Concessionária / Agente)" /><input className="rounded border border-gray-700 bg-gray-900 p-3 text-white" placeholder="E-mail corporativo" type="email" /><textarea className="h-32 rounded border border-gray-700 bg-gray-900 p-3 text-white" placeholder="Como as sobretensões afetam o OPEX da sua operação hoje?" /><button type="button" className="rounded bg-red-600 p-4 text-center font-bold hover:bg-red-700">Solicitar Estudo de Viabilidade</button></form></div></div></section> }

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
  if (selectedArticle) return <ArticleView article={selectedArticle} onBack={() => setSelectedArticle(null)} onNavigate={onNavigate} />
  const visibleStudies = studies.filter(study => study.audience === activeAudience && study.title.toLowerCase().includes(searchQuery.toLowerCase()))
  return <><section className="min-h-screen bg-white px-6 pb-24 pt-32 text-gray-900 sm:px-10"><div className="mx-auto max-w-6xl"><div className="py-10 text-center sm:py-16"><p className="text-xs font-bold uppercase tracking-[.3em] text-[#e60000]">Repositório público</p><h1 className="mt-4 text-5xl font-black tracking-tight sm:text-7xl">Pesquisas e dados.</h1><div className="relative mx-auto mt-10 w-full max-w-2xl"><label htmlFor="study-search" className="sr-only">Buscar pesquisa</label><input id="study-search" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Busque pelo nome da pesquisa..." className="w-full rounded border border-gray-200 bg-white py-4 pl-12 pr-5 text-base shadow-sm outline-none transition focus:border-[#e60000] focus:ring-2 focus:ring-red-100" /><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" /></div><div className="mt-8 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Filtrar pesquisas por público">{(['Engenharia', 'Economia', 'Público Geral'] as Audience[]).map(audience => <button key={audience} role="tab" aria-selected={activeAudience === audience} onClick={() => setActiveAudience(audience)} className={`rounded px-5 py-3 text-sm font-bold transition ${activeAudience === audience ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{audience}</button>)}</div><p className="mx-auto mt-8 max-w-3xl rounded bg-gray-50 p-6 text-center text-sm leading-7 text-gray-700 sm:text-base">{audienceDescriptions[activeAudience]}</p></div><div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{visibleStudies.map(study => <button key={study.title} onClick={() => setSelectedArticle(study)} className="flex min-h-64 cursor-pointer flex-col rounded border border-gray-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-red-600 hover:shadow-[0_0_20px_rgba(230,0,0,0.3)]">{study.level && <span className="w-fit rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">{study.level}</span>}<h2 className="mt-5 text-xl font-bold leading-snug">{study.title}</h2><p className="mt-3 flex-1 text-sm leading-6 text-gray-600">{study.summary}</p><span className="mt-5 self-end text-sm font-bold text-red-600">Ler estudo →</span></button>)}</div>{visibleStudies.length === 0 && <p className="py-20 text-center text-gray-500">Nenhuma pesquisa encontrada.</p>}</div></section></>
}

type Scenario = 'Centro Urbano' | 'Campo' | 'Polo eólico'
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const scenarioIds: Record<Scenario, string> = { 'Centro Urbano': 'urbano', Campo: 'campo', 'Polo eólico': 'polo_eolico' }
function sparklinePoints(values: number[]) {
  const interval = Math.max(1, Math.ceil(values.length / 24))
  return values.filter((_, index) => index % interval === 0).map(value => ({ value }))
}
const sparklineData: Record<Scenario, { value: number }[]> = {
  'Centro Urbano': sparklinePoints(model.cenarios.urbano.dia.r),
  Campo: sparklinePoints(model.cenarios.campo.dia.r),
  'Polo eólico': sparklinePoints(model.cenarios.polo_eolico.dia.r),
}

function ScenarioCard({ name, sample, icon: Icon, active, onSelect }: { name: Scenario; sample: string; icon: typeof Building2; active: boolean; onSelect: () => void }) {
  return <button type="button" aria-pressed={active} onClick={onSelect} className={`flex min-h-32 w-full flex-row items-center justify-between gap-4 rounded-xl border-2 p-4 text-left outline-none transition-colors focus:outline-none focus:ring-0 ${active ? 'border-red-600 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-400'}`} style={{ WebkitTapHighlightColor: 'transparent' }}><span className="flex min-w-0 flex-1 items-center gap-3"><span className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}><Icon aria-hidden="true" /></span><span className="min-w-0"><strong className="block text-base text-slate-950">{name}</strong><span className="mt-1 block text-xs text-slate-500">{sample}</span></span></span><span className="h-16 w-40 shrink-0" aria-hidden="true"><ResponsiveContainer width="100%" height="100%"><LineChart data={sparklineData[name]}><Line type="monotone" dataKey="value" stroke="#94a3b8" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></span></button>
}

function FinancialSlider({ label, value, min, max, step, format, onChange }: { label: string; value: number; min: number; max: number; step: number; format: (value: number) => string; onChange: (value: number) => void }) {
  return <label className="flex min-h-24 flex-col justify-center gap-3"><span className="flex items-center justify-between gap-4 text-sm font-semibold text-slate-700"><span>{label}</span><strong className="whitespace-nowrap text-slate-950">{format(value)}</strong></span><input type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.currentTarget.value))} className="h-8 w-full cursor-grab touch-none accent-red-600 active:cursor-grabbing" /></label>
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: { fixed: number; upper: number; lower: number; vsr: number } }>; label?: string }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  const margin = (point.upper - point.lower) / 2
  return <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-lg"><p className="font-bold text-slate-950">{label}</p><p className="mt-2 text-red-500">Reator Fixo (Mediana): {money.format(point.fixed)}</p><p className="mt-1 text-xs text-slate-500">Margem de Risco: ± {money.format(margin)}</p><p className="mt-1 text-emerald-500">VSR (Estável): {money.format(point.vsr)}</p></div>
}

function FanChart({ data }: { data: { year: string; upper: number; lower: number; fixed: number; vsr: number }[] }) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = chartRef.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        observer.disconnect()
      }
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return <div ref={chartRef} className="min-h-[280px] w-full overflow-hidden">{isVisible && <ChartContainer config={{ fixed: { label: 'Reator Fixo', color: '#e60000' }, vsr: { label: 'VSR', color: '#10b981' }, band: { label: 'Névoa do risco', color: '#fca5a5' } }} className="h-[280px] w-full"><AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}><CartesianGrid vertical={false} stroke="#e2e8f0" /><XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={8} /><YAxis tickLine={false} axisLine={false} tickFormatter={value => `${Math.round(value / 1000000)}M`} /><ChartTooltip content={<CustomTooltip />} /><Area dataKey="upper" type="monotone" stroke="none" fill="#fecaca" fillOpacity={0.55} isAnimationActive={false} /><Area dataKey="lower" type="monotone" stroke="none" fill="#ffffff" fillOpacity={1} isAnimationActive={false} /><Line dataKey="fixed" type="monotone" stroke="var(--color-fixed)" strokeWidth={4} dot={false} isAnimationActive={false} /><Area dataKey="vsr" type="monotone" stroke="#10b981" fill="#10b981" fillOpacity={0} strokeWidth={3} dot={false} isAnimationActive={false} /></AreaChart></ChartContainer>}</div>
}

function SimulatorPage({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const [scenario, setScenario] = useState<Scenario>('Centro Urbano')
  const [vsrPrice, setVsrPrice] = useState(model.cenarios.urbano.precos.base / 1_000_000)
  const scenarioData = model.cenarios[scenarioIds[scenario]]
  const variant = scenarioData.visoes.concessionaria.variantes.base
  const stats = {
    pay10: interpolate(scenarioData.grade, variant.stats.pay10, vsrPrice),
    pay50: interpolate(scenarioData.grade, variant.stats.pay50, vsrPrice),
    pay90: interpolate(scenarioData.grade, variant.stats.pay90, vsrPrice),
    ppos: interpolate(scenarioData.grade, variant.stats.ppos, vsrPrice),
    p10: interpolate(scenarioData.grade, variant.stats.p10, vsrPrice),
    p50: interpolate(scenarioData.grade, variant.stats.p50, vsrPrice),
    p90: interpolate(scenarioData.grade, variant.stats.p90, vsrPrice),
  }
  const risk = scenarioData.visoes.concessionaria.nevoa
  const fanChartData = risk.anos.map((year: number, index: number) => ({
    year: 'Ano ' + year,
    upper: risk.fixo.p90[index] * 1_000_000,
    lower: risk.fixo.p10[index] * 1_000_000,
    fixed: risk.fixo.p50[index] * 1_000_000,
    vsr: (interpolate(scenarioData.grade, risk.vsr.p50.map((row: number[]) => row[index]), vsrPrice) ?? 0) * 1_000_000,
  }))
  const formatPayback = (value: number) => value <= 0 ? 'imediato' : value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' anos'
  const scenarioCopy: Record<Scenario, { sample: string; icon: typeof Building2 }> = { 'Centro Urbano': { sample: 'Base: Salvador, Recife, Fortaleza', icon: Building2 }, Campo: { sample: 'Base: Interligação N-NE', icon: UtilityPole }, 'Polo eólico': { sample: 'Base: carga líquida do Nordeste', icon: Wind } }
  return <><section className="min-h-screen bg-slate-50 px-4 pb-16 pt-28 text-slate-950 sm:px-8"><div className="mx-auto max-w-6xl"><header className="max-w-3xl text-left"><p className="text-center text-xs font-bold uppercase tracking-[.25em] text-red-600">Simulação financeira</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">O Custo do Fixo: Simulador de OPEX Estocástico</h1><p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">Selecione o cenário operacional da sua rede e dimensione o custo real da rigidez.</p></header><div className="mt-10 grid gap-8 lg:grid-cols-[.8fr_1.2fr]"><div className="flex flex-col gap-8"><section aria-labelledby="scenario-title"><h2 id="scenario-title" className="text-lg font-bold">Cenário operacional</h2><div className="mt-4 flex flex-col gap-3">{(['Centro Urbano', 'Campo', 'Polo eólico'] as Scenario[]).map(name => <ScenarioCard key={name} name={name} sample={scenarioCopy[name].sample} icon={scenarioCopy[name].icon} active={scenario === name} onSelect={() => { setScenario(name); setVsrPrice(model.cenarios[scenarioIds[name]].precos.base / 1_000_000) }} />)}</div></section><section aria-labelledby="inputs-title" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 id="inputs-title" className="text-lg font-bold">Parâmetros da banca</h2><div className="mt-5 flex flex-col gap-4"><FinancialSlider label="Preço do VSR (R$)" value={vsrPrice} min={scenarioData.grade[0]} max={scenarioData.grade[scenarioData.grade.length - 1]} step={1} format={value => money.format(value * 1_000_000)} onChange={setVsrPrice} /></div></section></div><div className="flex min-w-0 flex-col gap-8"><section className="grid gap-4 sm:grid-cols-2" aria-label="Resultados estimados"><article className="rounded-xl bg-slate-950 p-6 text-white shadow-sm"><p className="text-xs font-bold uppercase tracking-[.18em] text-red-300">Retorno do investimento</p><p className="mt-4 text-3xl font-black">Payback Esperado: {formatPayback(stats.pay50)}</p><p className="mt-3 text-sm text-slate-300">(Cenário Otimista: {formatPayback(stats.pay10)} | Pessimista: {formatPayback(stats.pay90)})</p><span className="mt-6 inline-flex rounded-full bg-red-900 px-3 py-1 text-xs font-bold text-red-200">Chance de VPL positivo: {Math.round(stats.ppos * 100)}%</span></article><article className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-950 shadow-sm"><p className="text-xs font-bold uppercase tracking-[.18em] text-red-600">Ganho para a transmissora</p><p className="mt-4 text-3xl font-black">VPL (30 anos): {money.format(stats.p50 * 1_000_000)}</p><p className="mt-3 text-sm text-emerald-800">(P10: {money.format(stats.p10 * 1_000_000)} | P90: {money.format(stats.p90 * 1_000_000)})</p></article></section><section aria-labelledby="impact-title"><h2 id="impact-title" className="text-xl font-bold">Impacto Operacional e Vida Útil</h2><div className="mt-4 grid grid-cols-2 gap-3"><article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold text-slate-500">Manobras Evitadas</p><strong className="mt-2 block text-2xl font-black text-red-600">{Math.round(scenarioData.oper.ops_fixo_ano - scenarioData.oper.ops_vsr_ano).toLocaleString('pt-BR')}</strong><span className="text-xs text-slate-500">/ ano</span></article><article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold text-slate-500">Troca do Disjuntor (Fixo)</p><strong className="mt-2 block text-2xl font-black text-red-600">a cada {scenarioData.oper.anos_ate_troca_fixo.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} anos</strong></article><article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold text-slate-500">Ajuste de Tensão</p><strong className="mt-2 block text-lg font-black text-slate-950">Fino em degraus</strong></article><article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold text-slate-500">Custo de Quebra</p><strong className="mt-2 block text-lg font-black text-slate-950">Mitigado</strong></article></div></section><section className="min-w-0 overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><div className="flex min-w-[32rem] flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-bold">A Névoa do Risco</h2><p className="mt-1 text-sm text-slate-500">Custo acumulado projetado · 30 anos</p></div><div className="flex gap-4 text-xs font-semibold"><span className="text-red-600">● Reator Fixo</span><span className="text-emerald-500">● VSR</span></div></div><div className="mt-5"><FanChart data={fanChartData} /></div><div className="mt-8 overflow-x-auto"><h3 className="mb-3 text-base font-bold">Detalhamento do Custo Acumulado (R$)</h3><div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"><table className="w-full min-w-[520px] border-collapse text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><th className="px-3 py-3 font-semibold">Ano</th><th className="px-3 py-3 text-right font-semibold">Reator Fixo (Mediana Projetada)</th><th className="px-3 py-3 text-right font-semibold">VSR</th></tr></thead><tbody>{[1, 5, 10, 30].map(year => <tr key={year} className="border-b border-slate-100 last:border-0"><td className="px-3 py-3 font-semibold text-slate-700">Ano {year}</td><td className="px-3 py-3 text-right text-red-600">{money.format(fanChartData[year].fixed)}</td><td className="px-3 py-3 text-right font-semibold text-emerald-600">{money.format(fanChartData[year].vsr)}</td></tr>)}</tbody></table></div></div></section></div></div></div></section><section className="bg-slate-200 px-4 py-8 sm:px-8"><div className="mx-auto flex max-w-6xl flex-col gap-5"><p className="text-sm leading-6 text-slate-600">Nota Técnica: Simulação Estocástica de Confiabilidade. Os intervalos de confiança baseiam-se em modelos de desgaste mecânico de disjuntores sob chaveamento indutivo severo.</p><a href="/PoliVSR_Relatorio_Metodologia.pdf" download="PoliVSR_Relatorio_Metodologia.pdf" className="w-full mt-4 py-3 px-4 flex items-center justify-center gap-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-800">Baixar Metodologia Estatística (PDF)</a><a href="/PoliVSR_Relatorio_Metodologia.pdf" download="PoliVSR_Relatorio_Metodologia.pdf" className="flex min-h-14 w-full items-center justify-center gap-2 rounded-lg border-2 border-slate-500 bg-transparent px-4 text-sm font-bold text-slate-800 transition hover:bg-white"><FileText data-icon="inline-start" />Baixar Metodologia Estatística (PDF)</a></div></section><PageEndNavigation activeTab="simulator" onNavigate={onNavigate} /></>
}

function Placeholder({ onNavigate }: { onNavigate: (tab: TabId) => void }) { return <SimulatorPage onNavigate={onNavigate} /> }

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabId>('about')
  return <main className="min-h-screen bg-white text-slate-950"><header className="fixed inset-x-0 top-0 z-20 border-b border-slate-200 bg-white"><div className="mx-auto flex h-20 max-w-7xl items-center gap-8 px-6 sm:px-10 lg:px-16"><button onClick={() => setActiveTab('about')} aria-label="Ir para o início"><BrandMark /></button><nav className="hidden items-center gap-8 md:flex" aria-label="Navegação principal">{tabs.map(tab => { const Icon = tab.icon; return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 text-sm font-bold transition-colors ${tab.id === 'simulator' ? 'rounded-full bg-red-600 px-5 py-2.5 text-white shadow-[0_0_12px_3px_rgba(230,0,0,0.38)] hover:bg-red-700' : `rounded-full px-3 py-2 ${activeTab === tab.id ? 'bg-slate-200 text-slate-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}`}><Icon data-icon="inline-start" />{tab.label}</button> })}</nav><nav className="ml-auto flex items-center gap-1 md:hidden" aria-label="Navegação principal mobile">{tabs.map(tab => { const Icon = tab.icon; return <button key={tab.id} onClick={() => setActiveTab(tab.id)} aria-label={tab.label} aria-current={activeTab === tab.id ? 'page' : undefined} title={tab.label} className={`flex items-center justify-center transition-colors ${tab.id === 'simulator' ? 'min-w-24 rounded-full bg-red-600 px-4 py-2 text-white shadow-[0_0_11px_2px_rgba(230,0,0,0.35)]' : `size-11 rounded-full ${activeTab === tab.id ? 'bg-slate-200 text-slate-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}`}><Icon aria-hidden="true" /></button> })}</nav></div></header>{activeTab === 'about' ? <Hero onNavigate={setActiveTab} /> : activeTab === 'data' ? <><DataPage onNavigate={setActiveTab} /><PageEndNavigation activeTab="data" onNavigate={setActiveTab} /></> : <Placeholder onNavigate={setActiveTab} />}</main>
}
