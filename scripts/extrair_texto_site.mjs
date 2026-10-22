import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = resolve(repoRoot, 'lib/chatbot/site.md')
const baseUrl = process.argv[2] || process.env.SITE_URL || 'http://127.0.0.1:3000'
const sections = []

function normalizeText(value) {
  return String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map(paragraph => paragraph
      .split('\n')
      .map(line => line.replace(/\s+/g, ' ').replace(/\s*\(i\)\s*/gi, ' ').trim())
      .filter(Boolean)
      .join(' '))
    .filter(Boolean)
    .join('\n\n')
}

function joinTexts(values) {
  const seen = new Set()
  return values
    .map(normalizeText)
    .filter(text => {
      if (!text || seen.has(text)) return false
      seen.add(text)
      return true
    })
    .join('\n\n')
}

function addSection(title, value) {
  const text = normalizeText(value)
  if (!text) return
  sections.push(`## ${title}\n\n${text}`)
  console.log(`${title}: ${text.length} caracteres`)
}

async function getTexts(page, selector) {
  const texts = await page.locator(selector).evaluateAll(elements =>
    elements.map(element => element.innerText || ''),
  )
  return texts.map(normalizeText).filter(Boolean)
}

async function collectPopovers(page, selector, scenario) {
  const buttons = await page.locator(selector).evaluateAll(elements =>
    elements.map(button => ({
      label: button.getAttribute('aria-label') || 'Informação',
      target: button.getAttribute('aria-controls'),
      panel: button.closest('.pane')?.id || '',
    })),
  )

  for (const { label, target, panel } of buttons) {
    if (!target) continue
    const button = page.locator(`button[aria-controls="${target}"]`).first()
    if (!(await button.isVisible())) continue
    await button.click()
    const text = await page.locator(`#${target}`).innerText().catch(() => '')
    await button.click()
    const normalized = normalizeText(text)
    if (normalized) {
      const panelName = panel ? `${panel.replace('pane-', '')} — ` : ''
      addSection(`Calculadora — ${panelName}${label} (${scenario})`, normalized)
    }
  }
}

async function extractHome(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
  try {
    await page.goto(new URL('/', baseUrl).href, { waitUntil: 'networkidle' })
    await page.locator('#about-project').waitFor()

    const hero = page.locator('main > section').first()
    addSection('Página inicial — destaque', joinTexts(await hero.locator('p, h1, h2, h3').evaluateAll(elements =>
      elements.map(element => element.innerText || ''),
    )))

    addSection('Quem somos — O projeto PoliVSR', joinTexts(
      await getTexts(page, '#about-project p, #about-project h2, #about-project h3'),
    ))

    const vsrHeading = page.getByRole('heading', {
      name: 'O que é o VSR e por que investigamos esta alternativa?',
      exact: true,
    })
    addSection(
      'O que é o VSR e por que investigamos esta alternativa?',
      await vsrHeading.locator('xpath=..').innerText(),
    )

    const roadmap = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Roadmap', exact: true }),
    }).first()
    const phases = await roadmap.locator('article').evaluateAll(cards => cards.map(card => {
      const phaseLabel = Array.from(card.querySelectorAll('p'))
        .find(paragraph => /^Fase\s+\d+/i.test(paragraph.innerText.trim()))
        ?.innerText.trim() || ''
      const phaseNumber = phaseLabel.match(/\d+/)?.[0] || ''
      const title = card.querySelector('h3')?.innerText.trim() || ''
      const description = card.querySelector('h3')?.nextElementSibling?.innerText.trim() || ''
      const status = card.querySelector('div.mb-4')?.innerText.trim() || ''
      const result = card.querySelector('footer')?.innerText.trim() || ''
      return { phaseNumber, title, status, description, result }
    }))

    addSection(
      'Roadmap – visão geral (todas as fases)',
      phases.map(phase => {
        const result = phase.result.replace(/^Resultado:\s*/i, '').trim()
        return `Fase ${phase.phaseNumber}: ${phase.title} — ${phase.status}. Resultado: ${result}`
      }).join('\n\n'),
    )

    for (const phase of phases) {
      addSection(
        `Roadmap – Fase ${phase.phaseNumber}: ${phase.title}`,
        joinTexts([phase.status, phase.description, phase.result]),
      )
    }

    const cronograma = page.locator('[aria-label^="Cronograma das fases"]')
    const timeline = await cronograma.evaluate(element => {
      const title = element.querySelector('h3')?.innerText.trim() || 'Cronograma'
      const rows = Array.from(element.querySelectorAll('div.relative.h-3')).map(bar => {
        const row = bar.parentElement
        const label = row?.querySelector('span')?.innerText.trim() || ''
        const fill = bar.querySelector('span[style*="width"]')
        const start = Number.parseFloat(fill?.style.left || '0')
        const width = Number.parseFloat(fill?.style.width || '0')
        const startMonth = Math.round(start * 0.6)
        const endMonth = Math.round((start + width) * 0.6)
        const duration = label.split('·').slice(1).join('·').trim()
        const phaseNumber = label.match(/^F(\d+)/i)?.[1]
        return `Fase ${phaseNumber || label} dura ${duration}; período previsto ${startMonth}–${endMonth} meses`
      })
      const next = Array.from(element.querySelectorAll('span')).find(span => span.innerText.trim() === 'Próxima')
      return [title, next?.innerText.trim(), ...rows].filter(Boolean)
    })
    addSection('Cronograma', joinTexts(timeline))
  } finally {
    await page.close()
  }
}

