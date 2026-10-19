'use client'

import { useMemo, useState } from 'react'
import { Building2, FileText, UtilityPole, Wind } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import calculatorData from '@/lib/dados/site_calculadora.json'

type ScenarioId = 'urbano' | 'campo' | 'polo_eolico'
type ViewId = 'concessionaria' | 'sin'
type Position = { index: number; fraction: number }
type NullableNumber = number | null
type FanPoint = {
  year: number
  fixed: number
  fixedP10: number
  fixedP90: number
  fixedRange: [number, number]
  vsr: number
  vsrP10: number
  vsrP90: number
  vsrRange: [number, number]
}

const model: any = calculatorData
const formatters = {
  zero: new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }),
  one: new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
  two: new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
}

const scenarioOptions: { id: ScenarioId; icon: typeof Building2 }[] = [
  { id: 'urbano', icon: Building2 },
  { id: 'campo', icon: UtilityPole },
  { id: 'polo_eolico', icon: Wind },
]

const viewHelp: Record<ViewId, string> = {
  concessionaria: 'Fluxo de caixa da transmissora a 12,11% a.a. real, antes de impostos, com Parcela Variável.',
  sin: 'Custo para o sistema a 8,5% a.a. real (taxa social), com energia não suprida e perdas, sem Parcela Variável.',
}

const variantHelp: Record<string, string> = {
  base: 'Leilão; fixo de 500 kV com fase reserva por banco (padrão EPE); OLTC a vácuo; VSR sem reserva própria.',
  reforco: 'Reforço autorizado: a RAP vem do Banco de Preços da ANEEL, então a receita do vão que deixa de existir também sai.',
  rap: 'Cenário otimista: o prêmio do VSR é remunerado na RAP.',
  pool: 'Uma unidade reserva para cada 10 VSR, como a BPA faz com reatores de 500 kV.',
  res13: 'Uma unidade reserva para cada 3 VSR, com reparo em 30 dias.',
  fase_comp: 'Uma fase reserva compartilhada pelos dois bancos fixos, em vez de uma por banco.',
  fase_nenhuma: 'Banco fixo sem fase reserva: sem esse custo, mas também sem a franquia de 3 h na falha.',
  oleo: 'Teste de estresse: OLTC a óleo, com manutenção a cada ~1 ano. O padrão de mercado para VSR é vácuo.',
}

const componentLabels: Record<string, string> = {
  'CAPEX vão': 'Vão de manobra evitado',
  'Fase reserva do fixo': 'Fases reserva evitadas',
  'Prêmio do VSR': 'Prêmio do VSR sobre os fixos',
  'Troca do disjuntor': 'Troca de disjuntor adiada',
  'O&M do vão': 'O&M do vão evitado',
  'Falhas do disjuntor': 'Falhas de disjuntor evitadas',
  'Revisão geral': 'Revisões gerais evitadas',
  'Manutenção preventiva': 'Preventivas evitadas',
  'Manutenção do OLTC': 'Manutenção do OLTC',
  'Falhas do reator/VSR': 'Falhas do reator e do VSR',
  'Parcela Variável': 'Parcela Variável (ANEEL)',
  'Energia não suprida': 'Energia não suprida',
  Perdas: 'Perdas do VSR',
  'Reserva do VSR': 'Reserva do VSR',
  'RAP (ajuste regulatório)': 'Ajuste da RAP',
}

const priceLabels = [
  ['base', 'Contratos 2025–26'],
  ['baixo', 'Faixa baixa'],
  ['alto', 'Faixa alta'],
  ['estresse_baixo', 'Nível de 2023'],
] as const

function numberText(value: number, digits = 0) {
  return (digits === 0 ? formatters.zero : digits === 1 ? formatters.one : formatters.two).format(value)
}

function mi(value: NullableNumber | undefined, digits?: number) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  const decimals = digits ?? (Math.abs(value) < 1 ? 2 : 1)
  const amount = numberText(Math.abs(value), decimals)
  return `${value < -1e-9 ? '− ' : ''}R$ ${amount} mi`
}

function signedMi(value: number) {
  return `${value > 1e-9 ? '+ ' : ''}${mi(value)}`
}

function percentage(value: number) {
  return `${numberText(Math.round(value * 100))}%`
}

