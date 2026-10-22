## Página inicial — destaque

POLIVSR · PESQUISA APLICADA

A curva é a carga líquida média do SIN no verão de 2025–26 (ONS). O contador é uma estimativa: o ONS prevê cerca de 140 reatores chaveados num dia útil de verão de 2026, cada um entrando e saindo ao menos uma vez (≈ 280 manobras), distribuídas pelas horas conforme a carga líquida sobe ou desce.

## Quem somos — O projeto PoliVSR

O PROJETO POLIVSR

Da pesquisa aplicada à rede do futuro.

Quem somos

Somos o PoliVSR, um núcleo de Inteligência de Rede formado por pesquisadores da Poli-USP, viabilizado por fomento à pesquisa da Hitachi Energy. Atuamos na validação técnica e econômica independente para os novos desafios do Sistema Interligado Nacional (SIN). Com a expansão das linhas e o crescimento das renováveis intermitentes, a demanda flutua drasticamente e a tensão se eleva em cargas leves. O PoliVSR investiga e quantifica em quais cenários a adoção de tecnologias de ajuste contínuo (VSR) traz viabilidade financeira e resiliência à rede, substituindo a rigidez operacional atual.

## O que é o VSR e por que investigamos esta alternativa?

O que é o VSR e por que investigamos esta alternativa?

Hoje, a rede utiliza amplamente reatores fixos que operam em estados binários (ligado/desligado). Para controlar a tensão em cenários voláteis, realizam-se manobras de disjuntor que, ao longo do tempo, geram desgaste mecânico e elétrico. O Variable Shunt Reactor (VSR) atua de forma dinâmica lenta, semelhante a um dimmer. Equipado com um comutador sob carga (OLTC), ele altera o número de espiras ativas em pequenos degraus automáticos, ajustando a absorção de potência reativa sem desconectar o ativo. Nosso estudo propõe avaliar como essa estabilidade se converte em economia frente a outras alternativas.

## Roadmap – visão geral (todas as fases)

Fase 0: Base e modelo — Concluída. Resultado: Comparação entre VSR e reator fixo com dados públicos.

Fase 1: Mapa de oportunidades — Próxima (previsão de 0 a 6 meses). Resultado: Lista das subestações onde um VSR tende a sair mais barato.

Fase 2: Medição com transmissoras — Planejada (previsão de cerca de 1 ano). Resultado: Calculadora calibrada com a operação real e plano de troca preventiva.

Fase 3: Estudo de caso real — Planejada. Resultado: Decisão técnica e econômica para uma obra concreta.

Fase 4: Piloto em campo — Planejada. Resultado: Os primeiros dados de VSR em operação na rede brasileira.

Fase 5: Regras e referências de preço — Planejada. Resultado: Permitir que transmissoras escolham o VSR quando for a opção mais barata.

## Roadmap – Fase 0: Base e modelo

Concluída

Base de dados com 92 arquivos públicos do ONS, ANEEL e BC; modelo físico e financeiro (Monte Carlo). Calculadora “O Custo do Fixo” criada no Hackathon Hitachi Energy 2026.

Resultado: Comparação entre VSR e reator fixo com dados públicos.

## Roadmap – Fase 1: Mapa de oportunidades

Próxima (previsão de 0 a 6 meses)

Aplicar a calculadora aos reatores novos previstos nos planos do ONS (PAR/PEL) e nos próximos leilões de transmissão.

Resultado: Lista das subestações onde um VSR tende a sair mais barato.

## Roadmap – Fase 2: Medição com transmissoras

Planejada (previsão de cerca de 1 ano)

Projeto de P&D com uma transmissora (programa ANEEL), usando dados reais de manobras, desgaste de disjuntores e histórico de falhas.

Resultado: Calculadora calibrada com a operação real e plano de troca preventiva.

## Roadmap – Fase 3: Estudo de caso real

Planejada

Escolher uma ou duas subestações do plano de expansão da transmissora parceira e comparar em detalhe o VSR e o reator fixo no local.

Resultado: Decisão técnica e econômica para uma obra concreta.

## Roadmap – Fase 4: Piloto em campo

Planejada

Instalar um VSR em uma dessas subestações e acompanhar o funcionamento por um a dois anos.

Resultado: Os primeiros dados de VSR em operação na rede brasileira.

## Roadmap – Fase 5: Regras e referências de preço

