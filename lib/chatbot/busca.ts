export type Trecho = {
  id: string
  titulo: string
  fonte: string
  texto: string
}

const stopwords = new Set([
  'ainda', 'algo', 'algum', 'alguma', 'algumas', 'alguns', 'aos', 'ate', 'bem',
  'cada', 'certo', 'certa', 'coisa', 'coisas', 'como', 'com', 'da', 'das',
  'dele', 'dela', 'deles', 'delas', 'depois', 'desde', 'dessa', 'desse',
  'disto', 'do', 'dos', 'ela', 'elas', 'ele', 'eles', 'entre', 'essa', 'esse',
  'esta', 'estao', 'estas', 'este', 'estes', 'isso', 'isto', 'mais', 'mas',
  'mesmo', 'muito', 'muitos', 'muita', 'muitas', 'na', 'nas', 'nem', 'nos',
  'nossa', 'nosso', 'num', 'numa', 'onde', 'para', 'pela', 'pelas', 'pelo',
  'pelos', 'por', 'porque', 'qual', 'quando', 'quais', 'que', 'quem', 'sao',
  'seja', 'sem', 'ser',
  'seu', 'seus', 'sua', 'suas', 'tambem', 'tem', 'tendo', 'toda', 'todas',
  'todo', 'todos', 'uma', 'umas', 'uns', 'voce',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(token => token.length >= 3 && !stopwords.has(token))
    .map(token => {
      if (token.endsWith('oes') && token.length > 4) return `${token.slice(0, -3)}ao`
      if (token.endsWith('ais') && token.length > 4) return `${token.slice(0, -3)}al`
      if (token.endsWith('es') && token.length > 4) return token.slice(0, -2)
      if (token.endsWith('s') && token.length > 3) return token.slice(0, -1)
      return token
    })
}

export function buscar(pergunta: string, base: Trecho[], k = 6): Trecho[] {
  const queryTokens = [...new Set(tokenize(pergunta))]
  if (!queryTokens.length || !base.length || !Number.isFinite(k) || k <= 0) return []

  const documents = base.map(trecho => {
    const titleTokens = tokenize(trecho.titulo)
    const tokens = [...titleTokens, ...titleTokens, ...tokenize(trecho.texto)]
    return { trecho, tokens, frequencies: new Map<string, number>() }
  })
  const documentFrequency = new Map<string, number>()

  for (const document of documents) {
    for (const token of document.tokens) {
      document.frequencies.set(token, (document.frequencies.get(token) ?? 0) + 1)
    }
    for (const token of document.frequencies.keys()) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1)
    }
  }

  const averageLength = documents.reduce((sum, document) => sum + document.tokens.length, 0) / documents.length || 1
  const scored = documents.map((document, index) => {
    let score = 0
    for (const token of queryTokens) {
      const frequency = document.frequencies.get(token) ?? 0
      if (!frequency) continue
      const frequencyInCorpus = documentFrequency.get(token) ?? 0
      const inverseFrequency = Math.log(
        1 + (documents.length - frequencyInCorpus + 0.5) / (frequencyInCorpus + 0.5),
      )
      const lengthNormalization = 1.2 * (1 - 0.75 + 0.75 * document.tokens.length / averageLength)
      score += inverseFrequency * (frequency * 2.2) / (frequency + lengthNormalization)
    }
    return { trecho: document.trecho, score, index }
  })
    .filter(item => item.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)

  const results: Trecho[] = []
  let totalTextLength = 0
  for (const item of scored) {
    if (results.length >= Math.floor(k)) break
    if (totalTextLength + item.trecho.texto.length > 7000) continue
    results.push(item.trecho)
    totalTextLength += item.trecho.texto.length
  }
  return results
}

export function formatarContexto(trechos: Trecho[]): string {
  if (!trechos.length) return '(nenhum trecho encontrado)'
  return trechos
    .map(trecho => `[${trecho.titulo} — ${trecho.fonte}]\n${trecho.texto}`)
    .join('\n\n')
}
