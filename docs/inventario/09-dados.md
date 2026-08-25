# 09 — Dados institucionais e links externos

> Evidência: `docs/inventario/dom.json` (`sections[].links`, `sections[].texts`). Commit-base: `a8fa8c1`. `status` restrito a `verificado` (o próprio site é a origem e o destino responde) ou `pendente João` (número, certificação, credencial ou email cuja validade só a Lotus confirma).

## Links externos

`dom.json` não tem nenhum link para fora de `lotusotec.cl` que não seja âncora (`#...`) ou `mailto:` — nenhuma rede social, WhatsApp ou telefone com link. A única saída de domínio é `mailto:contacto@lotusotec.cl`, que não é um endpoint HTTP e não tem código de status para verificar.

```bash
node -e "const d=require('./docs/inventario/dom.json');const l=[...new Set(d.sections.flatMap(s=>s.links).map(x=>x.href).filter(h=>h&&h.startsWith('http')&&!h.includes('lotusotec.cl')))];console.log(l.length)"
# 0
```

Não há links externos com código HTTP a reportar — a lista está vazia, e isso está registrado aqui, não omitido.

## Dados institucionais

| dado                                | valor publicado                                                                                                                                                     | onde aparece                                  | status                                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Email de contato                    | `contacto@lotusotec.cl`                                                                                                                                             | seção `Contacto` (texto + `mailto:`)          | `verificado`                                                                                       |
| Telefone                            | nenhum publicado na home                                                                                                                                            | —                                             | `verificado` (ausência confirmada, não é omissão da extração)                                      |
| Redes sociais / WhatsApp            | nenhum link publicado na home                                                                                                                                       | —                                             | `verificado` (mesmo caso acima)                                                                    |
| Norma de certificação               | `NCH 2728:2015`, certificado `N° CA-751`, registro `INN: A-10981`                                                                                                   | seção `Somos`, destaque `CERTIFICACIÓN`       | `pendente João` (validade/atualidade só a Lotus confirma)                                          |
| Estatística "horas de capacitación" | `888 horas de capacitación`, sob o rótulo `ALUMNOS`                                                                                                                 | seção `Somos`, destaque `ALUMNOS`             | `pendente João` (número institucional; rótulo/conteúdo já divergem entre si, ver `02-conteudo.md`) |
| Cursos oferecidos                   | 3 nomes: `Curso Especialistas Líneas Vivas en Media Tensión`, `Curso Especialistas en Líneas Vivas en Alta Tensión`, `Curso Supervisor de Trabajos de Líneas Vivas` | seção `Cursos`                                | `pendente João` (carga horária, público-alvo e descrição completa não estão publicados na home)    |
| Nome/marca                          | `LOTUS OTEC`                                                                                                                                                        | `<title>`, `h1`, menu, rodapé                 | `verificado`                                                                                       |
| Ano de copyright do rodapé          | `Diseñado por Lotus OTEC \| Copyright © 2022. OTEC Lotus.`                                                                                                          | rodapé (`footer.copyright`, `02-conteudo.md`) | `pendente João` (o ano é `2022`; decidir se o clone atualiza)                                      |

## Resumo de pendências

O que precisa de confirmação de João antes de virar conteúdo final do clone (consolidado em `10 — README/matriz de paridade`):

1. Validade atual da certificação `NCH 2728:2015` / `CA-751` / `INN: A-10981`.
2. O número `888 horas` sob o rótulo `ALUMNOS` — manter como está (inconsistência do site original) ou corrigir.
3. Carga horária, público-alvo e descrição completa de cada um dos 3 cursos.
4. Ano de copyright do rodapé (`2022`).