Planejada

Com os resultados, propor a inclusão do VSR na tabela de preços de referência da ANEEL e nos estudos de leilões.

Resultado: Permitir que transmissoras escolham o VSR quando for a opção mais barata.

## Cronograma

Cronograma

Próxima

Fase 1 dura 6 meses; período previsto 0–6 meses

Fase 2 dura ~1 ano; período previsto 6–18 meses

Fase 3 dura 6 meses; período previsto 18–24 meses

Fase 4 dura 2 anos; período previsto 24–48 meses

Fase 5 dura 1 ano; período previsto 48–60 meses

## Calculadora — O Custo do Fixo

O Custo do Fixo

Simulador Estatístico do VSR

## Calculadora — Cenários operacionais

Centro Urbano: Base: Salvador, Recife, Fortaleza · 230 kV

Campo: Base: Interligação N–NE · 500 kV

Polo eólico: Base: carga líquida do Nordeste · 500 kV

## Calculadora — Premissas e explicações

Premissas-base: Leilão; fixo de 500 kV com fase reserva por banco (padrão EPE); OLTC a vácuo; VSR sem reserva própria.

Reforço com RAP pelo BPR: Reforço autorizado: a RAP vem do Banco de Preços da ANEEL, então a receita do vão que deixa de existir também sai.

Prêmio reconhecido na RAP: Cenário otimista: o prêmio do VSR é remunerado na RAP.

Reserva do VSR em pool de 1 para 10: Uma unidade reserva para cada 10 VSR, como a BPA faz com reatores de 500 kV.

Reserva do VSR de 1 para 3: Uma unidade reserva para cada 3 VSR, com reparo em 30 dias.

Fase reserva compartilhada pelos 2 bancos: Uma fase reserva compartilhada pelos dois bancos fixos, em vez de uma por banco.

Fixo sem fase reserva: Banco fixo sem fase reserva: sem esse custo, mas também sem a franquia de 3 h na falha.

OLTC a óleo (teste de estresse): Teste de estresse: OLTC a óleo, com manutenção a cada ~1 ano. O padrão de mercado para VSR é vácuo.

## Calculadora — Sobre o modelo (Campo)

Modelo PoliVSR · 4.000 simulações de Monte Carlo por cenário · fluxos mensais em 30 anos · R$ de set/2026

## Calculadora — O que é a curva de cada cenário (Campo)

A curva de cada cartão é a carga (ou o fluxo) que move o cenário num dia típico. No Centro Urbano é a curva de pato: cai ao meio-dia com a geração solar e sobe à noite. Quanto mais baixa a curva, mais folgadas ficam as linhas e mais reator a subestação precisa ligado.

## Calculadora — Sobre quem avalia (Campo)

Fluxo de caixa da transmissora a 12,11% a.a. real, antes de impostos, com Parcela Variável.

## Calculadora — Sobre o preço do VSR (Campo)

Só o equipamento, sem o vão. Vem de contratos europeus de 2025–26 (sem frete e impostos no Brasil), escalados para 300 Mvar e 500 kV. Prêmio de +58% sobre os dois reatores fixos que ele substitui (R$ 27,0 mi).

## Calculadora — Sobre o preço do reator fixo (Campo)

Só o equipamento: banco de 150 Mvar (3 unidades monofásicas de 50 Mvar), sem a fase reserva e sem o vão. Referência: EPE-DEE-NT-077/2021 (base de preços da ANEEL de mar/2021) corrigida pelo IPCA. No preço de referência.

## Calculadora — Sobre a premissa escolhida (Campo)

Leilão; fixo de 500 kV com fase reserva por banco (padrão EPE); OLTC a vácuo; VSR sem reserva própria.

## Calculadora — Sobre o investimento e a unidade comparada (Campo)

Unidade comparada: 1 VSR de 150–300 Mvar no lugar de 2 bancos fixos de 150 Mvar, cada um com seu vão (arranjo 2:1, 500 kV).

Vão de manobra: módulo de conexão de reator (disjuntor, seccionadoras, transformadores de medição, para-raios, proteção, estruturas e obras civis), EPE 2021 corrigido pelo IPCA, igual nas duas alternativas. Fixo e vão são referências regulatórias brasileiras; o VSR vem de contratos europeus. Os escopos podem não ser idênticos.

## Calculadora — O que é o VPL (Campo)

