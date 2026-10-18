'use client'

import { useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowRight,
  ChevronDown,
  CircleDollarSign,
  ExternalLink,
  FileText,
  Menu,
  UsersRound,
  X,
} from 'lucide-react'
import siteCalculator from '@/lib/dados/site_calculadora.json'
import riskFan from '@/lib/dados/nevoa.json'
import { IDADE, MMGD, REAT, REG, SET25, SET26, TOTAL_DIA, VERAO } from '@/lib/dados/inicio'

const model: any = siteCalculator
const riskRows: any[] = riskFan
const numberFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const integerFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const percentFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const brl = (value: number, digits = 1) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)
const signedMi = (value: number) => `${value < 0 ? '−' : '+'} R$ ${brl(Math.abs(value))} mi`
const signedCurrency = (value: number) => `${value < 0 ? '−' : '+'}R$ ${brl(Math.abs(value))} mi`
const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value))

const REFERENCE_URLS = {
  cigre:
    'https://www.e-cigre.org/publications/detail/a3-10747-2026-shunt-reactor-switching-in-brazilian-grid-a-critical-analysis-of-circuit-breaker-standard-requirements-and-the-actual-stresses-in-the-network.html',
  parpel: 'https://www.ons.org.br/AcervoDigitalDocumentosEPublicacoes/Revista%20PARPEL%202025-VF.pdf',
  aneel: 'https://www.gov.br/aneel/pt-br',
}

const curvePoints = [...VERAO, VERAO[0]]
const variations = curvePoints.slice(1).map((value, index) => Math.abs(value - curvePoints[index]))
const totalVariation = variations.reduce((total, value) => total + value, 0)
const cumulativeOperations = [0]
variations.forEach((value) => cumulativeOperations.push(cumulativeOperations[cumulativeOperations.length - 1] + (value / totalVariation) * TOTAL_DIA))

type Tab = 'about' | 'data' | 'simulator'
type View = 'concessionaria' | 'sin'

function timeLabel(hour: number) {
  const whole = Math.floor(hour)
  return `${whole}h${hour - whole >= 0.5 ? '30' : ''}`
}

function curveX(hour: number) {
  return 4 + (92 * hour) / 24
}

function curveY(load: number) {
  return 6 + ((85 - load) * 34) / 45
}

function interpolate(grade: number[], series: (number | null)[], price: number) {
  if (!grade.length || !series.length) return null
  if (price <= grade[0]) return series[0]
  if (price >= grade[grade.length - 1]) return series[series.length - 1]
  const lower = grade.findIndex((value, index) => index < grade.length - 1 && value <= price && grade[index + 1] >= price)
  if (lower < 0) return null
  const first = series[lower]
  const second = series[lower + 1]
  if (first === null || second === null || first === undefined || second === undefined) return null
  const fraction = (price - grade[lower]) / (grade[lower + 1] - grade[lower])
  return first + (second - first) * fraction
}

function scenarioResult(id: string, view: View = 'concessionaria') {
  const scenario = model.cenarios[id]
  const variant = scenario.visoes[view].variantes.base
  const price = scenario.precos.base / 1_000_000
  return {
    vpl: interpolate(scenario.grade, variant.stats.p50, price) ?? 0,
    chance: interpolate(scenario.grade, variant.stats.ppos, price) ?? 0,
  }
}

function BrandMark() {
  return (
    <svg aria-hidden="true" className="h-7 w-7 shrink-0" viewBox="0 0 28 28" fill="none">
      <ellipse cx="7" cy="14" rx="3.2" ry="10" stroke="currentColor" strokeWidth="2.6" />
      <ellipse cx="14" cy="14" rx="3.2" ry="10" stroke="currentColor" strokeWidth="2.6" />
      <ellipse cx="21" cy="14" rx="3.2" ry="10" stroke="currentColor" strokeWidth="2.6" />
    </svg>
  )
}

function ExternalSource({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="inline-flex items-center gap-1 font-medium text-red-700 underline decoration-red-300 underline-offset-4 hover:text-red-900" href={href} target="_blank" rel="noreferrer">
      {children}
      <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
    </a>
  )
}

