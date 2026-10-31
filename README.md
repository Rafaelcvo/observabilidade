# Observabilidade — projeto de estudos

Projeto para aprender, na prática, como funciona observabilidade com
**OpenTelemetry (OTel)**: a mesma tecnologia que já está em produção numa
aplicação real em Go, Node.js e Rust. Aqui recriamos uma versão pequena e
didática dessa ideia, construída etapa por etapa.

Pré-requisito único: **Docker Desktop** instalado e rodando (no Windows,
precisa do WSL2 habilitado — o próprio instalador do Docker Desktop guia por
isso). Não é necessário instalar Go, Node.js ou Rust na sua máquina: cada
serviço roda dentro de um container.

## O roteiro completo

1. **Etapa 1 — Traces do zero** _(esta etapa, já implementada)_: um serviço
   em Node.js instrumentado, enviando traces para um OTel Collector, que
   guarda no Tempo, visualizado no Grafana.
2. **Etapa 2 — Propagação entre serviços**: entra um serviço em Go; o
   Node passa a chamar o Go via HTTP. Você vai ver um único trace com spans
   das duas linguagens.
3. **Etapa 3 — Terceira linguagem**: entra um serviço em Rust, chamado pelo
   Go. O trace passa a atravessar as três linguagens.
4. **Etapa 4 — Métricas**: entra o Prometheus; os três serviços passam a
   expor métricas de requisições (quantidade, latência) e montamos um
   dashboard no Grafana.
5. **Etapa 5 — Logs correlacionados**: entra o Loki; os serviços passam a
   gerar logs estruturados com o `trace_id`, e no Grafana você consegue
   pular de um log direto para o trace correspondente.
6. **Etapa 6 — Exercício: causar problema de propósito**: injetamos um erro
   ou uma lentidão artificial em algum serviço e usamos traces, métricas e
   logs juntos para descobrir o que está acontecendo — como seria num
   incidente real.

Cada etapa é construída em conjunto, uma por vez, com explicação do que está
sendo feito e por quê.

## Conceitos usados nesta etapa

- **Trace**: o caminho completo de uma requisição. No nosso caso, por
  enquanto, é só a chamada `GET /ola` no `api-node`.
- **Span**: um pedaço desse caminho (por exemplo, "processar a rota /ola").
  Um trace pode ter vários spans; nas próximas etapas, cada serviço vai
  acrescentar o seu.
- **OTel Collector**: um "correio" que recebe os traces de todos os
  serviços e decide para onde mandar (aqui, só para o Tempo). Os serviços
  não precisam saber onde o Tempo está — só precisam conhecer o Collector.
- **Tempo**: o banco de dados que guarda os traces.
- **Grafana**: a interface onde a gente visualiza tudo.

## Estrutura do projeto

```
observabilidade/
├── docker-compose.yml              # sobe os 4 containers desta etapa
├── otel-collector/                 # config do Collector
├── tempo/                          # config do Tempo
├── grafana/provisioning/           # datasource do Tempo pré-configurado
└── services/
    └── api-node/                   # serviço Node.js instrumentado com OTel
```

## Como rodar a Etapa 1

1. Abra um terminal na raiz do projeto e suba tudo:
   ```
   docker compose up -d
   ```
2. Confirme que os 4 containers subiram:
   ```
   docker compose ps
   ```
3. Gere algumas requisições (repita uns 5 vezes, abrindo no navegador ou via
   terminal):
   ```
   curl http://localhost:8080/ola
   ```
4. Abra o Grafana em [http://localhost:3000](http://localhost:3000) (login
   automático, sem senha).
5. No menu lateral, vá em **Explore**.
6. Confirme que o datasource selecionado no topo é **Tempo**.
7. No campo de busca (modo **TraceQL**), use a query:
   ```
   {resource.service.name="api-node"}
   ```
   (no TraceQL do Tempo, atributos de resource precisam do prefixo
   `resource.` — escrever só `service.name` dá erro de parse)
8. Clique em **Run query**. Deve aparecer uma lista de traces.
9. Clique em um deles. Você verá um span chamado algo como `GET /ola`, com
   uma duração entre ~100ms e ~300ms (é o delay artificial que o código
   adiciona de propósito).

### O que você deveria estar vendo

- Uma lista de vários traces (um para cada `curl` que você fez).
- Ao abrir um trace: uma barra representando o span da requisição, com a
  duração mostrada ao lado.
- Nos detalhes do span (clicando nele), atributos como `http.method: GET`,
  `http.route: /ola`, `http.status_code: 200`.

Se chegou até aqui e viu isso, a Etapa 1 funcionou. O próximo passo (Etapa 2)
é adicionar o serviço em Go e fazer o `api-node` chamá-lo — aí vamos ver o
mesmo trace "crescer" com um span do Go dentro dele.

## Comandos úteis

```
docker compose logs -f api-node       # ver logs do serviço Node
docker compose logs -f otel-collector # ver se o Collector está recebendo/enviando traces
docker compose down                   # parar tudo
docker compose down -v                # parar tudo e apagar os dados guardados (traces, etc)
```