Diferença de custo entre os reatores fixos e o VSR em 30 anos, trazida a valor presente (VPL). Positivo: o VSR sai mais barato. O número grande é a mediana de 4.000 simulações; P10 e P90 são os casos pessimista e otimista.

## Calculadora — Sobre o preço de equilíbrio (Campo)

Com cada reator fixo a R$ 13,5 mi. Contratos públicos de 2025–26: R$ 37,1 mi a R$ 50,1 mi (escalados para este VSR).

## Calculadora — Como ler os indicadores (Campo)

Payback: mês em que a economia acumulada do VSR passa a ser positiva (mediana das simulações). Manobras evitadas: manobras por ano do disjuntor do reator fixo manobrável que deixam de acontecer. Troca do disjuntor: o do fixo chega ao fim da vida mecânica em cerca de 11 anos; o do VSR quase não manobra e não precisa ser trocado em 30 anos. Vão evitado: módulo de conexão de reator (disjuntor, seccionadoras, transformadores de medição, para-raios, proteção, estruturas e obras civis).

## Calculadora — risco — Como ler este gráfico (Campo)

Custo acumulado de cada alternativa, em valor presente, ao longo de 30 anos. A linha é a mediana das 4.000 simulações e a faixa vai do P10 ao P90. Quanto mais baixa a curva, mais barata a alternativa.

## Calculadora — preco — Como ler este gráfico (Campo)

VPL do VSR em função do preço dele, com o reator fixo no preço escolhido. Acima de zero, o VSR compensa. O ponto preto marca o preço de equilíbrio; a linha vertical, o preço simulado.

## Calculadora — operacao — Como ler este gráfico (Campo)

Dia típico (06/08/2025), subestação de 500 kV. Linha escura: Fluxo Norte–Nordeste (módulo do fluxo verificado na interligação (ONS)). Aqui não há curva de pato: o que move o cenário é o fluxo na interligação. Quando a curva desce, as linhas ficam folgadas, sobra energia reativa e é preciso ligar reator. O eixo da direita mostra o reator ligado: no alto, 150 Mvar (só o reator permanente, ou o VSR no mínimo); embaixo, 300 Mvar (os 2 reatores, ou o VSR no máximo). Essa escala não é linear: ela põe o reator na altura da carga que o exige, e a sobra de reativo da linha depende do quadrado da carga. O VSR acompanha a curva em passos de 1/32 da faixa (86 trocas de tap nesse dia); o reator fixo só liga ou desliga inteiro (2 manobras). Dos 2 fixos, um fica sempre ligado e não aparece. No Campo, o modelo representa o corredor com 6 bancos (11 manobras nesse dia); aqui aparece um deles. Dados a cada hora.

## Calculadora — valor — Como ler este gráfico (Campo)

Valor presente médio de cada parcela da comparação, nos preços escolhidos. Verde é a favor do VSR, vermelho é contra. A soma das parcelas é o VPL médio.

## Calculadora — Nota técnica

Nota técnica: simulação estocástica de confiabilidade e custo. Cada cenário roda 4.000 trajetórias mensais de 30 anos com as manobras do modelo físico (ONS: DESSEM e intercâmbio N–NE), taxas de falha de disjuntor e de reator da CIGRÉ, Parcela Variável do Módulo 4 da ANEEL e preços da EPE. O preço do reator fixo e o do vão são referências regulatórias brasileiras (EPE, base de preços da ANEEL de 2021, corrigida pelo IPCA); o do VSR vem de contratos públicos de operadores europeus, escalados para a tensão e a potência de cada cenário. Os dois preços podem ser ajustados acima, até a Hitachi Energy cotar o caso brasileiro.

## Calculadora — Ver metodologia e fontes

O PDF pode ser baixado neste painel pelo link "Baixar relatório de metodologia (PDF)".

Como o modelo funciona

Unidade comparada: um VSR com faixa de 50–100% no lugar de dois bancos de reatores fixos (o manobrável e uma fatia igual da compensação permanente), cada banco com seu vão de manobra.

Camada física: a necessidade de reativo sai da sobra de reativo das linhas, Qc·(1 − (P/SIL)²), com as séries do ONS (DESSEM e intercâmbio N–NE de 2025–26). O fixo liga e desliga em degraus; o VSR troca de tap.

