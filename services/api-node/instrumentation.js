// Este arquivo é carregado ANTES do server.js (veja o "--require" no package.json).
// É aqui que o OpenTelemetry é configurado: para onde mandar os traces e o que
// instrumentar automaticamente (chamadas HTTP, rotas do Express, etc).

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// Nome que vai aparecer como "service.name" nos traces (é por esse nome que
// vamos filtrar os traces no Grafana/Tempo).
const SERVICE_NAME = process.env.OTEL_SERVICE_NAME || 'api-node';

// Endpoint do OTel Collector. Dentro da rede do Docker Compose o serviço se
// chama "otel-collector" e expõe OTLP/HTTP na porta 4318.
const OTLP_ENDPOINT =
  (process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4318') + '/v1/traces';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: SERVICE_NAME,
  }),
  traceExporter: new OTLPTraceExporter({ url: OTLP_ENDPOINT }),
  instrumentations: [
    getNodeAutoInstrumentations({
      // A instrumentação de "fs" captura toda leitura de arquivo que o Node
      // faz internamente (até para carregar os próprios módulos), gerando
      // centenas de spans irrelevantes. Desativamos para o trace ficar
      // focado no que importa: a requisição HTTP.
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

sdk.start();

// Garante que os traces pendentes sejam enviados antes do processo encerrar.
process.on('SIGTERM', () => {
  sdk.shutdown().finally(() => process.exit(0));
});