function SectionHeading({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="max-w-3xl">
      {eyebrow && <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-red-700">{eyebrow}</p>}
      <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
      {children && <div className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{children}</div>}
    </div>
  )
}

function ChartCard({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}) {
  return (
    <article className={`min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 ${className}`}>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {subtitle && <p className="mt-1 text-sm leading-5 text-slate-500">{subtitle}</p>}
      <div className="mt-5 h-60 w-full min-w-0">{children}</div>
    </article>
  )
}

function Header({ active, onNavigate }: { active: Tab; onNavigate: (tab: Tab) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const links: { tab: Tab; label: string; icon: ReactNode }[] = [
    { tab: 'about', label: 'Pesquisa', icon: <UsersRound aria-hidden="true" className="h-4 w-4" /> },
    { tab: 'data', label: 'Dados', icon: <FileText aria-hidden="true" className="h-4 w-4" /> },
    { tab: 'simulator', label: 'O Custo do Fixo', icon: <CircleDollarSign aria-hidden="true" className="h-4 w-4" /> },
  ]
  const select = (tab: Tab) => {
    setMenuOpen(false)
    onNavigate(tab)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <button className="flex items-center gap-2.5 text-slate-950" onClick={() => select('about')} aria-label="PoliVSR, início">
          <BrandMark />
          <span className="text-lg font-bold tracking-tight">Poli<span className="text-red-700">VSR</span></span>
        </button>
        <nav aria-label="Navegação principal" className="hidden items-center gap-1 md:flex">
          {links.map(({ tab, label, icon }) => (
            <button
              key={tab}
              onClick={() => select(tab)}
              aria-current={active === tab ? 'page' : undefined}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${active === tab ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-800 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {menuOpen && (
        <nav aria-label="Navegação móvel" className="grid gap-1 border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          {links.map(({ tab, label, icon }) => (
            <button key={tab} onClick={() => select(tab)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-slate-100">
              {icon}
              {label}
            </button>
          ))}
        </nav>
      )}
    </header>
  )
}

function Hero({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const [hour, setHour] = useState(12)
  const plotRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const roundedIndex = Math.round(hour * 2)
  const loadPosition = hour * 2
  const lowerIndex = Math.floor(loadPosition)
  const upperIndex = Math.min(48, lowerIndex + 1)
  const fraction = loadPosition - lowerIndex
  const load = curvePoints[lowerIndex] + (curvePoints[upperIndex] - curvePoints[lowerIndex]) * fraction
  const x = curveX(hour)
  const y = curveY(load)
  const shownOperations = Math.round(cumulativeOperations[roundedIndex])
  const subheading = useMemo(() => {
    const k = roundedIndex
    const value = curvePoints[k]
    const previous = curvePoints[(k + 47) % 48]
    const next = curvePoints[(k + 1) % 48]
    const change = next - previous
    const time = timeLabel(k / 2)
    const at = k / 2 <= 1 ? 'À ' : 'Às '
    const opening = k === 48 ? 'Ao fim do dia, ' : `${at}${time}, `
    const loadText = `${integerFormat.format(value)} GW`
    if (k >= 23 && k <= 25) return `${at}${time}, a carga líquida do SIN chega ao vale do dia, ${loadText}. O sol, sobretudo nos telhados da geração distribuída, cobre boa parte do consumo. As linhas ficam leves, sobra reativo e a tensão sobe. É quando a rede mais precisa de reatores ligados.`
    if (k >= 38 && k <= 40) return `${at}${time}, a carga líquida bate o pico do dia, ${loadText}: o sol já se pôs e o consumo continua alto. Com as linhas carregadas, os reatores que entraram de manhã já saíram.`
    if (change > 0.4) return `${opening}a carga líquida está em ${loadText} e sobe cerca de ${integerFormat.format(change)} GW por hora: o sol vai embora e começa a rampa da tarde. Os reatores saem, um a um, para não faltar reativo.`
    if (change < -0.4 && k >= 11 && k < 23) return `${opening}a carga líquida está em ${loadText} e caindo: o sol nasce e a geração distribuída tira carga da rede. As linhas ficam leves, sobra reativo, e o operador liga reatores, um degrau de cada vez.`
    if (change < -0.4) return `${opening}a carga líquida está em ${loadText} e recua depois do pico da noite. Com a carga mais leve, os reatores voltam a entrar para segurar a tensão.`
    return `${opening}madrugada, a carga líquida está estável, perto de ${loadText}. Os reatores que entraram à noite seguem ligados.`
  }, [roundedIndex])
  const curveCoordinates = curvePoints.map((value, index) => `${curveX(index / 2).toFixed(2)},${curveY(value).toFixed(2)}`).join(' ')
  const areaCoordinates = `${curveX(0)},42 ${curveCoordinates} ${curveX(24)},42`
  const ariaValueText = `${timeLabel(roundedIndex / 2)}: cerca de ${shownOperations} manobras, carga líquida de ${integerFormat.format(curvePoints[roundedIndex])} GW`

  useEffect(() => {
    const now = new Date()
    const initial = now.getHours() + (now.getMinutes() >= 30 ? 0.5 : 0)
    setHour(initial === 0 ? 24 : initial)
  }, [])

  const updateFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = plotRef.current?.getBoundingClientRect()
    if (!bounds) return
    setHour(clamp(((event.clientX - bounds.left) / bounds.width) * 24, 0, 24))
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return
    dragging.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    updateFromPointer(event)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) updateFromPointer(event)
  }

  const finishPointer = (event: PointerEvent<HTMLDivElement>) => {
    dragging.current = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const lead =
    roundedIndex === 0
      ? 'Num dia útil de verão, às 0h, estimamos 0 manobras até agora.'
      : roundedIndex === 48
        ? 'Num dia útil de verão, ao longo das 24 horas, estimamos cerca de'
        : `Num dia útil de verão, até as ${timeLabel(roundedIndex / 2)}, estimamos cerca de`

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(185,28,28,.22),transparent_55%)]" />
      <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-16 sm:px-6 sm:pb-32 sm:pt-24 lg:px-8">
        <div className="max-w-3xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[.24em] text-red-300">PoliVSR · pesquisa em sistemas elétricos</p>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">Reatores que acompanham a rede.</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Explore a carga líquida de um dia útil de verão e a estimativa de manobras acumuladas ao longo do dia.
          </p>
        </div>
        <div className="mt-9 grid gap-6 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
          <figure className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4 sm:p-6">
            <figcaption className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">Curva de carga líquida</span>
                <p className="mt-1 text-sm text-slate-300">Verão de 2025 a 2026 · SIN</p>
              </div>
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300">Arraste para explorar</span>
            </figcaption>
            <div
              ref={plotRef}
              data-testid="hero-plot"
              className="relative select-none"
              style={{ touchAction: 'pan-y' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={finishPointer}
              onPointerCancel={finishPointer}
              role="presentation"
            >
              <svg aria-hidden="true" className="block h-auto w-full overflow-visible" viewBox="0 0 100 46" preserveAspectRatio="none">
                <defs>
                  <clipPath id="hero-progress">
                    <rect x="0" y="0" width={x} height="46" />
                  </clipPath>
                  <linearGradient id="hero-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity=".26" />
                    <stop offset="100%" stopColor="#f87171" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[80, 60, 40].map((grid) => (
                  <g key={grid}>
                    <line x1="4" x2="96" y1={curveY(grid)} y2={curveY(grid)} stroke="#334155" strokeWidth=".28" strokeDasharray="1.2 1.4" />
                    <text x="1.5" y={curveY(grid) - 0.7} fill="#94a3b8" fontSize="2.2">{grid}</text>
                  </g>
                ))}
                <polygon points={areaCoordinates} fill="url(#hero-fill)" clipPath="url(#hero-progress)" />
                <polyline points={curveCoordinates} fill="none" stroke="#64748b" strokeWidth=".55" strokeLinejoin="round" strokeLinecap="round" />
                <polyline points={curveCoordinates} fill="none" stroke="#fb7185" strokeWidth=".85" strokeLinejoin="round" strokeLinecap="round" clipPath="url(#hero-progress)" />
                <line x1={x} x2={x} y1="5" y2="41.5" stroke="#fecdd3" strokeWidth=".35" strokeDasharray="1 1" />
                <circle data-testid="hero-dot" cx={x} cy={y} r="2.35" fill="#fff" stroke="#f87171" strokeWidth=".8" />
                <circle cx={x} cy={y} r=".85" fill="#b91c1c" />
              </svg>
              <div className="mt-2 flex justify-between px-[3%] text-[11px] text-slate-400" aria-hidden="true">
                <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>24h</span>
              </div>
            </div>
            <label className="sr-only" htmlFor="hero-hour">Horário da curva</label>
            <input
              id="hero-hour"
              className="sr-only focus:not-sr-only focus:absolute focus:z-10 focus:mt-2 focus:h-8 focus:w-[calc(100%-3rem)] focus:rounded focus:bg-white focus:px-2 focus:text-slate-950"
              type="range"
              min="0"
              max="48"
              step="1"
              value={roundedIndex}
              aria-valuetext={ariaValueText}
              onChange={(event) => setHour(Number(event.target.value) / 2)}
            />
            <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-400">
              <span>0 GW</span>
              <span>{timeLabel(hour)} · {brl(load, 1)} GW</span>
              <span>24h</span>
            </div>
          </figure>
          <div className="flex flex-col justify-end lg:pb-1">
            <p className="text-sm leading-6 text-slate-300">{lead}</p>
            <p className="mt-1 text-6xl font-black tracking-tight text-red-300 sm:text-7xl" aria-live="polite">{integerFormat.format(shownOperations)}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{subheading}</p>
            <button
              onClick={() => onNavigate('simulator')}
              className="animate-cta-aurora mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-red-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-600"
            >
              O Custo do Fixo <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
        <p className="mt-6 max-w-3xl text-xs leading-5 text-slate-400">
          Estimativa distribuída pelas meias horas conforme a variação da carga líquida. Não há dado público de manobras por hora. <ExternalSource href={REFERENCE_URLS.parpel}>ONS, PAR/PEL 2025</ExternalSource>
        </p>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-12 rounded-t-[50%] bg-slate-50" />
    </section>
  )
}

function HomeCharts() {
  const duckData = SET25.map((value, index) => ({
    hour: index / 2,
    label: timeLabel(index / 2),
    set2025: value,
    set2026: SET26[index],
  }))
  const distributedSolar = MMGD.map(([year, value], index) => ({ year, capacity: value, partial: index === MMGD.length - 1 }))
  const reactors = REAT.map(([year, count]) => ({ year, count, partial: year === 2026 }))
  const regions = REG.map(([name, count]) => ({ name, count }))
  const ages = IDADE.map(([name, count]) => ({ name, count }))

  return (
    <div className="mt-8 grid gap-5 md:grid-cols-2">
      <ChartCard title="Curva de pato · setembro" subtitle="Carga líquida média do SIN, GW">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={duckData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="hour" tickFormatter={(value) => `${value}h`} ticks={[0, 6, 12, 18]} tick={{ fontSize: 11 }} />
            <YAxis domain={['dataMin - 3', 'dataMax + 3']} tick={{ fontSize: 11 }} />
            <Tooltip labelFormatter={(value) => `${value}h`} formatter={(value, name) => [`${numberFormat.format(Number(value))} GW`, name === 'set2026' ? 'set/2026' : 'set/2025']} />
            <Legend formatter={(value) => (value === 'set2026' ? 'set/2026' : 'set/2025')} />
            <Line dataKey="set2025" name="set2025" type="monotone" stroke="#94a3b8" strokeWidth={2} dot={false} />
            <Line dataKey="set2026" name="set2026" type="monotone" stroke="#b91c1c" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Geração distribuída" subtitle="Potência instalada, GW · 2026 parcial">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distributedSolar} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value) => [`${numberFormat.format(Number(value))} GW`, 'Potência']} />
            <Bar dataKey="capacity" name="Potência" radius={[4, 4, 0, 0]}>
              {distributedSolar.map((entry) => <Cell key={entry.year} fill={entry.partial ? '#fca5a5' : '#334155'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Reatores novos por ano" subtitle="Entradas reconstruídas do cadastro atual">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={reactors} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} interval={2} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value) => [integerFormat.format(Number(value)), 'Reatores']} />
            <Bar dataKey="count" name="Reatores" radius={[4, 4, 0, 0]}>
              {reactors.map((entry) => <Cell key={entry.year} fill={entry.partial ? '#fca5a5' : '#b91c1c'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Reatores por região" subtitle="Unidades ativas de 230 kV ou mais">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={regions} layout="vertical" margin={{ top: 4, right: 10, bottom: 0, left: 4 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={78} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value) => [integerFormat.format(Number(value)), 'Reatores']} />
            <Bar dataKey="count" fill="#b91c1c" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Idade dos reatores" subtitle="Anos desde a entrada em operação">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ages} layout="vertical" margin={{ top: 4, right: 10, bottom: 0, left: 4 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value) => [integerFormat.format(Number(value)), 'Reatores']} />
            <Bar dataKey="count" fill="#475569" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}

function SavingsSection({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const campo = scenarioResult('campo')
  const polo = scenarioResult('polo_eolico')
  const urbano = scenarioResult('urbano')
  const cards = [
    { title: '500 kV · Campo', value: signedMi(campo.vpl), detail: `${percentFormat.format(campo.chance * 100)}% de chance` },
    { title: '500 kV · Polo eólico', value: signedMi(polo.vpl), detail: `${percentFormat.format(polo.chance * 100)}% de chance` },
    { title: '230 kV · Centro Urbano', value: signedMi(urbano.vpl), detail: `${percentFormat.format(urbano.chance * 100)}% de chance` },
  ]

  return (
    <section className="mt-16 rounded-3xl bg-slate-950 px-5 py-8 text-white sm:px-8 sm:py-10">
      <div className="flex flex-col gap-6">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-red-300">Casos de referência</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Onde o VSR compensa</h2>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Subestação nova de leilão que precisaria de dois bancos na mesma barra. A vantagem vem do que deixa de ser comprado.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {cards.map((card) => (
            <article key={card.title} className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
              <p className="text-sm font-semibold text-slate-300">{card.title}</p>
              <p className="mt-3 text-2xl font-extrabold text-emerald-300">{card.value}</p>
              <p className="mt-1 text-sm text-slate-400">{card.detail}</p>
            </article>
          ))}
        </div>
        <div className="grid gap-4 border-t border-slate-800 pt-5 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Condições do caso-base</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">Fixo com fase reserva por banco, padrão EPE; OLTC a vácuo; reserva do VSR em pool. A visão do SIN é positiva nos três cenários.</p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Casos que não compensam</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">Reforço autorizado pago pelo Banco de Preços: −R$ 4,4 mi. Troca 1 por 1 sem vão evitado. Reserva própria 1:3: −R$ 5,6 mi. Preço no nível de 2023: −R$ 29,5 mi.</p>
          </div>
        </div>
        <button onClick={() => onNavigate('simulator')} className="animate-cta-aurora inline-flex w-fit items-center gap-2 rounded-full bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-600">
          Explorar premissas <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}

function AboutPage({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  return (
    <>
      <Hero onNavigate={onNavigate} />
      <main className="relative mx-auto -mt-10 max-w-7xl rounded-t-3xl bg-slate-50 px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:px-8">
        <section aria-label="Indicadores do sistema" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <strong className="text-2xl font-black tracking-tight text-red-700 sm:text-3xl">1.084</strong>
            <p className="mt-2 text-sm font-semibold leading-5 text-slate-800">reatores shunt de 230 kV ou mais no SIN</p>
            <span className="mt-1 block text-xs leading-5 text-slate-500">126 mil Mvar instalados · ONS</span>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <strong className="text-2xl font-black tracking-tight text-red-700 sm:text-3xl">~530</strong>
            <p className="mt-2 text-sm font-semibold leading-5 text-slate-800">deles são manobráveis, chaveados no dia a dia</p>
            <span className="mt-1 block text-xs leading-5 text-slate-500"><ExternalSource href={REFERENCE_URLS.cigre}>CIGRÉ A3-10747 (2026)</ExternalSource></span>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <strong className="text-2xl font-black tracking-tight text-red-700 sm:text-3xl">~140</strong>
            <p className="mt-2 text-sm font-semibold leading-5 text-slate-800">reatores chaveados por dia útil de verão</p>
            <span className="mt-1 block text-xs leading-5 text-slate-500">~170 em 2030 · ONS, PAR/PEL 2025</span>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <strong className="text-2xl font-black tracking-tight text-red-700 sm:text-3xl">53,9 GW</strong>
            <p className="mt-2 text-sm font-semibold leading-5 text-slate-800">de geração distribuída instalada</p>
            <span className="mt-1 block text-xs leading-5 text-slate-500">5,9 GW no fim de 2020 · <ExternalSource href={REFERENCE_URLS.aneel}>ANEEL</ExternalSource></span>
          </article>
        </section>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700">
          <span className="font-semibold">Expansão prevista:</span> ~12.000 Mvar de novos reatores de barra previstos na rede de 500 kV (
          <ExternalSource href={REFERENCE_URLS.parpel}>ONS, PAR/PEL 2025, p. 64</ExternalSource>).
        </div>

        <section className="mt-16">
          <SectionHeading eyebrow="Dados do sistema" title="O que muda ao longo do dia">
            Mais geração distribuída reduz a carga líquida nas horas de sol. A curva e os registros de reatores mostram o tamanho dessa variação.
          </SectionHeading>
          <HomeCharts />
        </section>

        <SavingsSection onNavigate={onNavigate} />

        <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_.8fr] lg:items-start">
          <div>
            <SectionHeading eyebrow="Tecnologia" title="O que é o VSR">
              Um reator shunt variável ajusta a absorção de potência reativa com um comutador sob carga, quase sem abrir e fechar disjuntor.
            </SectionHeading>
            <blockquote className="mt-6 border-l-2 border-red-700 pl-4 text-lg font-semibold leading-7 text-slate-900">
              Um VSR faz o trabalho de dois bancos fixos: a subestação compra um vão e uma fase reserva a menos.
            </blockquote>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
              O valor econômico principal está em evitar equipamentos e obras. Desgaste e falhas de manobra entram no modelo como efeito secundário.
            </p>
          </div>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h3 className="text-xl font-bold text-slate-950">Por que não manobra controlada?</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              A manobra controlada, como Switchsync, reduz falhas de disjuntor na abertura e já é prática comum. Ela não reduz o número de operações nem evita o segundo banco e o segundo vão, que concentram o valor econômico. No modelo, a taxa de falha do disjuntor altera o resultado em menos de R$ 0,5 mi.
            </p>
          </article>
        </section>

        <section className="mt-16 grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-red-700">Pesquisa aplicada</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">Próximos estudos do grupo</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
              <li className="border-t border-slate-100 pt-3">Preço do VSR entregue no Brasil, a maior incerteza do modelo.</li>
              <li className="border-t border-slate-100 pt-3">Medição de manobras e desgaste em campo com uma transmissora.</li>
              <li className="border-t border-slate-100 pt-3">Comutador do VSR: mínimo de regulação de 50% em 300 Mvar/500 kV a confirmar.</li>
            </ul>
          </article>
          <details className="rounded-2xl border border-slate-200 bg-white p-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xl font-bold tracking-tight text-slate-950">
              Fontes e método
              <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0" />
            </summary>
            <p className="mt-4 text-sm leading-6 text-slate-600">Bases públicas, hipóteses e limites do modelo estão descritos junto aos dados e na calculadora. O caso-base usa 12,11% a.a. real, antes de impostos.</p>
            <ul className="mt-4 space-y-3 text-sm leading-6">
              <li><ExternalSource href={REFERENCE_URLS.cigre}>CIGRÉ A3-10747 (2026)</ExternalSource></li>
              <li><ExternalSource href={REFERENCE_URLS.parpel}>ONS, PAR/PEL 2025</ExternalSource></li>
              <li><ExternalSource href={REFERENCE_URLS.aneel}>ANEEL, geração distribuída</ExternalSource></li>
            </ul>
            <button onClick={() => onNavigate('data')} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-red-800 hover:text-red-950">
              Dados e limites do modelo <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </details>
        </section>

        <section className="mt-16 overflow-hidden rounded-3xl bg-slate-950 text-white">
          <div className="grid gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1fr_.75fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-red-300">PoliVSR · Poli-USP</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Pesquisa para uma rede mais flexível.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
                O grupo PoliVSR reúne pesquisa em sistemas de potência na Poli-USP, com apoio e fomento da Hitachi Energy. O trabalho compara alternativas técnicas e econômicas com premissas rastreáveis.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-4"><h3 className="font-bold">O que estamos fazendo</h3><p className="mt-2 text-sm leading-6 text-slate-400">Medimos quando evitar um banco, uma fase reserva e um vão tem valor para a transmissão.</p></div>
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-4"><h3 className="font-bold">O que queremos</h3><p className="mt-2 text-sm leading-6 text-slate-400">Validar premissas com fabricantes, transmissoras e dados de campo.</p></div>
            </div>
            <div className="flex flex-col gap-2 text-sm text-slate-300 lg:col-span-2 lg:flex-row lg:items-center lg:justify-between">
              <span>Poli-USP · São Paulo, SP · Apoio Hitachi Energy HUB</span>
              <a className="inline-flex w-fit items-center gap-2 font-semibold text-white underline decoration-slate-600 underline-offset-4 hover:decoration-white" href="mailto:pesquisa@polivsr.usp.br">pesquisa@polivsr.usp.br <ArrowRight aria-hidden="true" className="h-4 w-4" /></a>
            </div>
          </div>
        </section>
      </main>
      <PageEndNavigation active="about" onNavigate={onNavigate} />
    </>
  )
}

function PageEndNavigation({ active, onNavigate }: { active: Tab; onNavigate: (tab: Tab) => void }) {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <button className="flex items-center gap-2 font-bold text-slate-700" onClick={() => onNavigate('about')}><BrandMark /> PoliVSR</button>
        <nav aria-label="Navegação de rodapé" className="flex flex-wrap items-center justify-center gap-1">
          {(['about', 'data', 'simulator'] as Tab[]).map((tab) => (
            <button key={tab} onClick={() => onNavigate(tab)} aria-current={active === tab ? 'page' : undefined} className="rounded-full px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
              {tab === 'about' ? 'Pesquisa' : tab === 'data' ? 'Dados' : 'O Custo do Fixo'}
            </button>
          ))}
        </nav>
        <span className="text-xs text-slate-500">Poli-USP · Hitachi Energy</span>
      </div>
    </footer>
  )
}

function DataPage({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const dataSources = [
    { title: 'Carga líquida e planejamento', text: 'Curva média do SIN no verão, PAR/PEL, expansão prevista e volume de operações estimado.', href: REFERENCE_URLS.parpel, label: 'ONS, PAR/PEL 2025' },
    { title: 'Reatores manobráveis', text: 'Cadastro e análise de requisitos para chaveamento de reatores shunt.', href: REFERENCE_URLS.cigre, label: 'CIGRÉ A3-10747 (2026)' },
    { title: 'Geração distribuída', text: 'Séries de potência instalada usadas para contextualizar a carga líquida.', href: REFERENCE_URLS.aneel, label: 'ANEEL' },
  ]
  return (
    <>
      <main className="mx-auto min-h-[70vh] max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <SectionHeading eyebrow="Dados abertos" title="Fontes, premissas e limites">
          Os dados usados nos gráficos e na calculadora vêm das séries de referência e do modelo financeiro do grupo.
        </SectionHeading>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {dataSources.map((source) => (
            <article key={source.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">{source.title}</h2>
              <p className="mt-3 min-h-14 text-sm leading-6 text-slate-600">{source.text}</p>
              <div className="mt-5"><ExternalSource href={source.href}>{source.label}</ExternalSource></div>
            </article>
          ))}
        </div>
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-950">Curva e contador</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">A curva é a carga líquida média do SIN no verão de 2025 a 2026. O contador estima {TOTAL_DIA} operações por dia útil e reparte esse total pelas meias horas conforme a variação absoluta da carga líquida. Não há dado público de manobras por hora.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-950">Modelo financeiro</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{integerFormat.format(model.meta.simulacoes)} simulações de Monte Carlo em {model.meta.horizonte_anos} anos, com fluxos mensais e valores em {model.meta.moeda}. A calculadora apresenta cenários e premissas favoráveis e desfavoráveis.</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">Taxa da transmissora: 12,11% a.a. real, antes de impostos. Visão do SIN: {brl(model.meta.taxa_sin * 100, 1)}% a.a. real.</p>
          </article>
        </section>
        <details className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-slate-900">
            Limites de leitura
            <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0" />
          </summary>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
            <li>O total diário é uma estimativa, não uma medição horária de operações.</li>
            <li>O preço do VSR entregue no Brasil é a maior incerteza do resultado.</li>
            <li>A comparação econômica depende de evitar um segundo banco, uma fase reserva e um vão.</li>
          </ul>
        </details>
        <button onClick={() => onNavigate('simulator')} className="animate-cta-aurora mt-8 inline-flex items-center gap-2 rounded-full bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-600">
          O Custo do Fixo <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </main>
      <PageEndNavigation active="data" onNavigate={onNavigate} />
    </>
  )
}

function ViewSwitch({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  return (
    <div role="group" aria-label="Visão financeira" className="inline-flex rounded-full bg-slate-100 p-1">
      {([
        ['concessionaria', 'Transmissora'],
        ['sin', 'SIN'],
      ] as [View, string][]).map(([key, label]) => (
        <button key={key} onClick={() => onChange(key)} aria-pressed={view === key} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${view === key ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}>
          {label}
        </button>
      ))}
    </div>
  )
}

function SimulatorPage({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const [scenario, setScenario] = useState('campo')
  const [view, setView] = useState<View>('concessionaria')
  const [variant, setVariant] = useState('base')
  const [price, setPrice] = useState(model.cenarios.campo.precos.base / 1_000_000)
  const [mobileMenu, setMobileMenu] = useState(false)
  const scenarioData = model.cenarios[scenario]
  const variants = scenarioData.visoes[view].variantes
  const variantKeys = Object.keys(variants)
  const activeVariant = variants[variant] ?? variants.base
  const stats = activeVariant.stats
  const statValue = (key: string) => interpolate(scenarioData.grade, stats[key], price)
  const p10 = statValue('p10') ?? 0
  const p50 = statValue('p50') ?? 0
  const p90 = statValue('p90') ?? 0
  const chance = statValue('ppos') ?? 0
  const payback = statValue('pay50')
  const breakEven = activeVariant.equilibrio_mi[1]
  const operation = Math.round(scenarioData.oper.ops_fixo_ano - scenarioData.oper.ops_vsr_ano)
  const options = Object.entries(variants) as [string, any][]
  const chartData = scenarioData.grade.map((grid: number, index: number) => ({
    price: grid,
    p10: stats.p10[index],
    p50: stats.p50[index],
    p90: stats.p90[index],
  }))
  const fanData = useMemo(() => {
    const rows = riskRows.filter((row) => row.cenario === scenario && row.visao === view)
    const priceDelta = price - model.cenarios[scenario].precos.base / 1_000_000
    return Array.from({ length: model.meta.horizonte_anos + 1 }, (_, year) => {
      const byAlternative = (alternative: string) => rows.find((row) => row.ano === year && row.alternativa === alternative)
      const fixed = byAlternative('fixo')
      const vsr = byAlternative('vsr')
      return {
        year,
        fixoP10: fixed?.p10 / 1_000_000,
        fixoFaixa: (fixed?.p90 - fixed?.p10) / 1_000_000,
        fixoP50: fixed?.p50 / 1_000_000,
        vsrP10: vsr?.p10 / 1_000_000 + priceDelta,
        vsrFaixa: (vsr?.p90 - vsr?.p10) / 1_000_000,
        vsrP50: vsr?.p50 / 1_000_000 + priceDelta,
      }
    })
  }, [price, scenario, view])
  const typicalDay = scenarioData.dia.hora.map((hour: number, index: number) => ({
    hour,
    carga: scenarioData.dia.r[index],
    fixo: scenarioData.dia.fixo[index],
    vsr: scenarioData.dia.vsr[index],
  }))
  const cascade = activeVariant.cascata.map((item: any) => ({ name: item.c, value: item.a - item.b }))
  const savingsScenarios = [
    { id: 'campo', name: 'Campo', icon: '500 kV' },
    { id: 'polo_eolico', name: 'Polo eólico', icon: '500 kV' },
    { id: 'urbano', name: 'Centro Urbano', icon: '230 kV' },
  ]

  const chooseScenario = (id: string) => {
    setScenario(id)
    setVariant('base')
    setPrice(model.cenarios[id].precos.base / 1_000_000)
  }

  const chooseView = (nextView: View) => {
    setView(nextView)
    if (!model.cenarios[scenario].visoes[nextView].variantes[variant]) setVariant('base')
  }

  const selectVariant = (key: string) => {
    if (variants[key]) setVariant(key)
  }

  const priceChips = [
    { label: 'Base', value: scenarioData.precos.base / 1_000_000 },
    { label: 'Contratos · menor', value: scenarioData.precos.baixo / 1_000_000 },
    { label: 'Contratos · maior', value: scenarioData.precos.alto / 1_000_000 },
    { label: 'Preço de 2023', value: scenarioData.precos.estresse_baixo / 1_000_000 },
  ]

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-red-700">Simulação financeira</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">O Custo do Fixo</h1>
            <p className="mt-4 text-base leading-7 text-slate-600">Compare o valor de um banco fixo com um reator variável, com premissas favoráveis e desfavoráveis à vista.</p>
          </div>
          <ViewSwitch view={view} onChange={chooseView} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[.78fr_1.22fr]">
          <aside className="flex min-w-0 flex-col gap-6">
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-950">Cenário</h2>
                <button className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 lg:hidden" onClick={() => setMobileMenu(!mobileMenu)} aria-expanded={mobileMenu}>
                  {mobileMenu ? 'Fechar' : 'Cenários'} <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <div className={`${mobileMenu ? 'grid' : 'hidden'} mt-3 gap-2 lg:grid`}>
                {savingsScenarios.map((choice) => {
                  const selected = scenario === choice.id
                  const data = model.cenarios[choice.id]
                  return (
                    <button key={choice.id} onClick={() => chooseScenario(choice.id)} aria-pressed={selected} className={`rounded-2xl border p-4 text-left transition ${selected ? 'border-slate-950 bg-slate-950 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-800 hover:border-slate-400'}`}>
                      <span className="flex items-center justify-between gap-2">
                        <strong className="text-base">{data.nome}</strong>
                        <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${selected ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>{choice.icon}</span>
                      </span>
                      <span className={`mt-2 block text-xs leading-5 ${selected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {choice.id === 'urbano' ? 'Base: carga líquida do Nordeste · 230 kV' : data.base}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">Preço do VSR</h2>
                  <p className="mt-1 text-sm text-slate-500">{scenarioData.kv} kV · valor em R$ de set/2026</p>
                </div>
                <strong className="shrink-0 text-lg font-extrabold text-slate-950">R$ {brl(price)} mi</strong>
              </div>
              <input
                className="mt-5 h-2 w-full cursor-pointer accent-red-700"
                type="range"
                min={scenarioData.grade[0]}
                max={scenarioData.grade[scenarioData.grade.length - 1]}
                step="0.1"
                value={price}
                aria-label="Preço do VSR em milhões de reais"
                onChange={(event) => setPrice(Number(event.target.value))}
              />
              <div className="mt-1 flex justify-between text-[11px] text-slate-500"><span>R$ {brl(scenarioData.grade[0])} mi</span><span>R$ {brl(scenarioData.grade.at(-1))} mi</span></div>
              <div className="mt-4 flex flex-wrap gap-2">
                {priceChips.map((chip) => (
                  <button key={chip.label} onClick={() => setPrice(chip.value)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${Math.abs(price - chip.value) < 0.05 ? 'border-red-700 bg-red-50 text-red-800' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}>
                    {chip.label} · R$ {brl(chip.value)} mi
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <label htmlFor="premise" className="text-lg font-bold text-slate-950">Premissas</label>
              <select id="premise" value={variant} onChange={(event) => selectVariant(event.target.value)} className="mt-3 block min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-100">
                {options.map(([key, option]) => <option key={key} value={key}>{option.nome}</option>)}
              </select>
              <p className="mt-3 text-xs leading-5 text-slate-500">As premissas e os casos negativos do modelo seguem disponíveis nesta lista.</p>
            </section>
          </aside>

          <section className="min-w-0">
            <h2 className="sr-only">Resultados estimados</h2>
            <div className="grid grid-cols-2 gap-3">
              <article className="rounded-2xl bg-slate-950 p-4 text-white sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">VPL mediano · {model.meta.horizonte_anos} anos</p>
                <p className={`mt-3 text-2xl font-black sm:text-3xl ${p50 >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{signedMi(p50)}</p>
                <p className="mt-1 text-xs text-slate-400">Faixa P10–P90: {signedMi(p10)} a {signedMi(p90)}</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chance de VSR superar o fixo</p>
                <p className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl">{percentFormat.format(chance * 100)}%</p>
                <p className="mt-1 text-xs text-slate-500">Mediana do preço de equilíbrio</p>
                <p className="mt-1 text-sm font-bold text-slate-800">R$ {brl(breakEven)} mi</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payback mediano</p>
                <p className="mt-3 text-xl font-black text-slate-950 sm:text-2xl">{payback === null ? 'Não ocorre' : payback === 0 ? 'Na compra' : `${numberFormat.format(payback)} meses`}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{payback === 0 ? 'o VSR já sai mais barato na compra' : payback === null ? 'em mais da metade das simulações' : 'mediana das simulações'}</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cenário e tensão</p>
                <p className="mt-3 text-xl font-black text-slate-950">{scenarioData.nome}</p>
                <p className="mt-1 text-xs text-slate-500">{scenarioData.kv} kV · {scenarioData.mvar_vsr} Mvar</p>
              </article>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricTile label="Manobras evitadas" value={integerFormat.format(operation)} detail="por ano" />
              <MetricTile label="Taps do VSR" value={integerFormat.format(scenarioData.oper.taps_vsr_ano)} detail="por ano" />
              <MetricTile label="Troca do disjuntor fixo" value={`${numberFormat.format(scenarioData.oper.anos_ate_troca_fixo)} anos`} detail="estimativa do modelo" />
              <MetricTile label="Manutenção do OLTC" value={`${numberFormat.format(scenarioData.oper.anos_entre_manut_oltc)} anos`} detail="intervalo estimado" />
            </div>

            <ChartCard className="mt-6" title="A névoa do risco" subtitle={`Fluxo acumulado em ${model.meta.horizonte_anos} anos · faixa P10–P90 · preço atual`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fanData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} tickFormatter={(value) => `${value}a`} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `${numberFormat.format(Number(value))}`} />
                  <Tooltip labelFormatter={(value) => `Ano ${value}`} formatter={(value, name) => [`R$ ${brl(Number(value))} mi`, name]} />
                  <Legend />
                  <Area dataKey="fixoP10" stackId="fixo" stroke="none" fill="transparent" name="Fixo P10" />
                  <Area dataKey="fixoFaixa" stackId="fixo" stroke="#be123c" fill="#fda4af" fillOpacity={0.25} name="Fixo P10–P90" />
                  <Area dataKey="vsrP10" stackId="vsr" stroke="none" fill="transparent" name="VSR P10" />
                  <Area dataKey="vsrFaixa" stackId="vsr" stroke="#047857" fill="#6ee7b7" fillOpacity={0.25} name="VSR P10–P90" />
                  <Line dataKey="fixoP50" type="monotone" stroke="#be123c" strokeWidth={2} dot={false} name="Fixo P50" />
                  <Line dataKey="vsrP50" type="monotone" stroke="#047857" strokeWidth={2} dot={false} name="VSR P50" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <ChartCard title="VPL × preço" subtitle="VPL em R$ milhões · premissas selecionadas">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="price" tick={{ fontSize: 11 }} tickFormatter={(value) => `${value}`} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={(value) => `Preço: R$ ${brl(Number(value))} mi`} formatter={(value, name) => [`R$ ${brl(Number(value))} mi`, name]} />
                <Legend />
                <ReferenceLine x={price} stroke="#0f172a" strokeDasharray="4 4" />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Line dataKey="p10" type="monotone" stroke="#94a3b8" strokeWidth={1.5} dot={false} name="P10" />
                <Line dataKey="p50" type="monotone" stroke="#b91c1c" strokeWidth={2.5} dot={false} name="P50" />
                <Line dataKey="p90" type="monotone" stroke="#64748b" strokeWidth={1.5} dot={false} name="P90" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-950">Tabela de preço e resultado</h2>
            <p className="mt-1 text-sm text-slate-500">Valores interpolados do modelo para o preço selecionado.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-left text-sm">
                <thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><th className="py-3 pr-3">Indicador</th><th className="px-3 py-3 text-right">Valor</th><th className="py-3 pl-3 text-right">Referência</th></tr></thead>
                <tbody>
                  <tr className="border-b border-slate-100"><th className="py-3 pr-3 font-semibold text-slate-700">Preço do VSR</th><td className="px-3 py-3 text-right">R$ {brl(price)} mi</td><td className="py-3 pl-3 text-right text-slate-500">R$ {brl(scenarioData.precos.base / 1_000_000)} mi</td></tr>
                  <tr className="border-b border-slate-100"><th className="py-3 pr-3 font-semibold text-slate-700">VPL P10</th><td className="px-3 py-3 text-right">{signedMi(p10)}</td><td className="py-3 pl-3 text-right text-slate-500">R$ de set/2026</td></tr>
                  <tr className="border-b border-slate-100"><th className="py-3 pr-3 font-semibold text-slate-700">VPL P50</th><td className="px-3 py-3 text-right">{signedMi(p50)}</td><td className="py-3 pl-3 text-right text-slate-500">{percentFormat.format(chance * 100)}% positivos</td></tr>
                  <tr><th className="py-3 pr-3 font-semibold text-slate-700">VPL P90</th><td className="px-3 py-3 text-right">{signedMi(p90)}</td><td className="py-3 pl-3 text-right text-slate-500">R$ de set/2026</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">Preço de equilíbrio P50: R$ {brl(breakEven)} mi. As taxas do modelo são 12,11% a.a. real, antes de impostos, para a transmissora; no SIN, {brl(model.meta.taxa_sin * 100, 1)}% a.a. real.</p>
          </section>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <ChartCard title="Dia típico" subtitle={`Carga líquida e estados de operação · ${scenarioData.dia.data}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={typicalDay} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickFormatter={(value) => timeLabel(Number(value))} interval={7} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 'dataMax + 0.1']} />
                <Tooltip labelFormatter={(value) => timeLabel(Number(value))} formatter={(value, name) => [numberFormat.format(Number(value)), name]} />
                <Legend />
                <Line dataKey="carga" type="monotone" stroke="#334155" strokeWidth={2} dot={false} name="Carga líquida" />
                <Line dataKey="fixo" type="stepAfter" stroke="#b91c1c" strokeWidth={2} dot={false} name="Banco fixo" />
                <Line dataKey="vsr" type="stepAfter" stroke="#047857" strokeWidth={2} dot={false} name="VSR" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="De onde vem o resultado" subtitle="Contribuição por componente · R$ milhões">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cascade} layout="vertical" margin={{ top: 4, right: 10, bottom: 0, left: 6 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={124} tick={{ fontSize: 10 }} />
                <ReferenceLine x={0} stroke="#64748b" />
                <Tooltip formatter={(value) => [`R$ ${brl(Number(value))} mi`, 'Contribuição']} />
                <Bar dataKey="value" name="Contribuição" radius={[0, 4, 4, 0]}>
                  {cascade.map((item: any) => <Cell key={item.name} fill={item.value >= 0 ? '#047857' : '#b91c1c'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
            Campo, cascata do caso-base: vão R$ 13,0 mi; fase reserva R$ 9,0 mi; O&M do vão R$ 1,0 mi. Desgaste e falhas ficam em torno de R$ 0,3 mi.
          </p>
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
            Manobras evitadas = operações do fixo menos operações do VSR, por ano. O caso selecionado mostra {integerFormat.format(operation)}.
          </p>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold text-slate-950">Casos sem vantagem financeira</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">As variantes abaixo fazem parte do modelo. Escolha uma premissa no seletor para atualizar resultados e cascata; o preço de 2023 está disponível nos chips.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { key: 'reforco', label: 'Reforço autorizado pelo BPR · −R$ 4,4 mi' },
              { key: 'res13', label: 'Reserva própria 1:3 · −R$ 5,6 mi' },
              { key: 'fase_nenhuma', label: 'Fixo sem fase reserva' },
            ].map((item) => (
              <button key={item.key} disabled={!variants[item.key]} onClick={() => selectVariant(item.key)} className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 enabled:hover:border-red-700 enabled:hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-40">
                {item.label}
              </button>
            ))}
            <button onClick={() => setPrice(scenarioData.precos.estresse_baixo / 1_000_000)} className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-red-700 hover:text-red-800">Preço de 2023 · −R$ 29,5 mi</button>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">Troca 1 por 1 sem vão evitado</span>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold text-slate-950">Método</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>{integerFormat.format(model.meta.simulacoes)} simulações de Monte Carlo, fluxos mensais em {model.meta.horizonte_anos} anos.</li>
              <li>Valores em {model.meta.moeda}; transmissora: 12,11% a.a. real, antes de impostos.</li>
              <li>Visão do SIN: {brl(model.meta.taxa_sin * 100, 1)}% a.a. real, sem Parcela Variável.</li>
              <li>Casos-base: fixo com fase reserva por banco, OLTC a vácuo e reserva do VSR em pool.</li>
            </ul>
          </article>
          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold text-slate-950">Contratos e referências de preço</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Preços públicos usados para ancorar a faixa do equipamento. A maior incerteza é o VSR entregue no Brasil.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left text-xs sm:text-sm">
                <thead><tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-500"><th className="px-2 py-3">Comprador</th><th className="px-2 py-3">Ano</th><th className="px-2 py-3">Tensão</th><th className="px-2 py-3">Mvar</th><th className="px-2 py-3">Preço publicado</th><th className="px-2 py-3">Uso</th><th className="px-2 py-3">Fonte</th></tr></thead>
                <tbody>{model.contratos.map((contract: any) => (
                  <tr key={contract.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-2 py-3 font-semibold text-slate-800">{contract.comprador}</td>
                    <td className="px-2 py-3 text-slate-600">{contract.ano}</td>
                    <td className="px-2 py-3 text-slate-600">{contract.tensao_kV} kV</td>
                    <td className="px-2 py-3 text-slate-600">{contract.mvar_max}</td>
                    <td className="px-2 py-3 text-slate-600">{contract.preco_original}</td>
                    <td className="px-2 py-3 text-slate-600">{contract.uso}</td>
                    <td className="px-2 py-3"><a className="inline-flex items-center gap-1 text-red-700 underline underline-offset-2" href={contract.fonte} target="_blank" rel="noreferrer">Abrir <ExternalLink aria-hidden="true" className="h-3 w-3" /></a></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </section>
        </section>
      </main>
      <PageEndNavigation active="simulator" onNavigate={onNavigate} />
    </>
  )
}

function MetricTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <p className="text-[11px] font-semibold leading-4 text-slate-500">{label}</p>
      <p className="mt-2 truncate text-lg font-extrabold text-slate-950 sm:text-xl">{value}</p>
      <span className="mt-1 block text-[11px] text-slate-500">{detail}</span>
    </article>
  )
}

export default function HomePage() {
  const [active, setActive] = useState<Tab>('about')
  const navigate = (tab: Tab) => {
    setActive(tab)
    window.scrollTo(0, 0)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header active={active} onNavigate={navigate} />
      {active === 'about' && <AboutPage onNavigate={navigate} />}
      {active === 'data' && <DataPage onNavigate={navigate} />}
      {active === 'simulator' && <SimulatorPage onNavigate={navigate} />}
    </div>
  )
}
