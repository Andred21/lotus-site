# Evidência — backup, restauração exercitada e ensaio do rollback DNS (`7.2.3`)

Bloco `B4`, spec `docs/superpowers/specs/2026-09-28-7.2.3-7.2.4-backup-rollback-smoke-design.md`.
Datas e comandos abaixo são os executados; nada é digitado de memória.

## 1. Cópias e onde estão (spec D3)

| Cópia                                    | SHA-256                                                            | Tamanho (B) | Gerada em  | WordPress | Onde está                                              |
| ---------------------------------------- | ------------------------------------------------------------------ | ----------- | ---------- | --------- | ------------------------------------------------------ |
| WPvivid `backup_all.zip` (segunda cópia) | `9c4719b99d42292c2554287acc2c8c307cc7175b3b4847d15286638b4651c71a` | 199557444   | 2025-07-25 | 6.8.2     | Windows do João (pasta `V1/Backup Site Institucional`) |
| StackCP — arquivos do site               | _Task 4_                                                           | _Task 4_    | _Task 4_   | 7.1.2     | _Task 4_                                               |
| StackCP — dump do banco                  | _Task 4_                                                           | _Task 4_    | _Task 4_   | 7.1.2     | _Task 4_                                               |

Segunda mídia, fora do Windows: _descrição dada por João na Task 4_.

O bucket `lotus-site-prod` está vetado (spec D3): a distribuição serve qualquer chave dele.

## 2. Ensaio de restauração (spec §4.3)

_Task 4._

## 3. Ensaio do rollback DNS em `ensaio-corte.lotusotec.cl` (spec §4.4)

_Tasks 6–11: uma subsecção por estágio._

## 4. Desfecho e procedimento

_Task 12._