Camada financeira: 4.000 trajetórias mensais de 30 anos por cenário, com preventiva a cada 72 meses, revisão geral por contagem de ciclos, troca do disjuntor no fim da vida mecânica, falhas maiores e menores (CIGRÉ TB 510), falhas do reator e do OLTC (CIGRÉ TB 939 e 642) e Parcela Variável (ANEEL, Módulo 4 rev.2).

Taxas: transmissora a 12,11% a.a. real antes de impostos (WACC ANEEL 2026); sistema a 8,5% a.a. real (taxa social de desconto).

Preço do reator fixo e do vão: EPE-DEE-NT-077/2021 (reator monofásico de 500 kV e 66,6 Mvar a R$ 4,415 mi; conexão de reator de barra a R$ 9,589 mi; base de preços da ANEEL de mar/2021), corrigida pelo IPCA até set/2026. A 500 kV o banco fixo de referência tem fase reserva (3+1R). A 230 kV não há preço público: o reator sai do 500 kV por regra de escala (premissa).

Os dois preços são só do equipamento; o vão entra à parte, igual nas duas alternativas. O preço do fixo pode ser ajustado de −50% a +60% da referência. Cada fluxo do modelo é linear nos dois preços, então a calculadora usa três rodadas de mesma semente para calcular a grade exata e interpola entre os pontos.

Gráfico do dia: a carga (ou o fluxo) que move o cenário e o reator ligado numa subestação com 2 reatores fixos (um manobrável e um sempre ligado) contra 1 VSR. O reator aparece na escala da carga pela fórmula do modelo, r = (hi² − u²)/(hi² − lo²): o fixo liga e desliga o banco inteiro; o VSR muda em passos de 1/32 da faixa (33 posições de tap).

O que pesa contra o VSR (está no simulador)

Preço do VSR no nível do contrato de 2023 da Energinet: o VSR não compensa.

Reator fixo mais barato que a referência: no Campo, cada 10% a menos no preço do fixo tira cerca de R$ 3,6 mi do VPL; com o preço de 2021 sem correção pela inflação, o VPL mediano fica perto de zero.

Reforço autorizado com RAP pelo Banco de Preços da ANEEL: negativo para a transmissora, positivo para o sistema.

OLTC a óleo, fixo sem fase reserva ou reserva do VSR de 1 para 3: o resultado cai perto de zero ou abaixo.

O preço do VSR é uma estimativa a partir de contratos europeus; a cotação da Hitachi Energy para o caso brasileiro substitui esta faixa.

O que o modelo não monetiza

Fim dos degraus de tensão a cada manobra, regulação contínua que ajuda a integrar solar e eólica, uso do VSR como reserva flexível em várias posições da rede e menor área ocupada.

Contratos públicos de VSR usados no preço

Comprador | Ano | VSR | Preço por unidade | Uso Litgrid (Lituânia) | 2026 | 330 kV, 140 Mvar | € 3,50 mi | base Energinet (Dinamarca) | 2025 | 400 kV, 140 Mvar | € 4,29 mi | base Energinet (Dinamarca) | 2023 | 400 kV, 140 Mvar | € 7,68 mi | estresse Energy Community – índice de custo unitário (3 contratos) | 2025 | 400 kV, 200 Mvar | € 10,20 mi | estresse HOPS (Croácia) – Melina | 2019 | 400 kV, 200 Mvar | € 4,93 mi | referência (preço anterior a 2021) HOPS (Croácia) – Mraclin | 2019 | 220 kV, 100 Mvar | € 3,34 mi | referência (preço anterior a 2021) PSEG / PJM (EUA) | 2023 | 230 kV, 150 Mvar | US$ 29,6 mi por 2 projetos de VSR de 150 Mvar (230 e 345 kV) | contexto (escopo de projeto) Elektroprenos BiH (Bósnia) | 2025 | 400 kV, 150 Mvar | € 54,3 mi por 4 VSR com vãos e SCADA | contexto (escopo de projeto)

Escala: preço ∝ Mvar^0,6 × kV^β, β de 0,3 a 1,0 (central 0,5); câmbio de € 1 = R$ 5,92 (BCB, set/2026). Base = média dos contratos de 2025–26.

## Monte Carlo — Apresentação

SIMULAÇÃO DE MONTE CARLO

4.000 futuros possíveis para cada cenário

