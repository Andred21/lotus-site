# 02 — Conteúdo e textos

> Evidência: `docs/inventario/dom.json` (`sha256` `0d8a8d45a434de23…`), capturado em `2026-08-25T21:21:22.608Z` via `pnpm inventario:dom`. Todo texto abaixo é transcrito verbatim do DOM, em espanhol, sem tradução e sem correção ortográfica — inclusive maiúsculas/minúsculas inconsistentes do original (`NUESTRos cursos`).

## Menu (`top-menu`)

| chave                | texto (es)      | origem no DOM                      |
| -------------------- | --------------- | ---------------------------------- |
| `menu.inicio`        | `Inicio`        | `#top-menu li` (`menu-item-47811`) |
| `menu.quienes_somos` | `Quienes Somos` | `#top-menu li` (`menu-item-47885`) |
| `menu.cursos`        | `Cursos`        | `#top-menu li` (`menu-item-47886`) |
| `menu.contacto`      | `Contacto`      | `#top-menu li` (`menu-item-47887`) |

O menu aparece duplicado no DOM (`main-header` e `et-top-navigation` contam os mesmos quatro itens duas vezes cada) — é o mesmo menu, renderizado uma vez para o header fixo e uma vez para o estado sticky do Divi.

## Hero (`Intrucción`)

| chave                      | texto (es)                                                                                                              | origem no DOM                                                                                                                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hero.kicker`              | `ENTRENAMIENTO PARA TRABAJOS EN INSTALACIONES ENERGIZADAS`                                                              | `p`/`li` acima do `h1`, dentro de `#Intrucción`                                                                                                                                                           |
| `hero.title`               | `LOTUS OTEC`                                                                                                            | `h1` dentro de `#Intrucción`                                                                                                                                                                              |
| `hero.subtitle`            | `SERVICIOS DE CAPACITACIÓN Y CERTIFICACIÓN`                                                                             | `h3` dentro de `#Intrucción`                                                                                                                                                                              |
| `hero.title_subtitle_echo` | `LOTUS OTEC SERVICIOS DE CAPACITACIÓN Y CERTIFICACIÓN`                                                                  | texto duplicado — mesma string de `hero.title` + `hero.subtitle` concatenada, presente em outro nó de texto dentro de `#Intrucción` (provável cópia para SEO/leitor de tela do Divi, não é conteúdo novo) |
| `hero.body`                | `Somos especialistas en entrenamiento en servicios de Alta y Media Tensión para líneas de transmisión y subestaciones.` | `p` dentro de `#Intrucción`                                                                                                                                                                               |
| `hero.cta`                 | `Learn More`                                                                                                            | `a[href=""]` dentro de `#Intrucción` (ver `01-estrutura.md` — CTA sem destino)                                                                                                                            |

## Institucional (`Somos`)

| chave                | texto (es)                                                                                                                                                                                                                                                                          | origem no DOM                        |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `institucional.body` | `En LOTUS OTEC tenemos una oferta especializada en satisfacer las necesidades de capacitación de la industria eléctrica. Somos expertos en las áreas de Seguridad, Entrenamiento y Certificación en métodos de trabajo con líneas energizadas a contacto, distancia y a potencial.` | `p` dentro de `#Somos`               |
| `destaques[0].label` | `ENERGIZADAS`                                                                                                                                                                                                                                                                       | `h4` dentro de `#Somos`              |
| `destaques[0].body`  | `Somos especialistas en entrenamiento de métodos de trabajo en Instalaciones Energizadas.`                                                                                                                                                                                          | `p` seguinte ao `h4` `ENERGIZADAS`   |
| `destaques[1].label` | `ALUMNOS`                                                                                                                                                                                                                                                                           | `h4` dentro de `#Somos`              |
| `destaques[1].body`  | `A la fecha hemos realizado un total de 888 horas de capacitación para la industria de la energía.`                                                                                                                                                                                 | `p` seguinte ao `h4` `ALUMNOS`       |
| `destaques[2].label` | `CERTIFICACIÓN`                                                                                                                                                                                                                                                                     | `h4` dentro de `#Somos`              |
| `destaques[2].body`  | `Estamos certificados bajo la norma NCH 2728:2015 como consta en certificado N° CA-751 y registro INN: A-10981.`                                                                                                                                                                    | `p` seguinte ao `h4` `CERTIFICACIÓN` |

