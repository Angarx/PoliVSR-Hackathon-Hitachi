# PoliVSR
**Da pesquisa aplicada à rede do futuro: validação técnica e econômica de Reatores de Derivação Variável (VSR) no Sistema Interligado Nacional.**

> 🔗 **Acesse a Prova de Conceito (PoC):** [polivsr.vercel.app](https://polivsr.vercel.app)

---

## 👥 Equipe

Projeto desenvolvido para o **Hackathon Hitachi Energy 2026**:

* **João Paulo Saraiva** — [@JPauloSar](https://github.com/JPauloSar)
* **Raphael de Campos Barros Dopaso** — [@Angarx](https://github.com/Angarx)
* **Nasser Magalhães Mazloum** — [@LordiMil](https://github.com/LordiMil)

---

## 📌 Escopo do Projeto: O que é o PoliVSR?

Este repositório contém o código-fonte da plataforma web desenvolvida como Prova de Conceito (PoC) para o Hackathon da Hitachi Energy. No entanto, o escopo do projeto vai além de uma entrega de software: a nossa proposta central é a estruturação do **PoliVSR**, um Grupo de Inteligência de Rede e pesquisa aplicada na Escola Politécnica da USP (Poli-USP), mantido por meio de parceria e bolsas de fomento da Hitachi Energy.

A nossa tese parte de uma realidade prática do setor elétrico brasileiro: a tecnologia do **Variable Shunt Reactor (VSR)** já é madura e a Transferência de Tecnologia (ToT) da Suécia (Ludvika) para o HUB fabril de Guarulhos (SP) já permite a produção nacional. Hoje, o verdadeiro gargalo para a geração de pedidos não está na engenharia ou na fábrica, mas na **fase de planejamento e nos leilões**.

Atualmente, os editais da ANEEL e as especificações técnicas do ONS e da EPE costumam sair padronizados exigindo "Reatores Shunt Fixos". Quando o edital é publicado dessa forma, o VSR sequer entra na concorrência ou acaba penalizado por modelos econômicos que olham apenas para o custo inicial de aquisição (CAPEX), ignorando o custo operacional (OPEX) ao longo de décadas de operação.

O **PoliVSR** nasce para atuar antes do edital: difundindo conhecimento técnico isento para quebrar a inércia institucional do setor e fundamentar a substituição do reator chaveado tradicional pelo VSR.

---

## ⚡ O Problema Técnico: O Custo Invisível do Reator Fixo

Com a expansão das linhas de transmissão de longa distância e a forte inserção de fontes renováveis intermitentes (eólica e solar, com destaque para os gargalos na região Nordeste), o perfil de carga do Sistema Interligado Nacional (SIN) mudou. 

Durante a queda de carga líquida diurna (a chamada *Curva de Pato*) ou na madrugada, linhas longas operando em carga leve comportam-se como grandes capacitores, injetando potência reativa excedente no sistema e provocando sobretensões severas (**Efeito Ferranti**).

1. **A limitação atual (Reator Fixo Chaveado):** Opera como um interruptor bruto de "liga/desliga" (0% ou 100% da potência nominal). Se dimensionado para a madrugada, afunda a tensão no meio do dia; se desligado, deixa a linha em sobretensão. Para contornar essa rigidez, a operação realiza dezenas de manobras agressivas de disjuntor diariamente. Isso gera desgaste mecânico severo nos equipamentos, risco de falha, transitórios na rede e medidas operativas paliativas (chegando ao extremo de abertura de linhas de transmissão para controle de tensão).
2. **A evolução (VSR com OLTC):** Equipado com um Comutador de Derivação em Carga (*On-Load Tap Changer*), o VSR funciona como um *dimmer* contínuo. Ele altera o número de espiras ativas sob carga em pequenos degraus automáticos, ajustando a absorção de potência reativa exatamente conforme a necessidade da rede ao longo das 24 horas do dia — sem a necessidade de manobrar o disjuntor.

---

## 🎓 O Modelo de Alavancagem: Academia + Indústria

O setor elétrico é naturalmente conservador, pois ativos de transmissão operam por décadas e falhas sistêmicas custam caro. Enquanto um fabricante tentando vender uma nova topologia pode ser visto com cautela comercial, uma universidade apresentando dados auditáveis tem autoridade técnica.

A estratégia do PoliVSR propõe um funil de validação de baixo custo e alto retorno:

* **Bolsas de Pesquisa (Hitachi Energy + Transmissoras + Poli-USP):** Financiamento de pesquisadores de Iniciação Científica (IC), Mestrado e Doutorado dedicados a estudar a dinâmica de controle de tensão no SIN.
* **Repositório Público para Concessionárias e Investidores:** Disponibilização aberta das modelagens matemáticas, estudos topológicos e análises financeiras em uma linguagem acessível tanto para engenheiros de planejamento quanto para investidores e diretores de transmissoras.
* **Pressão Técnica junto ao ONS e EPE:** Ao munir as concessionárias com provas de que a redução drástica de OPEX compensa o investimento no VSR, criamos o embasamento necessário para justificar a tecnologia perante a ANEEL e pressionar o ONS e a EPE a atualizarem as diretrizes dos próximos leilões de transmissão.

---

## 💻 Arquitetura da Plataforma ([polivsr.vercel.app](https://polivsr.vercel.app))

O site funciona como o ponto de encontro entre a produção científica do grupo e os tomadores de decisão das concessionárias. Ele foi estruturado em três frentes principais:

### 1. O Preço do Fixo (Simulador Diário e Calculadora de OPEX)
A porta de entrada tática do site. Permite visualizar de forma interativa o comportamento da rede ao longo do dia (acompanhando a Curva de Pato e as manobras no SIN) e calcular o impacto financeiro oculto causado pelo desgaste mecânico crônico dos disjuntores em reatores fixos. O objetivo é provar matematicamente que o VSR se paga no médio e longo prazo.

### 2. Pesquisas e Dados (Repositório Digital Aberto)
O acervo técnico do grupo. Reúne artigos, notas técnicas, justificativas de editais de fomento e estudos de caso das linhas brasileiras organizados por dores práticas do setor (como *Mitigação do Efeito Ferranti*, *Estudos de OPEX* e *Confiabilidade do OLTC*). Serve como base de consulta rápida para engenheiros e investidores avaliarem a maturidade da tecnologia.

### 3. Quem Somos (Posicionamento Institucional)
Apresenta a missão do núcleo PoliVSR, a conexão entre a pesquisa acadêmica na USP e a capacidade fabril já instalada da Hitachi Energy em Guarulhos, além de abrir um canal direto para que concessionárias tragam seus desafios reais de concessão para estudos conjuntos de viabilidade.

---

## 🛠️ Como executar o projeto localmente

```bash
# Clone este repositório
git clone [https://github.com/JPauloSar/PoliVSR-Hackathon-Hitachi.git](https://github.com/JPauloSar/PoliVSR-Hackathon-Hitachi.git)

# Acesse a pasta do projeto
cd PoliVSR-Hackathon-Hitachi

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