function signedPercentage(value: number) {
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${numberText(Math.abs(Math.round(value * 100)))}%`
}

function months(value: NullableNumber) {
  if (value === null || value === undefined) return 'Não se paga em 30 anos'
  if (value <= 0) return 'Imediato'
  return `${numberText(value)} meses`
}

function stepFor(scenario: any) {
  return scenario.kv === 500 ? 0.5 : 0.1
}

function roundedPrice(scenario: any, price: number) {
  const step = stepFor(scenario)
  return Math.round((price / 1e6 / step)) * step
}

function indexPosition(grade: number[], price: number): Position {
  const step = grade[1] - grade[0]
  const fractionOfGrade = Math.max(0, Math.min(grade.length - 1, (price - grade[0]) / step))
  const index = Math.min(grade.length - 2, Math.floor(fractionOfGrade))
  return { index, fraction: fractionOfGrade - index }
}

function interpolateAt(series: NullableNumber[], position: Position): NullableNumber {
  const lower = series[position.index]
  const upper = series[position.index + 1]
  if (lower === null || upper === null) return position.fraction < 0.5 ? lower : upper
  return lower + (upper - lower) * position.fraction
}

function statsAt(stats: any, grade: number[], price: number) {
  const position = indexPosition(grade, price)
  const result: Record<string, NullableNumber> = {}
  ;['p10', 'p50', 'p90', 'media', 'ppos', 'imed', 'sem'].forEach(key => {
    result[key] = interpolateAt(stats[key], position)
  })
  ;['pay10', 'pay50', 'pay90'].forEach(key => {
    const lower = stats[key][position.index]
    const upper = stats[key][position.index + 1]
    result[key] = lower === null || upper === null
      ? (position.fraction < 0.5 ? lower : upper)
      : Math.round(lower + (upper - lower) * position.fraction)
  })
  return result
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg">
    <p className="font-bold text-slate-950">Ano {label}</p>
    <p className="mt-2 text-red-600">Reator fixo: {mi(point.fixed)} ({mi(point.fixedP10)} a {mi(point.fixedP90)})</p>
    <p className="mt-1 text-emerald-700">VSR: {mi(point.vsr)} ({mi(point.vsrP10)} a {mi(point.vsrP90)})</p>
  </div>
}

function PriceTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg">
    <p className="font-bold text-slate-950">VSR a {mi(point.price)}</p>
    <p className="mt-2 text-emerald-700">{signedMi(point.p50)} · VPL mediano</p>
    <p className="mt-1 text-slate-600">P10 {mi(point.p10)} · P90 {mi(point.p90)}</p>
    <p className="mt-1 text-slate-600">Chance de compensar: {percentage(point.ppos)}</p>
  </div>
}

function DayTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  const hour = Math.floor(label)
  const minute = Math.round((label - hour) * 60)
  return <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg">
    <p className="font-bold text-slate-950">{String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}</p>
    <p className="mt-2 text-slate-500">Necessidade: {percentage(point.need)}</p>
    <p className="mt-1 text-red-600">Reator fixo: {percentage(point.fixed)}</p>
    <p className="mt-1 text-emerald-700">VSR: {percentage(point.vsr)}</p>
  </div>
}

function FanEndLabel({ x, y, index, value, name, color, lastIndex }: any) {
  if (index !== lastIndex || typeof x !== 'number' || typeof y !== 'number') return null
  return <g>
    <text x={x + 8} y={y - 3} fill={color} fontSize={10} fontWeight={700}>{name}</text>
    <text x={x + 8} y={y + 10} fill={color} fontSize={10}>{mi(value)}</text>
  </g>
}

function ScenarioCard({ scenario, active, onSelect }: { scenario: any; active: boolean; onSelect: () => void }) {
  const Icon = scenario.icon
  const sparkline = useMemo(() => {
    const interval = Math.max(1, Math.ceil(scenario.data.dia.r.length / 24))
    return scenario.data.dia.r.filter((_: number, index: number) => index % interval === 0).map((value: number) => ({ value }))
  }, [scenario.data.dia.r])

  return <button
    type="button"
    aria-pressed={active}
    onClick={onSelect}
    className={`flex min-h-[88px] w-full items-center justify-between gap-3 rounded-xl border-2 p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 ${active ? 'border-red-600 bg-red-50' : 'border-gray-200 bg-white hover:border-slate-400'}`}
  >
    <span className="flex min-w-0 flex-1 items-center gap-3">
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}><Icon aria-hidden="true" size={20} /></span>
      <span className="min-w-0">
        <strong className="block text-sm font-bold text-slate-950 sm:text-base">{scenario.data.nome}</strong>
        <span className="mt-1 block text-xs leading-4 text-slate-500">{scenario.data.base}</span>
      </span>
    </span>
    <span className="h-12 w-[88px] shrink-0 sm:w-32" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={sparkline}>
          <Line dataKey="value" type="monotone" stroke="#94a3b8" strokeWidth={2} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </span>
  </button>
}

function PriceButton({ label, price, selected, onSelect }: { label: string; price: number; selected: boolean; onSelect: () => void }) {
  return <button
    type="button"
    aria-pressed={selected}
    onClick={onSelect}
    className={`min-h-10 rounded-full border px-3 py-2 text-left text-xs font-semibold transition-colors ${selected ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-slate-700 hover:border-slate-400'}`}
  >
    {label} · {mi(price)}
  </button>
}

export default function CustoDoFixo() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('urbano')
  const [viewId, setViewId] = useState<ViewId>('concessionaria')
  const [variantId, setVariantId] = useState('base')
  const [price, setPrice] = useState(() => roundedPrice(model.cenarios.urbano, model.cenarios.urbano.precos.base))

  const scenario = model.cenarios[scenarioId]
  const view = scenario.visoes[viewId]
  const variant = view.variantes[variantId] || view.variantes.base
  const stats = statsAt(variant.stats, scenario.grade, price)
  const fixedMi = scenario.preco_fixos / 1e6
  const premium = price / fixedMi - 1
  const priceStep = stepFor(scenario)
  const selectedViewHelp = viewHelp[viewId]
  const selectedVariantHelp = variantHelp[variantId] || ''
  const scenarioChoices = scenarioOptions.map(option => ({ ...option, data: model.cenarios[option.id] }))

  const chipPrices = priceLabels.map(([key, label]) => ({
    key,
    label,
    price: roundedPrice(scenario, scenario.precos[key]),
  }))

  const fanData: FanPoint[] = view.nevoa.anos.map((year: number, index: number) => {
    const fixedP10 = view.nevoa.fixo.p10[index]
    const fixedP50 = view.nevoa.fixo.p50[index]
    const fixedP90 = view.nevoa.fixo.p90[index]
    const vsrP10 = interpolateAt(view.nevoa.vsr.p10.map((row: number[]) => row[index]), indexPosition(scenario.grade, price)) ?? 0
    const vsrP50 = interpolateAt(view.nevoa.vsr.p50.map((row: number[]) => row[index]), indexPosition(scenario.grade, price)) ?? 0
    const vsrP90 = interpolateAt(view.nevoa.vsr.p90.map((row: number[]) => row[index]), indexPosition(scenario.grade, price)) ?? 0
    return {
      year,
      fixed: fixedP50,
      fixedP10,
      fixedP90,
      fixedRange: [fixedP10, fixedP90],
      vsr: vsrP50,
      vsrP10,
      vsrP90,
      vsrRange: [vsrP10, vsrP90],
    }
  })

  const fanValues = fanData.flatMap(point => [point.fixedP10, point.fixedP90, point.vsrP10, point.vsrP90])
  const fanPadding = (Math.max(...fanValues) - Math.min(...fanValues)) * 0.06 || 1
  const fanDomain: [number, number] = [
    Math.floor(Math.min(...fanValues) - fanPadding),
    Math.ceil(Math.max(...fanValues) + fanPadding),
  ]

  const priceData = scenario.grade.map((value: number, index: number) => ({
    price: value,
    p10: variant.stats.p10[index],
    p50: variant.stats.p50[index],
    p90: variant.stats.p90[index],
    ppos: variant.stats.ppos[index],
    range: [variant.stats.p10[index], variant.stats.p90[index]],
  }))
  const priceValues = priceData.flatMap((point: any) => [point.p10, point.p90, 0])
  const pricePadding = (Math.max(...priceValues) - Math.min(...priceValues)) * 0.12 || 1
  const priceDomain: [number, number] = [
    Math.floor(Math.min(...priceValues) - pricePadding),
    Math.ceil(Math.max(...priceValues) + pricePadding),
  ]
  const equilibrium = variant.equilibrio_mi[1]
  const dayData = scenario.dia.hora.map((hour: number, index: number) => ({
    hour,
    need: scenario.dia.r[index],
    fixed: scenario.dia.fixo[index],
    vsr: scenario.dia.vsr[index],
  }))
  const dateParts = scenario.dia.data.split('-')
  const dateBR = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`
  const paybackNote = stats.pay50 === 0
    ? 'o VSR já sai mais barato na compra'
    : stats.pay50 === null
      ? 'em mais da metade das simulações'
      : 'mediana das simulações'
  const methodScale = `Escala: preço ∝ Mvar^0,6 × kV^β, β de 0,3 a 1,0 (central 0,5); câmbio de € 1 = R$ ${numberText(model.meta.eur_brl, 2)} (BCB, set/2026). Base = média dos contratos de 2025–26.`

  function selectScenario(nextId: ScenarioId) {
    const nextScenario = model.cenarios[nextId]
    setScenarioId(nextId)
    setPrice(roundedPrice(nextScenario, nextScenario.precos.base))
    if (!nextScenario.visoes[viewId].variantes[variantId]) setVariantId('base')
  }

  function selectView(nextView: ViewId) {
    setViewId(nextView)
    if (!scenario.visoes[nextView].variantes[variantId]) setVariantId('base')
  }

  function selectedPrice(priceKey: string) {
    const nextPrice = chipPrices.find(option => option.key === priceKey)?.price
    if (nextPrice !== undefined) setPrice(nextPrice)
  }

  return <section className="min-h-screen overflow-x-clip bg-slate-50 px-4 pb-16 pt-28 text-slate-950 sm:px-8">
    <div className="mx-auto max-w-7xl">
      <header className="mb-8 max-w-3xl">
        <p className="text-center text-xs font-bold uppercase tracking-[.25em] text-red-600">Simulação financeira</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">O Custo do Fixo: Simulador Estocástico do VSR</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
          Modelo PoliVSR · {numberText(model.meta.simulacoes)} simulações de Monte Carlo por cenário · fluxos mensais em 30 anos · {model.meta.moeda}
        </p>
      </header>

      <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(280px,.82fr)_minmax(0,1.18fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="scenario-title">
            <h2 id="scenario-title" className="text-lg font-bold">Cenário operacional</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Selecione o cenário da sua rede. A curva é a necessidade de reativo manobrável num dia típico do cenário.</p>
            <div className="mt-4 flex flex-col gap-3">
              {scenarioChoices.map(option => <ScenarioCard
                key={option.id}
                scenario={option}
                active={scenarioId === option.id}
                onSelect={() => selectScenario(option.id)}
              />)}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="inputs-title">
            <h2 id="inputs-title" className="text-lg font-bold">Parâmetros da banca</h2>
            <div className="mt-5 flex flex-col gap-5">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Quem avalia</p>
                <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1" role="group" aria-label="Quem avalia">
                  <button type="button" aria-pressed={viewId === 'concessionaria'} onClick={() => selectView('concessionaria')} className={`min-h-10 rounded-md px-2 text-sm font-semibold transition-colors ${viewId === 'concessionaria' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}>Transmissora</button>
                  <button type="button" aria-pressed={viewId === 'sin'} onClick={() => selectView('sin')} className={`min-h-10 rounded-md px-2 text-sm font-semibold transition-colors ${viewId === 'sin' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}>Sistema (SIN)</button>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">{selectedViewHelp}</p>
              </div>

              <div>
                <label htmlFor="vsr-price" className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                  <span>Preço do VSR, só equipamento</span><strong className="whitespace-nowrap text-slate-950">{mi(price)}</strong>
                </label>
                <input
                  id="vsr-price"
                  type="range"
                  min={scenario.grade[0]}
                  max={scenario.grade[scenario.grade.length - 1]}
                  step={priceStep}
                  value={price}
                  onChange={event => setPrice(Number(event.currentTarget.value))}
                  className="mt-3 h-8 w-full cursor-grab touch-none accent-red-600 active:cursor-grabbing"
                />
                <p className="text-xs leading-5 text-slate-500">
                  Prêmio de {signedPercentage(premium)} sobre os dois reatores fixos que ele substitui ({mi(fixedMi)} no preço de referência da EPE).
                </p>
                <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Preços de referência">
                  {chipPrices.map(option => <PriceButton
                    key={option.key}
                    label={option.label}
                    price={option.price}
                    selected={Math.abs(option.price - price) < 0.05}
                    onSelect={() => selectedPrice(option.key)}
                  />)}
                </div>
              </div>

              <div>
                <label htmlFor="premissas" className="mb-2 block text-sm font-semibold text-slate-700">Premissas</label>
                <select
                  id="premissas"
                  value={variantId}
                  onChange={event => setVariantId(event.currentTarget.value)}
                  className="min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-slate-900 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100"
                >
                  {Object.entries(view.variantes).map(([key, item]: [string, any]) => <option key={key} value={key}>{item.nome}</option>)}
                </select>
                <p className="mt-2 text-xs leading-5 text-slate-500">{selectedVariantHelp}</p>
              </div>

              <p className="border-t border-gray-100 pt-4 text-xs leading-5 text-slate-500">
                Unidade comparada: 1 VSR de {numberText(scenario.W)}–{numberText(scenario.mvar_vsr)} Mvar no lugar de 2 bancos fixos de {numberText(scenario.W)} Mvar, cada um com seu vão (arranjo 2:1, {scenario.kv} kV).
              </p>
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <section className="grid min-w-0 gap-4 sm:grid-cols-2" aria-label="Resultados estimados">
            <article className="min-w-0 rounded-xl bg-slate-950 p-5 text-white shadow-sm sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-red-300">Valor do VSR em 30 anos</p>
              <p className="mt-4 text-2xl font-black leading-tight sm:text-3xl">VPL: {signedMi(stats.p50 ?? 0)}</p>
              <p className="mt-3 text-xs leading-5 text-slate-300 sm:text-sm">(Pessimista P10: {mi(stats.p10)} | Otimista P90: {mi(stats.p90)})</p>
              <span className={`mt-5 inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-bold ${stats.ppos !== null && stats.ppos >= 0.5 ? 'bg-emerald-950 text-emerald-200' : 'bg-red-950 text-red-200'}`}>
                Chance de compensar: {percentage(stats.ppos ?? 0)}
              </span>
            </article>
            <article className="min-w-0 rounded-xl border border-red-100 bg-red-50 p-5 shadow-sm sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-red-700">Preço de equilíbrio</p>
              <p className="mt-4 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
                {equilibrium > scenario.grade[scenario.grade.length - 1] * 3 ? 'Compensa em qualquer preço da faixa' : <>Compensa até {mi(equilibrium)}</>}
              </p>
              {equilibrium > scenario.grade[scenario.grade.length - 1] * 3
                ? <p className="mt-3 text-sm leading-5 text-emerald-800">Com o prêmio na RAP, o preço quase não muda o resultado.</p>
                : <p className={`mt-3 text-sm leading-5 ${equilibrium - price >= 0 ? 'text-emerald-800' : 'text-red-700'}`}>
                    {equilibrium - price >= 0 ? `Folga de ${mi(equilibrium - price)} sobre o preço simulado.` : `O preço simulado passa o equilíbrio em ${mi(price - equilibrium)}.`}
                  </p>}
              <p className="mt-3 text-xs leading-5 text-slate-600">Contratos públicos de 2025–26: {mi(scenario.precos.baixo / 1e6)} a {mi(scenario.precos.alto / 1e6)} (escalados para este VSR).</p>
            </article>
          </section>

          <section aria-labelledby="impact-title">
            <h2 id="impact-title" className="mb-3 text-xl font-bold">Impacto Operacional e Vida Útil</h2>
            <div className="grid grid-cols-2 gap-3">
              <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Payback</p>
                <strong className="mt-2 block text-xl font-black text-slate-950">{months(stats.pay50)}</strong>
                <span className="mt-1 block text-xs leading-5 text-slate-500">{paybackNote}</span>
              </article>
              <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Manobras evitadas</p>
                <strong className="mt-2 block text-xl font-black text-slate-950">{numberText(scenario.oper.manobras_evitadas_ano)}</strong>
                <span className="mt-1 block text-xs leading-5 text-slate-500">/ ano, por disjuntor do fixo</span>
              </article>
              <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Troca do disjuntor</p>
                <strong className="mt-2 block text-xl font-black text-slate-950">Adiada</strong>
                <span className="mt-1 block text-xs leading-5 text-slate-500">fixo troca a cada ~{numberText(scenario.oper.anos_ate_troca_fixo)} anos; o do VSR não troca em 30</span>
              </article>
              <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Vão de manobra evitado</p>
                <strong className="mt-2 block text-xl font-black text-slate-950">{mi(scenario.preco_vao / 1e6)}</strong>
                <span className="mt-1 block text-xs leading-5 text-slate-500">1 vão a menos (disjuntor, seccionadoras, obra)</span>
              </article>
            </div>
          </section>

          <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="fan-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="fan-title" className="text-xl font-bold">A Névoa do Risco</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">Custo acumulado descontado · 30 anos · faixa P10–P90 e mediana</p>
              </div>
              <div className="flex gap-3 text-[11px] font-semibold text-slate-600">
                <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-red-600" />Reator fixo</span>
                <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-emerald-600" />VSR</span>
              </div>
            </div>
            {variantId !== 'base' && <p className="mt-3 rounded-md bg-slate-50 p-3 text-xs leading-5 text-slate-600">A névoa mostra as premissas-base deste cenário. Os cartões acima seguem a premissa escolhida.</p>}
            <div className="mt-3 min-w-0">
              <ChartContainer config={{ fixed: { label: 'Reator fixo', color: '#e60000' }, vsr: { label: 'VSR', color: '#059669' } }} className="h-[280px] w-full">
                <AreaChart data={fanData} margin={{ top: 12, right: 104, bottom: 4, left: -12 }}>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="year" type="number" domain={[0, 30]} ticks={[0, 5, 10, 15, 20, 25, 30]} tickFormatter={value => value === 0 ? 'Ano 0' : String(value)} tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis domain={fanDomain} tickFormatter={value => numberText(value)} tickLine={false} axisLine={false} width={38} />
                  <ChartTooltip content={<CustomTooltip />} />
                  <Area dataKey="fixedRange" type="monotone" stroke="none" fill="#fecaca" fillOpacity={0.55} isAnimationActive={false} />
                  <Area dataKey="vsrRange" type="monotone" stroke="none" fill="#a7f3d0" fillOpacity={0.6} isAnimationActive={false} />
                  <Line dataKey="fixed" type="monotone" stroke="#e60000" strokeWidth={2.5} dot={false} isAnimationActive={false}>
                    <LabelList dataKey="fixed" content={(props: any) => <FanEndLabel {...props} name="Reator fixo" color="#e60000" lastIndex={fanData.length - 1} />} />
                  </Line>
                  <Line dataKey="vsr" type="monotone" stroke="#059669" strokeWidth={2.5} dot={false} isAnimationActive={false}>
                    <LabelList dataKey="vsr" content={(props: any) => <FanEndLabel {...props} name="VSR" color="#059669" lastIndex={fanData.length - 1} />} />
                  </Line>
                </AreaChart>
              </ChartContainer>
            </div>
            <div className="mt-4 overflow-x-auto">
              <h3 className="mb-2 text-sm font-bold">Detalhamento do custo acumulado (R$ mi, mediana)</h3>
              <table className="w-full min-w-[560px] border-collapse text-left text-xs sm:text-sm">
                <thead><tr className="border-b border-gray-200 text-slate-500"><th className="py-2 pr-3 font-semibold">Ano</th><th className="py-2 px-2 text-right font-semibold">Reator fixo</th><th className="py-2 px-2 text-right font-semibold">VSR</th><th className="py-2 pl-2 text-right font-semibold">Diferença a favor do VSR</th></tr></thead>
                <tbody>{[1, 5, 10, 20, 30].map(year => {
                  const point = fanData[year]
                  return <tr key={year} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-3 font-semibold text-slate-700">Ano {year}</td>
                    <td className="px-2 py-2 text-right text-red-700">{mi(point.fixed)}</td>
                    <td className="px-2 py-2 text-right text-emerald-700">{mi(point.vsr)}</td>
                    <td className="py-2 pl-2 text-right font-semibold text-slate-800">{signedMi(point.fixed - point.vsr)}</td>
                  </tr>
                })}</tbody>
              </table>
            </div>
          </section>

          <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="pp-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="pp-title" className="text-xl font-bold">Até quanto o VSR compensa</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">VPL do VSR em função do preço · faixa P10–P90 e mediana</p>
              </div>
              <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-slate-600">
                <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-emerald-600" />VPL mediano</span>
                <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-emerald-100" />P10–P90</span>
              </div>
            </div>
            <div className="mt-3 min-w-0">
              <ChartContainer config={{ median: { label: 'VPL mediano', color: '#059669' }, range: { label: 'P10–P90', color: '#a7f3d0' } }} className="h-[280px] w-full">
                <ComposedChart data={priceData} margin={{ top: 30, right: 12, bottom: 8, left: -8 }}>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" />
                  <ReferenceArea x1={scenario.precos.baixo / 1e6} x2={scenario.precos.alto / 1e6} y1={priceDomain[0]} y2={priceDomain[1]} fill="#059669" fillOpacity={0.08} stroke="none" />
                  <ReferenceArea x1={scenario.precos.estresse_baixo / 1e6} x2={scenario.precos.estresse_alto / 1e6} y1={priceDomain[0]} y2={priceDomain[1]} fill="#e60000" fillOpacity={0.07} stroke="none" />
                  <XAxis dataKey="price" type="number" domain={[scenario.grade[0], scenario.grade[scenario.grade.length - 1]]} tickFormatter={value => numberText(value)} tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis domain={priceDomain} tickFormatter={value => numberText(value)} tickLine={false} axisLine={false} width={38} />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
                  <ChartTooltip content={<PriceTooltip />} />
                  <Area dataKey="range" type="monotone" stroke="none" fill="#a7f3d0" fillOpacity={0.6} isAnimationActive={false} />
                  <Line dataKey="p50" type="monotone" stroke="#059669" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                  <ReferenceLine x={price} stroke="#020618" strokeWidth={1} />
                  <ReferenceDot x={price} y={stats.p50 ?? 0} r={5} fill="#059669" stroke="#fff" strokeWidth={2} />
                  {equilibrium >= scenario.grade[0] && equilibrium <= scenario.grade[scenario.grade.length - 1] && <ReferenceDot
                    x={equilibrium}
                    y={0}
                    r={4}
                    fill="#020618"
                    stroke="#fff"
                    strokeWidth={2}
                    label={(props: any) => {
                      const x = Number(props.viewBox?.x)
                      const y = Number(props.viewBox?.y)
                      if (!Number.isFinite(x) || !Number.isFinite(y)) return null
                      return <text x={x + 8} y={y + 16} fill="#020618" fontSize={11} fontWeight={700}>Equilíbrio {mi(equilibrium)}</text>
                    }}
                  />}
                </ComposedChart>
              </ChartContainer>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left text-xs sm:text-sm">
                <thead><tr className="border-b border-gray-200 text-slate-500"><th className="py-2 pr-3 font-semibold">Preço do VSR</th><th className="px-2 py-2 text-right font-semibold">Prêmio sobre os 2 fixos</th><th className="px-2 py-2 text-right font-semibold">VPL mediano</th><th className="py-2 pl-2 text-right font-semibold">Chance de compensar</th></tr></thead>
                <tbody>{[
                  ['baixo', 'Faixa baixa 2025–26'],
                  ['base', 'Contratos 2025–26'],
                  ['alto', 'Faixa alta 2025–26'],
                  ['estresse_baixo', 'Nível de 2023'],
                ].map(([key, label]) => {
                  const referencePrice = scenario.precos[key] / 1e6
                  const referenceStats = statsAt(variant.stats, scenario.grade, referencePrice)
                  return <tr key={key} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-3 font-semibold text-slate-700">{label} · {mi(referencePrice)}</td>
                    <td className="px-2 py-2 text-right text-slate-700">{signedPercentage(referencePrice / fixedMi - 1)}</td>
                    <td className="px-2 py-2 text-right font-semibold text-emerald-700">{signedMi(referenceStats.p50 ?? 0)}</td>
                    <td className="py-2 pl-2 text-right text-slate-700">{percentage(referenceStats.ppos ?? 0)}</td>
                  </tr>
                })}</tbody>
              </table>
            </div>
          </section>

          <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="day-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="day-title" className="text-xl font-bold">Um dia de operação</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">Dia típico ({dateBR}): o fixo manobrou {scenario.dia.manobras_fixo} vezes; o VSR, {scenario.dia.manobras_vsr}, acompanhando a rede com {scenario.dia.taps_vsr} trocas de tap.</p>
              </div>
              <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-slate-600">
                <span className="flex items-center gap-1.5"><i className="size-2 border-t-2 border-dashed border-slate-400" />Necessidade</span>
                <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-red-600" />Reator fixo</span>
                <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-emerald-600" />VSR</span>
              </div>
            </div>
            <div className="mt-3 min-w-0">
              <ChartContainer config={{ need: { label: 'Necessidade', color: '#94a3b8' }, fixed: { label: 'Reator fixo', color: '#e60000' }, vsr: { label: 'VSR', color: '#059669' } }} className="h-[250px] w-full">
                <ComposedChart data={dayData} margin={{ top: 12, right: 10, bottom: 4, left: -6 }}>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="hour" type="number" domain={[0, 24]} ticks={[0, 6, 12, 18, 24]} tickFormatter={value => `${String(value).padStart(2, '0')}h`} tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis domain={[0, 1]} ticks={[0, 0.5, 1]} tickFormatter={value => percentage(value)} tickLine={false} axisLine={false} width={42} />
                  <ChartTooltip content={<DayTooltip />} />
                  <Line dataKey="need" type="monotone" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
                  <Line dataKey="fixed" type="stepAfter" stroke="#e60000" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                  <Line dataKey="vsr" type="stepAfter" stroke="#059669" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                </ComposedChart>
              </ChartContainer>
            </div>
          </section>

          <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="casc-title">
            <h2 id="casc-title" className="text-xl font-bold">De onde vem o valor</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Valor presente médio de cada parcela · verde a favor do VSR, vermelho contra</p>
            <div className="mt-5 space-y-3">
              {(() => {
                const rows = variant.cascata
                  .map((row: any) => ({ label: componentLabels[row.c] || row.c, value: row.a + row.b * premium }))
                  .filter((row: any) => Math.abs(row.value) >= 0.005)
                  .sort((left: any, right: any) => right.value - left.value)
                const total = rows.reduce((sum: number, row: any) => sum + row.value, 0)
                const maxAbs = Math.max(...rows.map((row: any) => Math.abs(row.value)), Math.abs(total)) || 1
                return rows.concat({ label: 'VPL médio', value: total, total: true } as any).map((row: any) => {
                  const width = Math.abs(row.value) / maxAbs * 50
                  return <div key={row.label} className={`grid grid-cols-[minmax(0,1fr)_minmax(74px,.85fr)_auto] items-center gap-2 text-xs sm:grid-cols-[minmax(0,1fr)_minmax(100px,.9fr)_auto] sm:gap-3 ${row.total ? 'border-t border-gray-200 pt-3 font-bold' : ''}`}>
                    <span className={`min-w-0 leading-4 ${row.total ? 'text-slate-950' : 'text-slate-700'}`}>{row.label}</span>
                    <span className="relative h-4 overflow-hidden rounded bg-slate-50">
                      <span className="absolute inset-y-0 left-1/2 w-px bg-slate-300" />
                      <span className={`absolute inset-y-0 ${row.value >= 0 ? 'bg-emerald-600' : 'bg-red-600'}`} style={{ width: `${width}%`, left: `${row.value >= 0 ? 50 : 50 - width}%` }} />
                    </span>
                    <span className={`whitespace-nowrap text-right tabular-nums ${row.value >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{signedMi(row.value)}</span>
                  </div>
                })
              })()}
            </div>
          </section>

          <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="method-title">
            <h2 id="method-title" className="text-xl font-bold">Metodologia e fontes</h2>
            <div className="mt-4 space-y-5 text-xs leading-5 text-slate-700">
              <div>
                <h3 className="font-bold text-slate-950">Como o modelo funciona</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Unidade comparada: um VSR com faixa de 50–100% no lugar de dois bancos de reatores fixos (o manobrável e uma fatia igual da compensação permanente), cada banco com seu vão de manobra.</li>
                  <li>Camada física: a necessidade de reativo sai da sobra de reativo das linhas, Qc·(1 − (P/SIL)²), com as séries do ONS (DESSEM e intercâmbio N–NE de 2025–26). O fixo liga e desliga em degraus; o VSR troca de tap.</li>
                  <li>Camada financeira: 4.000 trajetórias mensais de 30 anos por cenário, com preventiva a cada 72 meses, revisão geral por contagem de ciclos, troca do disjuntor no fim da vida mecânica, falhas maiores e menores (CIGRÉ TB 510), falhas do reator e do OLTC (CIGRÉ TB 939 e 642) e Parcela Variável (ANEEL, Módulo 4 rev.2).</li>
                  <li>Taxas: transmissora a 12,11% a.a. real antes de impostos (WACC ANEEL 2026); sistema a 8,5% a.a. real (taxa social de desconto).</li>
                  <li>Preço do reator fixo e do vão: EPE-DEE-NT-077/2021 corrigida pelo IPCA até set/2026. A 500 kV o banco fixo de referência tem fase reserva (3+1R).</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-slate-950">O que pesa contra o VSR (está no simulador)</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Preço do VSR no nível do contrato de 2023 da Energinet: o VSR não compensa.</li>
                  <li>Reforço autorizado com RAP pelo Banco de Preços da ANEEL: negativo para a transmissora, positivo para o sistema.</li>
                  <li>OLTC a óleo, fixo sem fase reserva ou reserva do VSR de 1 para 3: o resultado cai perto de zero ou abaixo.</li>
                  <li>O preço do VSR é uma estimativa a partir de contratos europeus; a cotação da Hitachi Energy para o caso brasileiro substitui esta faixa.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-slate-950">O que o modelo não monetiza</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Fim dos degraus de tensão a cada manobra, regulação contínua que ajuda a integrar solar e eólica, uso do VSR como reserva flexível em várias posições da rede e menor área ocupada.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-slate-950">Contratos públicos de VSR usados no preço</h3>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[680px] border-collapse text-left text-[11px]">
                    <thead><tr className="border-b border-gray-200 text-slate-500"><th className="py-2 pr-3 font-semibold">Comprador</th><th className="px-2 py-2 font-semibold">Ano</th><th className="px-2 py-2 font-semibold">VSR</th><th className="px-2 py-2 text-right font-semibold">Preço por unidade</th><th className="py-2 pl-3 font-semibold">Uso</th></tr></thead>
                    <tbody>{model.contratos.map((contract: any) => <tr key={contract.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-2 pr-3"><a href={contract.fonte} target="_blank" rel="noopener noreferrer" className="text-red-700 underline underline-offset-2 hover:text-red-900">{contract.comprador}</a></td>
                      <td className="px-2 py-2 tabular-nums">{contract.ano}</td>
                      <td className="px-2 py-2">{contract.tensao_kV} kV, {contract.mvar_max} Mvar</td>
                      <td className="px-2 py-2 text-right tabular-nums">{contract.preco_unit_EUR_mi ? `€ ${numberText(contract.preco_unit_EUR_mi, 2)} mi` : contract.preco_original}</td>
                      <td className="py-2 pl-3">{contract.uso}</td>
                    </tr>)}</tbody>
                  </table>
                </div>
                <p className="mt-2 text-[11px] leading-4 text-slate-500">{methodScale}</p>
              </div>
            </div>
            <a
              href="/PoliVSR_Relatorio_Metodologia.pdf"
              download="PoliVSR_Relatorio_Metodologia.pdf"
              className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-lg border-2 border-slate-500 bg-white px-4 text-center text-sm font-bold text-slate-800 transition-colors hover:border-red-600 hover:text-red-700"
            >
              <FileText aria-hidden="true" size={20} />Baixar metodologia estatística (PDF)
            </a>
          </section>
        </div>
      </div>
    </div>
  </section>
}