Ninguém sabe quando um disjuntor vai falhar ou quanto vai custar o reparo. Por isso a calculadora não faz uma conta só: ela sorteia as incertezas dentro de faixas tiradas da literatura técnica, simula 30 anos mês a mês e repete isso 4.000 vezes.

## Monte Carlo — Como cada simulação funciona

Como cada simulação funciona

Sorteia as incertezas

Escolhe um valor para cada um dos 19 parâmetros da lista abaixo, dentro da faixa de cada um.

Simula 360 meses

Mês a mês, sorteia falhas, reparos e paradas, e soma manutenções, trocas de disjuntor e multas da ANEEL.

Compara as duas opções

Calcula o custo dos reatores fixos e o do VSR, em valor presente, e guarda a diferença: o VPL.

Repete 4.000 vezes

Cada repetição é um futuro diferente. O resultado da calculadora é o retrato desses 4.000 futuros.

## Monte Carlo — O que sai das simulações — Centro Urbano

Os 4.000 resultados

Centro Urbano, 230 kV, visão da transmissora: fluxo de caixa a 12,11% ao ano, com a multa da ANEEL (Parcela Variável). VSR a R$ 8,6 mi contra dois reatores fixos a R$ 5,8 mi no total, nos preços de referência.

## Monte Carlo — O que sai das simulações — Campo

Os 4.000 resultados

Campo, 500 kV, visão da transmissora: fluxo de caixa a 12,11% ao ano, com a multa da ANEEL (Parcela Variável). VSR a R$ 42,5 mi contra dois reatores fixos a R$ 27,0 mi no total, nos preços de referência.

## Monte Carlo — O que sai das simulações — Polo eólico

Os 4.000 resultados

Polo eólico, 500 kV, visão da transmissora: fluxo de caixa a 12,11% ao ano, com a multa da ANEEL (Parcela Variável). VSR a R$ 42,5 mi contra dois reatores fixos a R$ 27,0 mi no total, nos preços de referência.

## Monte Carlo — O que é sorteado mês a mês

O que é sorteado mês a mês

Dentro de cada simulação, o modelo sorteia em cada mês se acontece cada evento e quanto ele dura, usando os parâmetros sorteados para aquela simulação (lista abaixo).

Falhas de disjuntor em cada mês

Sorteio de Poisson com a taxa da simulação. A taxa de cada disjuntor fica entre a do que quase não manobra e a do que manobra todo dia, conforme as manobras dele.

Tempo de reparo do disjuntor

Reparo no local: mediana de 24 horas, 9 em cada 10 até 100 horas. Na fábrica: de 14 a 42 dias. Explosão: 30 dias e 1,5 vez o preço do disjuntor.

Falha grave de reator ou do VSR

Custo de 30% a 100% do equipamento. O VSR sem reserva fica parado com mediana de 180 dias (9 em cada 10 até 540 dias). No fixo de 500 kV, a fase reserva entra em até 3 horas.

Falha do comutador do VSR

De 3 a 21 dias parado e custo de 5% a 15% do preço do VSR.

Carga cortada (só visão do sistema)

Energia não suprida com mediana de 11,5 MWh por corte (9 em cada 10 até cerca de 140 MWh), dos dados do ONS de 2016 a 2025, ao custo do déficit.

## Monte Carlo — O que muda de uma simulação para outra

O que muda de uma simulação para outra

Cada parâmetro é sorteado uma vez por simulação e vale para os 30 anos dela. A figurinha mostra o formato do sorteio dentro da faixa.

Triangular: valores perto do mais provável saem mais

Uniforme: qualquer valor da faixa, com a mesma chance

DISJUNTORES

Valem para cada disjuntor das duas opções. O do reator fixo manobra todo dia; o do VSR quase nunca.

Falhas graves de disjuntor que quase não manobra

Entra em: fixo e VSR · Fonte: CIGRÉ TB 510

0,23 a 0,28% ao ano mais provável: 0,25

Falhas graves de disjuntor que manobra reator uma vez por dia

1,98 a 3,02% ao ano mais provável: 2,46

Falhas pequenas para cada falha grave

Entra em: fixo e VSR · Fonte: CIGRÉ TB 510 (derivado)

7,1 a 7,9 falhas todos com a mesma chance

Chance de a falha grave ser uma explosão

Entra em: fixo e VSR · Fonte: premissa

