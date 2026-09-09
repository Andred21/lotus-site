# ADR-SITE-006 · A zona DNS vai para o Route 53; o registro do domínio fica onde está

- **Status:** aceito
- **Data:** 2026-09-09
- **Escopo:** bloco `B1`, EAP `7.2.1`
- **Substitui:** nada. Detalha a secção **Domínio** da `ADR-SITE-004`, que dizia apenas que
  `lotusotec.cl` não seria tocado naquele bloco.

## Contexto

O clone está publicado num endereço `*.cloudfront.net` desde 2026-09-04 e não tem domínio. João
decidiu em 2026-09-09 que toda a infraestrutura do site fica na AWS.

O domínio é comprado na **BlueHosting** e a zona é gerenciada no **Stack Control Panel**
(`https://www.stackcp.com/`). João informou na mesma data que **perdeu o acesso ao painel**
(`D-44`).

### O que a zona serve hoje, medido

Medição de 2026-09-09 por DNS-over-HTTPS contra `dns.google`. O inventário completo está em
`docs/infra/zona-dns-lotusotec.md`; o que importa para a decisão:

| Registro                       | Valor                                                           | Serve                     |
| ------------------------------ | --------------------------------------------------------------- | ------------------------- |
| `NS`                           | `ns1..ns4.stackdns.com`                                         | delegação atual           |
| `A` / `AAAA` do apex           | `185.146.167.195` / `2a07:7800::195`                            | WordPress na BlueHosting  |
| `MX`                           | `ASPMX.L.GOOGLE.COM` e as quatro `ALT*`                         | **e-mail corporativo**    |
| `TXT` do apex                  | `v=spf1 include:_spf.google.com include:spf.stackmail.com -all` | SPF                       |
| `mail`                         | `CNAME ghs.googlehosted.com`                                    | Google                    |
| `smtp`, `imap`, `autodiscover` | `CNAME *.stackmail.com`                                         | provedor antigo de e-mail |
| `ftp`                          | `CNAME ftp.us.stackcp.com`                                      | painel                    |
| `*`                            | `A 185.146.167.195`                                             | **wildcard**              |

Três ausências, também medidas: **não há DMARC**, **não há DKIM** publicado em
`google._domainkey`, e **não há CAA**. As duas primeiras viram `D-46`; a terceira é boa notícia,
porque CAA restritivo bloquearia a emissão do certificado pelo ACM.

### Por que o painel atual não serve

- **Não há editor de registros disponível** — medido em 2026-09-03, antes mesmo da perda de acesso.
  Sem editor não há como criar o CNAME que a validação do ACM exige, e sem certificado não há
  domínio próprio no CloudFront.
- **O painel limita a um subdomínio**, e João precisa de `sistema.lotusotec.cl` para o Lotus
  administrativo. (O wildcard hoje mascara esse limite no DNS, o que é acidente, não solução —
  ver `D-45`.)
- **Não há API, diff nem versionamento.** É o mesmo argumento que fez a `ADR-SITE-004` escolher
  CloudFormation em vez de console: ambiente que não produz diff não é revisável.
- **O SES vai precisar de DKIM e MAIL FROM**, que são mais registros na zona (`ADR-SITE-005`).

## Decisão

**A zona de `lotusotec.cl` passa a ser hospedada no Route 53. O registro do domínio continua na
BlueHosting.**

### Por que o registro não move

A AWS recusa. A página do TLD `.cl` na documentação do registrador do Route 53, lida em 2026-09-09,
diz:

> You can no longer use Route 53 to register new .cl domains or transfer .cl domains to Route 53.
> We'll continue to support .cl domains that are already registered with Route 53.

A mesma página registra que `.cl` não tem privacy protection, não tem domain locking e não suporta
DNSSEC no registrador.

Isso não impede nada do que interessa: o Route 53 hospeda zona de **qualquer** TLD, registrado onde
for. A própria documentação separa as duas coisas — "You can use the Route 53 DNS service with any
top-level domain you choose and with any domain registrar".

O que fica na BlueHosting, portanto, é **um botão só**: a tela de nameservers. Renovação do domínio
também continua lá, e isso é risco operacional a registrar — domínio que expira derruba o site e o
e-mail junto, e o alarme dessa data não está na AWS.

