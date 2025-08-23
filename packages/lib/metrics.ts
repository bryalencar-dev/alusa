// Métricas in-memory simples (placeholder). Em produção: Prometheus client.
export const counters = {
  matriculasCriadas: 0,
  vendasRegistradas: 0,
  checkinsEventos: 0,
  http5xx: 0,
  httpRequests: 0
};

const durations: number[] = [];

export function trackRequest(durationMs: number, status: number) {
  counters.httpRequests += 1;
  durations.push(durationMs);
  if (status >= 500) counters.http5xx += 1;
  if (durations.length > 1000) durations.splice(0, durations.length - 1000); // janela deslizante
}

function percentile(p: number) {
  if (!durations.length) return 0;
  const sorted = [...durations].sort((a,b)=>a-b);
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return sorted[idx];
}

export function inc(name: keyof typeof counters, v = 1) {
  counters[name] += v;
}

export function getPrometheusMetrics(): string {
  const p95 = percentile(0.95);
  return [
    '# HELP matriculasCriadas Total de matrículas criadas',
    '# TYPE matriculasCriadas counter',
    `matriculasCriadas ${counters.matriculasCriadas}`,
    '# HELP vendasRegistradas Total de vendas registradas',
    '# TYPE vendasRegistradas counter',
    `vendasRegistradas ${counters.vendasRegistradas}`,
    '# HELP checkinsEventos Total de check-ins de eventos',
    '# TYPE checkinsEventos counter',
    `checkinsEventos ${counters.checkinsEventos}`,
    '# HELP http5xx Total de respostas 5xx',
    '# TYPE http5xx counter',
    `http5xx ${counters.http5xx}`,
    '# HELP httpRequests Total de requests HTTP',
    '# TYPE httpRequests counter',
    `httpRequests ${counters.httpRequests}`,
    '# HELP http_request_duration_p95_ms p95 de duração das requisições (ms)',
    '# TYPE http_request_duration_p95_ms gauge',
    `http_request_duration_p95_ms ${p95}`
  ].join('\n');
}
