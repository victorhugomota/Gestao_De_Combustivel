# Gestão de Combustível

App pessoal para controlar consumo, prever gastos e decidir onde e com o quê
abastecer. Feito para um veículo flex.

**Online:** https://victorhugomota.github.io/Gestao_De_Combustivel/

## O que faz

| Área | Descrição |
|---|---|
| **Abastecimentos** | Registro com data, odômetro, litros, valor, tipo e "tanque cheio". Valida odômetro crescente e avisa sobre consumo fora do comum. |
| **Consumo (km/L)** | Média real pelo método de odômetro, **separada por combustível** (gasolina x etanol). |
| **Gasolina ou Etanol?** | Regra dos 70% — calibrada com o rendimento real do carro quando há dados dos dois combustíveis. |
| **Postos & Preços** | Cadastro dos postos usados, com preço informado manualmente. Destaca o mais barato perto de casa e marca preços desatualizados. |
| **Rotas de trabalho** | Circuito Casa → destinos → Casa com distância viária real (OSRM) e custo por trecho. |
| **Previsão mensal** | Módulo único (`src/utils/previsao.js`): dias úteis reais − feriados nacionais, mês parcial, viagens agendadas e faixa de incerteza. |
| **Calendário de custos** | Visão mês a mês de rota + abastecimentos + viagens. |
| **Viagens** | Lê a coleção `trips` do projeto Site de Viagens. |

## Stack

React 18 + Vite + Tailwind, Firebase (Firestore + Storage + Auth anônimo),
Leaflet/OSRM, Recharts, date-fns.

## Rodar local

```bash
npm install
npm run dev
```

## Deploy

Automático: `push` na branch `main` dispara o workflow
`.github/workflows/deploy.yml` (GitHub Actions → GitHub Pages).

## Segurança

Ver [SECURITY.md](SECURITY.md). Resumo: habilitar login anônimo no Firebase e
publicar `firestore.rules` / `storage.rules`.

## Estrutura

```
src/
  hooks/        useAbastecimentos, useRotas, useViagens, usePostos, useMetricas
  utils/        combustivel, previsao, feriados, dataUtils, geocode, rotasUtils
  components/   Header, RegistrarAbastecimentoModal, RotasTrabalho, MapaRota,
                DecisaoCombustivel, PostosCombustivel, AnalisePrecos,
                MetricCards, GraficoConsumo, ViagensPreagendadas,
                CalendarioCustosModal, HistoricoAbastecimentosModal, EstimativaBadge
```

## Premissas conhecidas

- 1 veículo, sem contas por usuário (dados compartilhados).
- Consumo por combustível só conta trechos entre dois abastecimentos do mesmo
  tipo e com "tanque cheio" marcado.
- Preços de postos são informados manualmente (não há API de preços).
- Distância de rota depende do servidor demo do OSRM; sem ele, vira estimativa
  (linha reta × 1,38) e é sinalizada na tela.