### O que a zona nova contém

1. Cópia fiel de todo registro do inventário, **incluindo o MX do Google intocado**.
2. `sistema.lotusotec.cl` como registro explícito, no lugar de depender do wildcard.
3. Alias `A` e `AAAA` do apex e de `www` para a distribuição CloudFront — criados no corte
   (`B5`), não na migração.
4. Registros de validação do ACM e, depois, DKIM e MAIL FROM do SES.
5. **O wildcard `*` não atravessa.** Wildcard esconde erro de digitação e faz qualquer subdomínio
   inventado responder o IP do WordPress. Se o export BIND revelar nome que hoje só funciona por
   causa dele, esse nome vira registro explícito — um a um, com dono conhecido.

### Certificado

ACM em **`us-east-1`**, não em `sa-east-1`. Não é preferência: o CloudFront só lê certificado dessa
região. Validação por DNS, com os CNAME criados na zona do Route 53 — que é exatamente o que o
painel atual não permitia fazer.

## A janela de propagação é o risco central

O TTL dos registros da zona é `3600`, mas quem manda na troca é o TTL da **delegação no registro
`.cl`**, que não controlamos e costuma ser bem maior. Entre a troca de nameserver e a convergência,
resolvedores diferentes vão perguntar a servidores diferentes: parte do mundo lê a StackDNS, parte
lê o Route 53.

A consequência prática é uma regra, não um cuidado: **a zona no Route 53 precisa ser uma cópia
exata da atual antes da troca**, para que as duas respostas sejam a mesma resposta. Registro
esquecido não aparece como erro no momento da troca — aparece como serviço que funciona para uns e
não para outros, de forma intermitente, por até dois dias.

Por isso o apontamento para o CloudFront **não** entra na migração. `B1` move a zona sem mudar o
que ela responde. Mudar o que ela responde é `B5`, com a zona já estável num lugar só.

Também por isso o export BIND é pendência de verdade: com wildcard na zona (`D-45`), enumerar por
tentativa devolve resposta para qualquer palpite, e "conferi e não achei mais nada" é uma frase que
não pode ser dita honestamente sem o export.

## Custo

| Item                  | Preço                                 | Observação                                |
| --------------------- | ------------------------------------- | ----------------------------------------- |
| Hosted zone           | US$ 0,50/mês                          | por zona                                  |
| Consultas             | US$ 0,40 por milhão (primeiro bilhão) | irrelevante nesta escala                  |
| Alias para CloudFront | grátis                                | consulta a alias de recurso AWS não conta |
| Certificado ACM       | grátis                                | para uso em recurso AWS                   |
| Health check (`B6`)   | US$ 0,50–0,75/mês                     | quando existir                            |

O `AWS::Budgets::Budget` de US$ 30 filtra hoje S3 e CloudFront. **O filtro precisa passar a incluir
Route 53**, senão o teto deixa de medir parte da conta no momento em que a zona existir. Isso é
entrega de `B1`, não item futuro.

## Consequências

- O limite de um subdomínio deixa de existir. `sistema.lotusotec.cl` e qualquer outro passam a ser
  um `ChangeResourceRecordSets`, versionável em CloudFormation como o resto do ambiente.
- A zona pode entrar no CloudFormation junto do resto da infra — mas **não na criação**: importar
  registro a registro num template antes de a zona estar provada aumenta o custo do erro. A decisão
  de quando adotar CloudFormation para a zona fica para `B1`, com a zona já respondendo.
- `sistema.lotusotec.cl` ganhar registro **não** abre a integração com a API do Lotus: essa task
  (`8.2.1`) está congelada por decisão de João em 2026-09-09. DNS é endereço, não integração.
- Enquanto `D-44` não for resolvido, nada disto é executável. O bloco `B1` não começa por AWS —
  começa por recuperar acesso na BlueHosting.
- DNSSEC continua fora. O registrador `.cl` não o suporta, o que torna a troca de nameservers
  segura: não há cadeia de confiança para quebrar no meio do caminho.
- O e-mail corporativo continua no Google Workspace por decisão de João em 2026-09-09. A migração
  da zona **não** é migração de e-mail, e o MX é o registro que mais exige conferência antes e
  depois da troca.