async function extractCalculator(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  try {
    await page.goto(new URL('/calculadora/o-custo-do-fixo.html', baseUrl).href, {
      waitUntil: 'networkidle',
    })
    await page.locator('#dados').waitFor({ state: 'attached' })

    const title = await getTexts(page, '.page-head .h1-main, .page-head .h1-sub')
    addSection('Calculadora — O Custo do Fixo', joinTexts(title))

    const scenarios = await page.locator('#dados').evaluate(element => {
      const data = JSON.parse(element.textContent || '{}')
      return Object.values(data.cenarios || {}).map(scenario =>
        `${scenario.nome}: ${scenario.base}`,
      )
    })
    addSection('Calculadora — Cenários operacionais', joinTexts(scenarios))

    const originalPremissa = await page.locator('#premissa').inputValue()
    const options = await page.locator('#premissa option').evaluateAll(elements =>
      elements.map(option => ({ value: option.value, label: option.innerText.trim() })),
    )
    const premiseInfo = page.locator('button[aria-controls="premissa-help"]')
    if (await page.locator('#premissa-help').getAttribute('hidden') !== null) {
      await premiseInfo.click()
    }
    const premiseTexts = []
    for (const option of options) {
      await page.locator('#premissa').selectOption(option.value)
      const explanation = await page.locator('#premissa-help').innerText()
      premiseTexts.push(`${option.label}: ${explanation}`)
    }
    if (originalPremissa) await page.locator('#premissa').selectOption(originalPremissa)
    if (await premiseInfo.getAttribute('aria-expanded') === 'true') await premiseInfo.click()
    addSection('Calculadora — Premissas e explicações', joinTexts(premiseTexts))

    const scenario = await page.locator('#dados').evaluate(element => {
      const data = JSON.parse(element.textContent || '{}')
      return data.cenarios?.campo?.nome || 'Campo'
    })
    const generalPopovers = await page.locator('.info-btn').evaluateAll(elements =>
      elements.filter(button => !button.closest('.pane')).length,
    )
    if (generalPopovers) {
      await collectPopovers(page, '.info-btn:not(.pane .info-btn)', scenario)
    }

    const tabs = await page.locator('[role="tab"]').evaluateAll(elements =>
      elements.map(button => ({ id: button.id, label: button.innerText.trim() })),
    )
    for (const tab of tabs) {
      await page.locator(`#${tab.id}`).click()
      await collectPopovers(page, `#pane-${tab.id.replace('tab-', '')} .info-btn`, scenario)
    }

    addSection('Calculadora — Nota técnica', await page.locator('section.tech > .wrap > p').innerText())

    await page.locator('#btn-method').click()
    const method = await page.locator('#method').evaluate(element => {
      const copy = element.cloneNode(true)
      const download = copy.querySelector('.method-download')
      const downloadLabel = download?.innerText.trim() || ''
      download?.remove()
      const parts = Array.from(copy.querySelectorAll('h2, h3, h4, p, li, table')).map(node => {
        if (node.tagName === 'TABLE') {
          return Array.from(node.querySelectorAll('tr'))
            .map(row => Array.from(row.querySelectorAll('th, td'))
              .map(cell => cell.innerText.trim())
              .filter(Boolean)
              .join(' | '))
            .filter(Boolean)
            .join('\n')
        }
        return node.innerText.trim()
      })
      return { downloadLabel, text: parts.filter(Boolean).join('\n\n') }
    })
    addSection(
      'Calculadora — Ver metodologia e fontes',
      joinTexts([
        `O PDF pode ser baixado neste painel pelo link "${method.downloadLabel}".`,
        method.text,
      ]),
    )
  } finally {
    await page.close()
  }
}

