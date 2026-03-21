# State JSON Specification

> Contrato entre o Engine e a UI para estado de execução em tempo real.

---

## Formato Completo

```json
{
  "squad": "squad-code",
  "executionId": "uuid",
  "status": "idle | running | completed | checkpoint | failed",
  "step": {
    "current": 5,
    "total": 13,
    "label": "step-05"
  },
  "agents": [
    {
      "id": "researcher",
      "name": "Nome do Agente",
      "icon": "emoji",
      "status": "idle | working | delivering | done | checkpoint",
      "deliverTo": null,
      "desk": { "col": 1, "row": 1 }
    }
  ],
  "handoff": {
    "from": "copywriter",
    "to": "image-designer",
    "message": "Resumo da entrega",
    "completedAt": "2026-03-21T14:30:00.000Z"
  },
  "budget": {
    "totalTokens": 1000000,
    "usedTokens": 245000,
    "estimatedCost": 12.50,
    "perAgent": {
      "researcher": { "tokens": 80000, "cost": 2.40 },
      "copywriter": { "tokens": 165000, "cost": 10.10 }
    }
  },
  "metrics": {
    "stepsCompleted": 4,
    "stepsRemaining": 9,
    "avgStepDuration": 45000,
    "estimatedCompletion": "2026-03-21T15:30:00.000Z"
  },
  "auditEvents": [
    {
      "action": "agent.started",
      "agentId": "researcher",
      "timestamp": "2026-03-21T14:00:00.000Z"
    }
  ],
  "startedAt": "2026-03-21T14:00:00.000Z",
  "updatedAt": "2026-03-21T14:30:00.000Z",
  "completedAt": null
}
```

---

## Status do Squad

| Status | Descrição |
|--------|-----------|
| `idle` | Squad configurado, aguardando execução |
| `running` | Pipeline em execução |
| `completed` | Todas as etapas concluídas |
| `checkpoint` | Aguardando aprovação humana |
| `failed` | Erro não recuperável |

## Status do Agente

| Status | Visual | Descrição |
|--------|--------|-----------|
| `idle` | Normal | Aguardando sua vez |
| `working` | Glow/animação | Executando tarefa |
| `delivering` | Highlight | Passando trabalho ao próximo |
| `done` | Dimmed | Completou sua etapa |
| `checkpoint` | Pause icon | Aguardando input do usuário |

## Transições de Status

```
Squad:   idle → running → completed
                  ↕
              checkpoint
                  ↓
                failed

Agent:   idle → working → delivering → done
                   ↕
               checkpoint
```

## Cálculo de Posição (Desk)

```
Para agente no índice i (0-based):
  col = (i % 3) + 1     → 1, 2, 3, 1, 2, 3...
  row = floor(i / 3) + 1 → 1, 1, 1, 2, 2, 2...
```

## Protocolo de Handoff

1. Agente atual: `status: "delivering"`, `deliverTo: "proximo-agente"`
2. Aguardar 3 segundos (animação na UI)
3. Agente atual: `status: "done"`, `deliverTo: null`
4. Próximo agente: `status: "working"`

---

## Extensões OrbitMind (vs. OpenSquad)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `executionId` | uuid | ID único da execução no DB |
| `budget` | object | Tokens e custo consumidos |
| `budget.perAgent` | object | Breakdown por agente |
| `metrics` | object | Métricas de progresso |
| `auditEvents` | array | Últimos eventos de audit |

---

*Spec v1.0 — OrbitMind Platform*
