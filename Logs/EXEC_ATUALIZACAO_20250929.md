# LOG – Atualização 2025-09-29

## Escopo

- Correção de 422 (Salas / Modalidades) normalizando `descricao null -> undefined`.
- Implementação de hard delete para Salas e Modalidades.
- Atualização de testes unitários (`sala.service.test.ts`, `modalidade.service.test.ts`).
- Ajuste dos diálogos de confirmação (texto de exclusão permanente).
- Inclusão de scripts `dev:clean` e `build:clean` (root e apps/web) com `rimraf`.
- Revisão de layout de configurações (arquivo presente e válido).
- Atualização abrangente do `README.md` com políticas de exclusão, cache e guidelines.

## Arquivos Alterados Principais

- `packages/lib/src/services/sala.service.ts`
- `packages/lib/src/services/modalidade.service.ts`
- `apps/web/features/cadastro/salas/SalasFeature.tsx`
- `apps/web/features/cadastro/modalidades/ModalidadesFeature.tsx`
- `apps/web/features/cadastro/modalidades/hooks/use-modalidades.ts`
- `apps/web/tests/unit/sala.service.test.ts`
- `apps/web/tests/unit/modalidade.service.test.ts`
- `apps/web/features/cadastro/salas/hooks/use-salas.ts` (verificação prévia – já removia item)
- `README.md`

## Mudanças de Comportamento

| Antes                                        | Depois                                       |
| -------------------------------------------- | -------------------------------------------- |
| Lixeira (Salas) marcava status INATIVO       | Lixeira remove definitivamente (hard delete) |
| Lixeira (Modalidades) marcava status INATIVO | Hard delete                                  |
| Testes esperavam status INATIVO              | Agora verificam ausência no banco            |
| `descricao` podia gerar 422 se null          | Null é normalizado para undefined            |

## Riscos e Mitigações

- Perda de dados por exclusão acidental -> Mensagem explícita de ação permanente. Sugestão futura: camada de auditoria.
- Regressão em dependências que listavam INATIVO -> Confirmado que UI remove item; nenhum fluxo dependente listado.

## Próximos Passos (Opcional)

1. Implementar tabela de auditoria (ex: `SalaAudit`, `ModalidadeAudit`).
2. Adicionar botão "Reativar" apenas para entidades mantidas com soft delete (outros domínios).
3. Criar util de normalização genérica de payloads para evitar repetição (descricao/null -> undefined).
4. Pipeline CI: adicionar passo automático `pnpm dev:clean` quando hash de branch mudar.

## Check rápido

- Sintaxe: OK (verificação dos arquivos modificados sem erros).
- Schemas Prisma: sem alterações nesta rodada (apenas uso diferente de delete).
- Scripts: `dev:clean` e `build:clean` disponíveis em root e app.

-- Fim --