async function extractMonteCarlo(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  try {
    await page.goto(new URL('/calculadora/monte-carlo.html', baseUrl).href, {
      waitUntil: 'networkidle',
    })
    await page.locator('#como-title').waitFor()

    addSection('Monte Carlo — Apresentação', joinTexts(
      await getTexts(page, 'header.head p, header.head h1'),
    ))
    addSection('Monte Carlo — Como cada simulação funciona', joinTexts(
      await getTexts(page, '#como-title, #como-title + div h3, #como-title + div p'),
    ))

    const resultTitle = await page.locator('#res-title').innerText()
    const resultHeading = await page.locator('#hi-sub').evaluate(element =>
      element.parentElement?.querySelector('h3')?.innerText || '',
    )
    const scenarios = await page.locator('#seg button').evaluateAll(elements =>
      elements.map(button => button.innerText.trim()),
    )
    for (const scenarioName of scenarios) {
      await page.locator('#seg button').filter({ hasText: scenarioName }).click()
      const note = await page.locator('#scen-note').innerText()
      addSection(
        `Monte Carlo — ${resultTitle} — ${scenarioName}`,
        joinTexts([resultHeading, note]),
      )
    }

    addSection('Monte Carlo — O que é sorteado mês a mês', joinTexts(
      await getTexts(page, '#ev-title, #ev-title + p, #evlist h4, #evlist p'),
    ))
    addSection('Monte Carlo — O que muda de uma simulação para outra', joinTexts(
      await getTexts(page, [
        '#par-title',
        '#par-title + p',
        '.kinds span',
        '#groups .grp h3',
        '#groups .grp .gnote',
        '#groups .prow .nm',
        '#groups .prow .mt',
        '#groups .prow .rg',
      ].join(', ')),
    ))

    await page.locator('details.tech').evaluate(element => { element.open = true })
    addSection('Monte Carlo — Detalhes técnicos e o que não é sorteado', joinTexts(
      await getTexts(page, 'details.tech summary, details.tech #tech li, details.tech h3, details.tech .fixed h4, details.tech .fixed li'),
    ))
  } finally {
    await page.close()
  }
}

async function main() {
  const launchOptions = { headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] }
  const chromePath = process.env.CHROME_PATH || '/home/ubuntu/.local/bin/google-chrome'
  if (existsSync(chromePath)) launchOptions.executablePath = chromePath
  const browser = await chromium.launch(launchOptions)
  try {
    await extractHome(browser)
    await extractCalculator(browser)
    await extractMonteCarlo(browser)
    await writeFile(outputPath, `${sections.join('\n\n')}\n`, 'utf8')
    console.log(`Site extraído em ${outputPath}: ${sections.length} seções`)
  } finally {
    await browser.close()
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