`destaques[1]` é uma inconsistência do próprio site, não da extração: o rótulo diz `ALUMNOS` mas o corpo fala de `888 horas de capacitación`, não de número de alunos. Transcrito como está — a decisão sobre o texto final do clone é de João, não desta extração.

## Cursos (`Cursos`)

| chave              | texto (es)                                                                                                                                   | origem no DOM                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `cursos.heading`   | `NUESTRos cursos`                                                                                                                            | `h2` dentro de `#Cursos`                                                       |
| `cursos.intro`     | `A continuación presentamos los principales curso de nuestra oferta. Si desea conocer toda nuestra oferta de cursos, por favor contáctenos.` | `p` dentro de `#Cursos`                                                        |
| `cursos[0].nombre` | `Curso Especialistas Líneas Vivas en Media Tensión`                                                                                          | título do card 1, dentro de `#Cursos`                                          |
| `cursos[1].nombre` | `Curso Especialistas en Líneas Vivas en Alta Tensión`                                                                                        | título do card 2, dentro de `#Cursos`                                          |
| `cursos[2].nombre` | `Curso Supervisor de Trabajos de Líneas Vivas`                                                                                               | título do card 3, dentro de `#Cursos`                                          |
| `cursos.cta`       | `See More`                                                                                                                                   | `a[href="#"]` ao final da grade — ver `01-estrutura.md` (CTA sem destino real) |

Cada título de curso aparece duas vezes no DOM (uma vez como texto do card, uma vez em nó duplicado — mesmo padrão do hero). O nome de cada curso é a única informação de conteúdo disponível nos cards; carga horária, público-alvo e descrição longa não aparecem na home (ver `09-dados.md` para o que fica pendente de confirmação com João).

## Contato (`Contacto`)

| chave                   | texto (es)                                                                                                                                                        | origem no DOM                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `contacto.heading`      | `CONTÁCTENOS`                                                                                                                                                     | `h2` dentro de `#Contacto`                                     |
| `contacto.body`         | `Contactese con nosotros, déjenos mensaje describiendo su requerimiento y le contactaremos a la brevedad o escribanos al siguiente correo: contacto@lotusotec.cl` | `p` dentro de `#Contacto`                                      |
| `contacto.email`        | `contacto@lotusotec.cl`                                                                                                                                           | link `mailto:` dentro de `#Contacto`                           |
| `contacto.form.nombre`  | `Nombre Completo`                                                                                                                                                 | `placeholder` do campo `et_pb_contact_name_0`                  |
| `contacto.form.email`   | `Correo Electrónico`                                                                                                                                              | `placeholder` do campo `et_pb_contact_email_0`                 |
| `contacto.form.empresa` | `Empresa`                                                                                                                                                         | `placeholder` do campo `et_pb_contact_company_0`               |
| `contacto.form.mensaje` | `Mensaje`                                                                                                                                                         | `placeholder` do campo `et_pb_contact_message_0` (textarea)    |
| `contacto.form.submit`  | `Enviar`                                                                                                                                                          | texto do botão de envio (`forms[0].submitLabel` em `dom.json`) |

Os rótulos dos campos do formulário são `placeholder`, não `<label>` — não há texto de rótulo persistente fora do campo (some ao digitar). Contrato funcional completo do formulário está em `07-formulario.md`.

## Rodapé (`footer-bottom`)

| chave              | texto (es)                       | origem no DOM                             |
| ------------------ | -------------------------------- | ----------------------------------------- |
| `footer.copyright` | ver texto exato abaixo da tabela | `#footer-info` dentro de `#footer-bottom` |

Texto exato de `footer.copyright` (fora da tabela porque contém `|`, que quebraria a coluna):

```
Diseñado por Lotus OTEC | Copyright © 2022. OTEC Lotus.
```

## Não transcrito

- Nenhum texto visível (`p`, `li`, heading, `placeholder`, `mailto:`, copyright) ficou fora das tabelas acima — toda string de `dom.json` com mais de 3 caracteres aparece nesta página.
- Imagens sem `alt`: as imagens de `Somos` e dos três cards de `Cursos` têm `alt=""` no DOM atual — não há texto de imagem para transcrever, e a ausência do `alt` é ela mesma um achado (acessibilidade), não uma omissão desta extração.
- Nenhum `aria-label` foi encontrado nos campos do formulário (`ariaLabel: null` para todos em `dom.json`).
