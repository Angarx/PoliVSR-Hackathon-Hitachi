'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'
import { InfoTip } from '@/components/info-tip'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import monteCarloData from '@/lib/dados/monte_carlo.json'
import calculatorData from '@/lib/dados/site_calculadora.json'
import { mi, numberText, percentage } from '@/lib/format'

type ScenarioId = 'urbano' | 'campo' | 'polo_eolico'
type ViewId = 'concessionaria' | 'sin'

const results: any = monteCarloData
const calculator: any = calculatorData

function signedMi(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return `${value > 0 ? '+ ' : ''}${mi(value, 2)}`
}

function Panel({ title, figure, info, children }: {
  title: string
  figure?: string
  info?: ReactNode
  children: ReactNode
}) {
  return <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-slate-950 sm:text-xl">{title}</h2>
        {figure && <p className="mt-1 text-xs font-medium text-slate-500">Figura {figure}</p>}
      </div>
      {info}
    </header>
    <div className="mt-4">{children}</div>
  </section>
}

function Metric({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0 rounded-lg bg-slate-50 px-3 py-3">
    <p className="text-xs font-semibold leading-4 text-slate-500">{label}</p>
    <div className="mt-1 break-words text-sm font-bold leading-5 tabular-nums text-slate-950">{children}</div>
  </div>
}

function HistogramTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg">
    <p className="font-bold text-slate-950">{mi(point.de, 2)} a {mi(point.ate, 2)}</p>
    <p className="mt-1 text-slate-600">{numberText(point.n)} simulações</p>
  </div>
}

function PriceTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg">
    <p className="font-bold text-slate-950">VSR a {mi(point.price, 2)}</p>
    <p className="mt-1 text-emerald-700">VPL P50: {mi(point.p50, 2)}</p>
    <p className="mt-1 text-slate-600">P10 {mi(point.p10, 2)} · P90 {mi(point.p90, 2)}</p>
  </div>
}