2 a 8% todos com a mesma chance

Chance de o reparo ir para a fábrica

Entra em: fixo e VSR · Fonte: manual GE GL314; premissa

5 a 15% todos com a mesma chance

Custo do reparo de uma falha grave

5 a 30% do disjuntor mais provável: 15

Custo de uma falha pequena

0,5 a 2,0% do disjuntor mais provável: 1,0

Custo da manutenção preventiva (a cada 6 anos)

Entra em: fixo e VSR · Fonte: Jeromin et al. 2009; premissa

1 a 3% do disjuntor mais provável: 2

Manobras até a revisão geral (ou 20 anos)

Entra em: fixo e VSR · Fonte: manual GE GL314; Hermosillo 2002

2.000 a 5.000 manobras mais provável: 3.000

Custo da revisão geral

Entra em: fixo e VSR · Fonte: Jeromin et al. 2009

7 a 13% do disjuntor mais provável: 10

Vida mecânica real até a troca do disjuntor

Entra em: fixo e VSR · Fonte: IEC 62271-100; IEEE PES 2017

2.000 a 10.000 manobras todos com a mesma chance

Erro no número de manobras do modelo físico

0,8 a 1,2 × o calculado mais provável: 1,0

REATORES E VSR

A falha grave vale por unidade, para os reatores fixos e para o VSR.

Falha grave de reator ou do VSR

Entra em: fixo e VSR · Fonte: CIGRÉ TB 939; Martin e Tenbohlen 2026

0,30 a 0,53% ao ano mais provável: 0,41

Falha do comutador do VSR

Entra em: VSR · Fonte: CIGRÉ TB 642 e TB 939 (derivado)

0,04 a 0,16% ao ano mais provável: 0,10

Trocas de tap além das que os dados enxergam

Entra em: VSR · Fonte: premissa (dados a cada 30 min ou 1 h)

1 a 2 × o calculado todos com a mesma chance

Custo da manutenção do comutador

Entra em: VSR · Fonte: premissa

1 a 3% do VSR mais provável: 2

VÃO DE MANOBRA

O fixo tem dois vãos; o VSR, um.

Operação e manutenção de rotina do vão

Entra em: fixo (2 vãos) e VSR (1 vão) · Fonte: premissa; teto da ANEEL (NT 103/2024)

0,5 a 2,0% do vão por ano mais provável: 1,0

SÓ NA VISÃO DO SISTEMA

Entram só quando a visão escolhida é Sistema (SIN); não entram na conta da transmissora.

Chance de a falha grave de disjuntor cortar carga

2 a 10% todos com a mesma chance

Valor da energia perdida no VSR

150 a 400 R$ por MWh mais provável: 250

## Monte Carlo — Detalhes técnicos e o que não é sorteado

Detalhes técnicos

4.000 simulações por cenário, visão e premissa, cada uma com 360 meses; gerador numpy com semente fixa (11), então o resultado se repete a cada execução.

Números aleatórios comuns: os mesmos sorteios servem às duas opções e a todos os preços, então a diferença entre elas vem das escolhas, não do acaso.

Precisão: no Campo, visão da transmissora, o erro-padrão da média do VPL é de cerca de R$ 0,07 mi.

Esta página usa as premissas-base e os preços de referência (VSR: média dos contratos de 2025–26; fixo: referência EPE/ANEEL de 2021 corrigida pelo IPCA). A visão da transmissora desconta a 12,11% ao ano; a do sistema (SIN), a 8,5% ao ano.

O histograma usa faixas de R$ 0,1 mi, agrupadas conforme a largura da tela; as faixas começam no zero, então nenhum retângulo mistura resultados positivos e negativos.

Os sorteios e as faixas desta página são conferidos contra o código do modelo (scripts 10 e 12 do projeto).

O que não é sorteado

Você escolhe na calculadora

Preço do VSR e preço do reator fixo

Quem avalia: transmissora (12,11% ao ano) ou sistema (8,5% ao ano)

Premissas: regime de reforço, reserva do VSR, fase reserva do fixo, comutador a óleo

Fica fixo no modelo

Tamanho dos reatores e preço do vão e do disjuntor

Manobras por dia do modelo físico (só multiplicadas pelo erro sorteado)

Receita da função de transmissão e regras da multa da ANEEL (Parcela Variável)

Horizonte de 30 anos, sem valor residual
