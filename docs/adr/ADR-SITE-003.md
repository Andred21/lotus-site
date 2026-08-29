# ADR-SITE-003 · O intake do contato é um módulo, não quatro

- **Status:** aceito
- **Data:** 2026-08-29
- **Escopo:** bloco `refactor-contato-intake`

## Contexto

O bloco `4.1.1`–`4.1.10` entregou o envio do formulário em quatro módulos:
`submit.ts`, `service.ts`, `sender.ts` e `web3forms.ts`. Três eram shallow — a interface custava
quase o mesmo que a implementação. `sender.ts` tinha 23 linhas: dois tipos e um
`Promise.resolve`. A revisão de arquitetura de 2026-08-29 mediu isso e o
`deletion test` respondeu "concentra" para os três.

O plano daquele bloco
(`docs/superpowers/plans/2026-08-27-4.1.1-4.1.10-formulario-integracoes.md:363-771`) prescreve
essa separação arquivo a arquivo. Plano é artefato fechado de bloco fechado, não catraca.

## Decisão

Os aceites das EAP `4.1.3`, `4.1.4` e `4.1.5` são **propriedades**, não layout de arquivo. O texto
está em `docs/superpowers/specs/2026-08-27-4.1.1-4.1.10-formulario-integracoes-design.md:160-166`:

- `4.1.3` — a entrada normaliza e valida antes de qualquer chamada de rede e não conhece o provedor.
- `4.1.4` — o serviço roda inteiro contra uma porta fake.
- `4.1.5` — a feature depende da porta, não do adapter; nenhum tipo do provedor vaza.

`src/integrations/contact/intake.ts` preserva as três: valida antes de qualquer rede, roda inteiro
contra um `ContactSender` falso em `intake.test.ts`, e depende do tipo da porta que ele mesmo
declara — nunca de `createWeb3FormsSender`. O adapter importa a porta do núcleo, que é a direção
canônica de ports & adapters.

## Consequências

Uma submissão passa a atravessar dois módulos em vez de quatro, e o contrato do resultado
(`ContactSubmitResult`) existe uma vez, em `src/lib/contact-schema.ts`, onde componente e
integração podem vê-lo sem violar a catraca de direção de dependências.

`readContactFormData` deixou de ser exportada: a interface do intake é a superfície de teste.
"Campo ausente vira string vazia" continua provado — agora pelo resultado que produz.

**Este ADR existe para que a próxima revisão de arquitetura não leia o plano de `4.1.x`, veja a
separação prescrita e proponha re-separar.** Trocar de provedor continua sendo trabalho de um
arquivo só: escrever outro adapter e mudar a linha de composição em `src/app/App.tsx`.