export default function MonteCarlo({
  initialScenarioId,
  initialViewId,
  onBack,
}: {
  initialScenarioId: ScenarioId
  initialViewId: ViewId
  onBack: () => void
}) {
  const [scenarioId, setScenarioId] = useState<ScenarioId>(initialScenarioId)
  const [viewId, setViewId] = useState<ViewId>(initialViewId)
  const [showAllTornado, setShowAllTornado] = useState(false)
  const [showDistributions, setShowDistributions] = useState(false)

  const scenario = calculator.cenarios[scenarioId]
  const bins = results.histograma[scenarioId][viewId]
    .filter((row: any) => row.n > 0)
    .map((row: any) => ({ ...row, center: (row.de + row.ate) / 2 }))
  const cards: any[] = results.cartoes[scenarioId][viewId]
  const base = cards.find(row => row.variante === 'base')
  const tornadoRows: any[] = results.tornado[scenarioId][viewId]
  const visibleTornado = showAllTornado ? tornadoRows : tornadoRows.slice(0, 6)
  const operations = results.operacionais[scenarioId]
  const variants: any[] = results.cartoes[scenarioId].concessionaria
  const grade: number[] = scenario.grade
  const baseStats = scenario.visoes[viewId].variantes.base.stats
  const priceData = grade.map((price, index) => ({
    price,
    p10: baseStats.p10[index],
    p50: baseStats.p50[index],
    p90: baseStats.p90[index],
    range: [baseStats.p10[index], baseStats.p90[index]],
  }))
  const priceValues = priceData.flatMap((point: any) => [point.p10, point.p90, 0])
  const pricePadding = (Math.max(...priceValues) - Math.min(...priceValues)) * 0.12 || 1
  const priceDomain: [number, number] = [
    Math.floor(Math.min(...priceValues) - pricePadding),
    Math.ceil(Math.max(...priceValues) + pricePadding),
  ]
  const gradeMin = grade[0]
  const gradeMax = grade[grade.length - 1]
  const equilibrium = base.eq_p50
  const negativeCount = base.p_vpl_pos === null ? null : Math.round((1 - base.p_vpl_pos) * 4000)
  const tornadoValues = tornadoRows.flatMap(row => [row.baixo, row.alto, row.base])
  const tornadoMin = Math.min(...tornadoValues)
  const tornadoMax = Math.max(...tornadoValues)
  const tornadoRange = tornadoMax - tornadoMin || 1
  const tornadoPosition = (value: number) => `${((value - tornadoMin) / tornadoRange) * 100}%`
  const binMax = Math.max(...bins.map((row: any) => row.n))
  const basePrice = scenario.precos.base / 1e6

  function backButton() {
    return <button
      type="button"
      onClick={onBack}
      className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-bold text-red-700 transition-colors hover:bg-red-50 hover:text-red-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
    >
      ← Voltar à calculadora
    </button>
  }

  return <section className="min-h-screen overflow-x-clip bg-slate-50 px-4 pb-16 pt-28 text-slate-950 sm:px-8">
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="space-y-3">
        {backButton()}
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-red-600">Metodologia estatística</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Simulações de Monte Carlo</h1>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">Como o modelo sorteia 30 anos de operação e o que sai das 4.000 simulações.</p>
        </div>
      </header>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Cenário">
          {(['urbano', 'campo', 'polo_eolico'] as ScenarioId[]).map(id => <button
            key={id}
            type="button"
            aria-pressed={scenarioId === id}
            onClick={() => setScenarioId(id)}
            className={`min-h-10 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${scenarioId === id ? 'border-red-600 bg-red-600 text-white' : 'border-gray-200 bg-white text-slate-700 hover:border-red-300 hover:text-red-700'}`}
          >
            {calculator.cenarios[id].nome}
          </button>)}
        </div>
        <div className="grid max-w-md grid-cols-2 rounded-lg bg-slate-100 p-1" role="group" aria-label="Quem avalia">
          <button type="button" aria-pressed={viewId === 'concessionaria'} onClick={() => setViewId('concessionaria')} className={`min-h-10 rounded-md px-3 text-sm font-semibold transition-colors ${viewId === 'concessionaria' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}>Transmissora</button>
          <button type="button" aria-pressed={viewId === 'sin'} onClick={() => setViewId('sin')} className={`min-h-10 rounded-md px-3 text-sm font-semibold transition-colors ${viewId === 'sin' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}>Sistema (SIN)</button>
        </div>
      </div>

      <Panel
        title="Como funciona"
        info={<InfoTip items={[
          { label: 'Números aleatórios comuns', text: 'A mesma sequência de sorteios serve às duas alternativas, a todas as variantes e a todos os preços do VSR. As diferenças vêm das mudanças testadas, não do acaso.' },
          { label: 'Cada trajetória', text: 'Sorteia as grandezas da tabela de distribuições e calcula, mês a mês, os custos do fixo e do VSR.' },
          { label: 'Precisão', text: 'No Campo (Transmissora), o desvio-padrão do VPL é R$ 4,34 mi: erro-padrão da média ≈ R$ 0,07 mi e da chance de compensar ≈ 0,3 ponto percentual.' },
          { label: 'Fonte', text: 'Seções 6.7 e 6.8 do PDF da metodologia.' },
        ]} />}
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ['4.000', 'simulações por cenário e visão'],
            ['360', 'meses (30 anos)'],
            ['Semente 11', 'mesmos sorteios para fixo e VSR'],
            ['≈ R$ 0,07 mi', 'erro-padrão do VPL médio (Campo)'],
          ].map(([value, label]) => <div key={value} className="min-w-0 rounded-lg bg-slate-50 px-3 py-3">
            <strong className="block text-lg font-black leading-6 text-slate-950 sm:text-xl">{value}</strong>
            <span className="mt-1 block text-xs leading-4 text-slate-600">{label}</span>
          </div>)}
        </div>
      </Panel>

      <Panel
        title="Distribuição do VPL"
        figure="3"
        info={<InfoTip items={[
          { label: 'Leitura', text: 'Cada barra conta as simulações numa faixa de VPL (30 classes; eixo vertical em escala log).' },
          { label: 'P10 / P50 / P90', text: '10%, 50% e 90% das simulações ficam abaixo desses valores.' },
          { label: 'Negativas', text: 'No Campo (Transmissora), as simulações negativas vêm de falhas graves do próprio VSR sem reserva (seção 7.3 do PDF).' },
        ]} />}
      >
        <p className="mb-2 text-xs font-medium text-slate-500">VPL (R$ mi) · eixo vertical em escala logarítmica</p>
        <ChartContainer config={{ count: { label: 'Simulações', color: '#334155' } }} className="h-[280px] w-full">
          <BarChart data={bins} margin={{ top: 24, right: 12, bottom: 8, left: 0 }}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="center" type="number" domain={['dataMin', 'dataMax']} tickFormatter={value => numberText(value)} tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis type="number" scale="log" domain={[1, 'auto']} allowDataOverflow width={42} tickFormatter={value => numberText(value)} tickLine={false} axisLine={false} />
            <ChartTooltip content={<HistogramTooltip />} />
            {base.vpl_p10 !== null && <ReferenceLine x={base.vpl_p10} stroke="#e60000" strokeDasharray="4 4" label={{ value: 'P10', position: 'insideTopLeft', fill: '#e60000', fontSize: 10 }} />}
            {base.vpl_p50 !== null && <ReferenceLine x={base.vpl_p50} stroke="#059669" strokeDasharray="4 4" label={{ value: 'P50', position: 'insideTopLeft', fill: '#059669', fontSize: 10 }} />}
            {base.vpl_p90 !== null && <ReferenceLine x={base.vpl_p90} stroke="#334155" strokeDasharray="4 4" label={{ value: 'P90', position: 'insideTopLeft', fill: '#334155', fontSize: 10 }} />}
            <Bar dataKey="n" isAnimationActive={false} radius={[2, 2, 0, 0]}>
              {bins.map((row: any, index: number) => <Cell key={`bin-${index}`} fill={row.de < 0 ? '#e60000' : '#334155'} />)}
            </Bar>
          </BarChart>
        </ChartContainer>
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-3 text-sm font-semibold leading-5 text-slate-800">
          {negativeCount === null ? '—' : numberText(negativeCount)} de 4.000 simulações com VPL negativo ({base.p_vpl_pos === null ? '—' : percentage(1 - base.p_vpl_pos, 1)})
        </p>
      </Panel>

      <Panel
        title="VPL em função do preço do VSR"
        figure="4"
        info={<InfoTip items={[
          { label: 'Faixa', text: 'A área vai do P10 ao P90 e a linha é a mediana.' },
          { label: 'Preço de equilíbrio', text: 'Preço do VSR em que o VPL mediano chega a zero.' },
        ]} />}
      >
        <ChartContainer config={{ median: { label: 'VPL mediano', color: '#059669' }, range: { label: 'P10–P90', color: '#a7f3d0' } }} className="h-[280px] w-full">
          <ComposedChart data={priceData} margin={{ top: 28, right: 12, bottom: 8, left: 0 }}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <ReferenceArea x1={scenario.precos.baixo / 1e6} x2={scenario.precos.alto / 1e6} y1={priceDomain[0]} y2={priceDomain[1]} fill="#059669" fillOpacity={0.08} stroke="none" />
            <ReferenceArea x1={scenario.precos.estresse_baixo / 1e6} x2={scenario.precos.estresse_alto / 1e6} y1={priceDomain[0]} y2={priceDomain[1]} fill="#e60000" fillOpacity={0.07} stroke="none" />
            <XAxis dataKey="price" type="number" domain={[gradeMin, gradeMax]} tickFormatter={value => numberText(value)} tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis domain={priceDomain} tickFormatter={value => numberText(value)} tickLine={false} axisLine={false} width={42} />
            <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
            <ChartTooltip content={<PriceTooltip />} />
            <Area dataKey="range" type="monotone" stroke="none" fill="#a7f3d0" fillOpacity={0.6} isAnimationActive={false} />
            <ReferenceLine x={basePrice} stroke="#020618" strokeDasharray="4 4" strokeWidth={1} label={{ value: 'Preço-base', position: 'insideTopRight', fill: '#020618', fontSize: 10 }} />
            {equilibrium !== null && equilibrium >= gradeMin && equilibrium <= gradeMax && <ReferenceDot x={equilibrium} y={0} r={5} fill="#020618" stroke="#fff" strokeWidth={2} />}
            <Line dataKey="p50" type="monotone" stroke="#059669" strokeWidth={2.5} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ChartContainer>
        <p className="mt-3 text-sm font-semibold text-slate-800">Preço de equilíbrio (P50): <span className="text-red-700">{equilibrium === null ? 'fora da faixa simulada' : mi(equilibrium, 2)}</span></p>
      </Panel>

      <Panel
        title="O que mais pesa no resultado"
        figure="5"
        info={<InfoTip items={[
          { label: 'Como ler', text: 'Cada barra mostra o VPL médio com uma variável no extremo baixo e no alto da faixa e o resto no caso-base. A linha é o VPL médio do caso-base.' },
          { label: 'Destaque', text: 'No Campo, preço do VSR, fase reserva do fixo e tipo de comutador pesam muito mais que as taxas de falha (seção 7.4 do PDF).' },
        ]} />}
      >
        <div className="space-y-4">
          {visibleTornado.map((row: any) => {
            const smaller = Math.min(row.baixo, row.alto)
            const larger = Math.max(row.baixo, row.alto)
            const redLeft = ((Math.min(row.base, smaller) - tornadoMin) / tornadoRange) * 100
            const greenLeft = ((Math.min(row.base, larger) - tornadoMin) / tornadoRange) * 100
            const redWidth = Math.abs(((row.base - smaller) / tornadoRange) * 100)
            const greenWidth = Math.abs(((larger - row.base) / tornadoRange) * 100)
            return <div key={row.variavel} className="space-y-1.5">
              <p className="break-words text-xs font-semibold leading-4 text-slate-700">{row.variavel}</p>
              <div className="relative h-3 overflow-hidden rounded-full bg-slate-100" aria-label={`${row.variavel}: ${signedMi(row.baixo)} a ${signedMi(row.alto)}`}>
                <span className="absolute inset-y-0 rounded-l-full bg-red-600" style={{ left: `${redLeft}%`, width: `${redWidth}%` }} />
                <span className="absolute inset-y-0 rounded-r-full bg-emerald-600" style={{ left: `${greenLeft}%`, width: `${greenWidth}%` }} />
                <span className="absolute -top-1 bottom-[-4px] w-px bg-slate-950" style={{ left: tornadoPosition(row.base) }} />
              </div>
              <p className="text-[11px] leading-4 tabular-nums text-slate-500">{signedMi(row.baixo)} · {signedMi(row.alto)}</p>
            </div>
          })}
        </div>
        {tornadoRows.length > 6 && <button
          type="button"
          aria-expanded={showAllTornado}
          onClick={() => setShowAllTornado(value => !value)}
          className="mt-4 inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-xs font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
        >
          {showAllTornado ? 'Mostrar menos' : `Ver todas (${tornadoRows.length})`}
          {showAllTornado ? <ChevronUp aria-hidden="true" size={16} /> : <ChevronDown aria-hidden="true" size={16} />}
        </button>}
      </Panel>

      <Panel
        title="Resultados das simulações"
        info={<InfoTip text="VPL mediano e chance de VPL positivo para cada premissa alternativa, no preço-base do VSR (Tabela 15 do PDF)." />}
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label="VPL P10 · P50 · P90">
            {mi(base.vpl_p10, 2)} · {mi(base.vpl_p50, 2)} · {mi(base.vpl_p90, 2)}
          </Metric>
          <Metric label="VPL médio">{mi(base.vpl_media, 2)}</Metric>
          <Metric label="Chance de compensar">{percentage(base.p_vpl_pos, 1)}</Metric>
          <Metric label="Payback imediato">{percentage(base.pct_payback_imediato, 1)}</Metric>
          <Metric label="Sem payback em 30 anos">{percentage(base.pct_sem_payback, 1)}</Metric>
          <Metric label="Preço do VSR">{mi(base.preco_vsr, 2)}</Metric>
          <Metric label="Preço de equilíbrio P10 · P50 · P90">
            {mi(base.eq_p10, 2)} · {mi(base.eq_p50, 2)} · {mi(base.eq_p90, 2)}
          </Metric>
        </div>

        <div className="mt-5 border-t border-gray-100 pt-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900">Variantes no preço-base do VSR</h3>
          {viewId === 'concessionaria' ? <>
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 px-3 pb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <span>Premissa</span><span className="text-right">VPL mediano</span><span className="text-right">Chance</span>
            </div>
            <ul className="divide-y divide-gray-100">
              {variants.map((row: any) => <li key={row.variante} className={`grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 px-3 py-2 text-xs sm:text-sm ${row.variante === 'base' ? 'rounded-md bg-red-50' : ''}`}>
                <span className="min-w-0 break-words font-medium text-slate-700">{row.variante}</span>
                <span className={`whitespace-nowrap text-right font-bold tabular-nums ${row.vpl_p50 !== null && row.vpl_p50 < 0 ? 'text-red-600' : 'text-slate-950'}`}>{mi(row.vpl_p50, 2)}</span>
                <span className="whitespace-nowrap text-right tabular-nums text-slate-700">{percentage(row.p_vpl_pos, 1)}</span>
              </li>)}
            </ul>
          </> : <p className="rounded-lg bg-slate-50 px-3 py-3 text-sm leading-5 text-slate-600">As variantes foram simuladas só na visão da transmissora.</p>}
        </div>
      </Panel>

      <Panel
        title="Operação nas simulações"
        info={<InfoTip text="Medianas das 4.000 simulações. O disjuntor do VSR não chega ao fim da vida mecânica em 30 anos (seção 7.5 do PDF)." />}
      >
        <div className="space-y-0 text-xs sm:text-sm">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(74px,.7fr)_minmax(74px,.7fr)] gap-x-2 pb-2 sm:grid-cols-[minmax(0,1fr)_minmax(100px,.7fr)_minmax(100px,.7fr)]">
            <span className="font-semibold text-slate-500">Indicador</span>
            <span className="text-right font-semibold text-slate-700">Fixo</span>
            <span className="text-right font-semibold text-slate-700">VSR</span>
          </div>
          {[
            ['Manobras por ano', numberText(operations.ops_fixo_ano), numberText(operations.ops_vsr_ano)],
            ['Anos até a revisão geral', `${numberText(operations.anos_ate_revisao_fixo, 1)} anos`, `${numberText(operations.anos_ate_revisao_vsr, 1)} anos`],
            ['Anos até a troca do disjuntor', operations.anos_ate_troca_fixo >= 30 ? 'não troca em 30 anos' : `${numberText(operations.anos_ate_troca_fixo, 1)} anos`, operations.anos_ate_troca_vsr >= 30 ? 'não troca em 30 anos' : `${numberText(operations.anos_ate_troca_vsr, 1)} anos`],
            ['Falhas maiores do disjuntor em 30 anos', numberText(operations.falhas_maiores_disj_fixo_30a, 2), numberText(operations.falhas_maiores_disj_vsr_30a, 2)],
            ['Operações de tap por ano', '—', numberText(operations.taps_vsr_ano)],
            ['Anos entre manutenções do comutador', '—', `${numberText(operations.anos_entre_manut_oltc, 1)} anos`],
          ].map(([label, fixed, vsr]) => <div key={label} className="grid grid-cols-[minmax(0,1fr)_minmax(74px,.7fr)_minmax(74px,.7fr)] items-start gap-x-2 border-t border-gray-100 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(100px,.7fr)_minmax(100px,.7fr)]">
            <span className="min-w-0 break-words leading-4 text-slate-700">{label}</span>
            <span className="break-words text-right leading-4 tabular-nums text-slate-950">{fixed}</span>
            <span className="break-words text-right leading-4 tabular-nums text-slate-950">{vsr}</span>
          </div>)}
        </div>
      </Panel>

      <Panel title="O que é sorteado">
        <button
          type="button"
          aria-expanded={showDistributions}
          aria-controls="distributions-list"
          onClick={() => setShowDistributions(value => !value)}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:border-red-300 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
        >
          {showDistributions ? 'Ocultar distribuições' : `Ver distribuições (${results.distribuicoes.length})`}
          {showDistributions ? <ChevronUp aria-hidden="true" size={16} /> : <ChevronDown aria-hidden="true" size={16} />}
        </button>
        {showDistributions && <div id="distributions-list" className="mt-3 divide-y divide-gray-100">
          {results.distribuicoes.map((row: any) => <article key={row.grandeza} className="py-3 first:pt-1 last:pb-1">
            <h3 className="text-sm font-bold leading-5 text-slate-900">{row.grandeza}</h3>
            <p className="mt-1 text-sm leading-5 text-slate-700">{row.distribuicao}</p>
            <p className="mt-1 text-xs text-slate-500">{row.fonte}</p>
          </article>)}
        </div>}
        <p className="mt-3 text-xs leading-5 text-slate-500">Tri(a; b; c): triangular (mínimo; moda; máximo). U(a; b): uniforme.</p>
      </Panel>

      <div className="flex justify-center pt-1">{backButton()}</div>
    </div>
  </section>
}
