# Rollback do corte de `lotusotec.cl`

> Procedimento, não botão (`D-37`). Escrito a partir do ensaio de `B4` em
> `ensaio-corte.lotusotec.cl` (evidência em
> [`evidencia-backup-rollback-2026-09-29.md`](evidencia-backup-rollback-2026-09-29.md), §3): os
> tempos abaixo são os medidos lá, não estimados. Quem executa é João, ou Claude com autorização
> explícita dada naquele passo; no ensaio, o modo auto do Claude Code negou a Claude a chamada
> direta do 4b, e João rodou o 4b, o 4c e o 5 no terminal dele. Change batch de emergência em
> `infra/rollback-corte.json`.

## 0. A janela — conferir antes de cortar e antes de voltar

O WordPress serve um certificado Let's Encrypt válido até **2026-11-10T20:37:55Z** e sem caminho
de renovação (`D-51`). O HSTS do clone (`max-age=31536000`) fixa HTTPS por um ano em quem visitar:
voltar para o WordPress com certificado vencido é erro de TLS sem "prosseguir". Regra (spec D8):
**`B5` corta até 2026-10-27**, a menos que `D-51` esteja resolvido antes.

```bash
echo | openssl s_client -connect 185.146.167.195:443 -servername lotusotec.cl 2>/dev/null \
  | openssl x509 -noout -enddate
curl -sI --resolve lotusotec.cl:443:185.146.167.195 https://lotusotec.cl/ | head -1
```

Esperado: `notAfter=` pelo menos 14 dias à frente de hoje, e `HTTP/2 200`. Sem os dois, não há
para onde voltar; o rollback vira restauração de desastre (§7) noutro host.

## 1. O que o corte muda (`B5`)

Apex e `www`, `A` e `AAAA`: de `185.146.167.195` / `2a07:7800::195` (TTL 3600) para alias de
`dhpoztt69jydz.cloudfront.net`, em `infra/lotus-dns.yaml`, por change set. O alias não tem TTL no
template: o Route 53 responde com no máximo 60 s (no ensaio, de 22 a 60; evidência §3.3). Nada
mais muda de valor: o WordPress continua servindo no IP dele até `B7`, e o MX não é tocado.

Mas todo change set do `Registros` reescreve o grupo inteiro: o CloudFormation manda ao Route 53
um lote só, com `DELETE` de todos os registros como o stack os guarda e `CREATE` de todos os do
template novo — apex, `www`, MX, SPF, DKIM, DMARC e os demais, com os mesmos valores (evidência
§3.6). O Route 53 aplica o lote inteiro ou nada. Os dois CNAMEs de validação do ACM ficam fora do
grupo e não entram no lote.

O número do corte é o TTL do registro antigo. Depois da troca, parte das consultas segue indo ao
WordPress por até 3600 s; com os caches cheios, como o tráfego deixa os do apex e do `www`, até a
primeira resposta nova de um resolvedor público espera o TTL que resta ao registro antigo: no
estágio 4a, cerca de 30 min, com entradas buscadas meia hora antes (evidência §3.4); na remoção do
estágio 5, 56 min, com entradas buscadas 5 min antes (§3.7). Smoke verde no domínio logo depois do
corte não quer dizer que todos os visitantes já estão na distribuição. Baixar o TTL do apex e do
`www` para 60 pelo menos 3600 s antes do corte encurta essa cauda; é decisão de `B5`.

## 2. Gatilho

Depois do corte, `pnpm smoke` com `SMOKE_URL=https://lotusotec.cl` (sem `SMOKE_VIA`) reprovando em
qualquer dos itens 2 a 6 (TLS, redirects, home, assets, formulário), ou o site fora do ar. Itens
1, 7, 8 e 9 reprovando são regressão que um deploy corrige, não motivo de rollback.

## 3. Caminho A — change set (principal)

Medido no estágio 3 do ensaio (evidência §3.3): 7 s para criar o change set e 66 s do `execute` ao
`UPDATE_COMPLETE` do `Registros` (de 65 a 67 s em todos os estágios). A troca chegou aos quatro
nameservers do Route 53 de 8 a 13 s depois do `execute`, e a última resposta antiga nos
resolvedores públicos saiu 48 s depois dele: o teto é a troca mais o TTL do alias, cerca de 73 s.
O `UPDATE_COMPLETE` e a volta do `wait` chegam depois do DNS e não servem de relógio do rollback.
No corte real, o que domina é o tempo de revisar e autorizar o change set.

```bash
git checkout <sha anterior ao corte> -- infra/lotus-dns.yaml scripts/infra/lib/zona.mjs
source ~/.nvm/nvm.sh >/dev/null && nvm use >/dev/null && pnpm exec vitest run scripts/infra/zona.test.mjs
export AWS_PROFILE=lotus
aws cloudformation deploy --region us-east-1 --stack-name lotus-dns \
  --template-file infra/lotus-dns.yaml --tags Projeto=lotus-site --no-execute-changeset
aws cloudformation describe-change-set --region us-east-1 --change-set-name <arn> \
  --query 'Changes[].ResourceChange.{Acao:Action,Recurso:LogicalResourceId,Substituicao:Replacement}' --output table
# esperado: uma linha, Modify Registros False
```

Revisar o change set comparando `BeforeContext` com `AfterContext` por `Name` e `Type`, não pelos
`Details`: o `Path` dos `Details` aponta um índice da lista que não é o do registro que muda (cinco
vezes no ensaio, evidência §3.2).

```bash
aws cloudformation describe-change-set --region us-east-1 --change-set-name <arn> \
  --include-property-values --output json > /tmp/rollback-cs.json
node -e '
const c = JSON.parse(require("fs").readFileSync("/tmp/rollback-cs.json", "utf8")).Changes[0].ResourceChange
const lado = (ctx) => new Map(JSON.parse(ctx).Properties.RecordSets.map((r) => [`${r.Name} ${r.Type}`, JSON.stringify(r)]))
const [antes, depois] = [lado(c.BeforeContext), lado(c.AfterContext)]
for (const k of new Set([...antes.keys(), ...depois.keys()])) if (antes.get(k) !== depois.get(k)) console.log(k)'
# esperado: lotusotec.cl. A, lotusotec.cl. AAAA, www.lotusotec.cl. A e www.lotusotec.cl. AAAA, nada mais
aws cloudformation execute-change-set --region us-east-1 --change-set-name <arn>
aws cloudformation wait stack-update-complete --region us-east-1 --stack-name lotus-dns
```

Depois, commit da volta na branch do incidente (`fix(7.2.5): …`); o template é a fonte.

## 4. Caminho B — emergência (`UPSERT` direto)

Medido no estágio 4b (evidência §3.5): a API respondeu em cerca de 1 s, e o
`wait resource-record-sets-changed` voltou 34 s depois da chamada, com `INSYNC`. A troca chegou aos
quatro nameservers de 2 a 12 s depois da chamada, e a última resposta antiga nos públicos saiu 63 s
depois dela (teto de cerca de 72 s). A cauda do DNS é a mesma do caminho A, porque quem a limita é
o TTL do alias; o caminho B ganha por dispensar criar e ler o change set. Para quando o caminho A
não pode esperar o CloudFormation, ou ele está travado.

```bash
export AWS_PROFILE=lotus
ZONA=$(aws cloudformation describe-stacks --region us-east-1 --stack-name lotus-dns \
  --query "Stacks[0].Outputs[?OutputKey=='IdDaZona'].OutputValue" --output text)
MUDANCA=$(aws route53 change-resource-record-sets --hosted-zone-id "$ZONA" \
  --change-batch file://infra/rollback-corte.json --query ChangeInfo.Id --output text)
aws route53 wait resource-record-sets-changed --id "$MUDANCA"
```

**O template continua dizendo alias.** Enquanto disser, nenhum `deploy` do `lotus-dns` pode
rodar — ele reaplicaria o corte. O drift não acusa a divergência: o `detect-stack-drift` deste
stack só compara a `Zona`, e o `Registros` sai `NOT_CHECKED` (evidência §3.4 e §3.5). A
reconciliação (§5) é obrigatória e vem logo depois.

## 5. Reconciliação depois do caminho B

Medido no estágio 4c (evidência §3.6): passa. O change set com o template de antes do corte
reconcilia sozinho: o stack volta a `UPDATE_COMPLETE` com o template do WordPress, e a zona não
muda (nenhuma das 840 respostas da amostragem fugiu do WordPress durante a atualização). Custa um
change set comum: 8 s para criar e 65 s do `execute` ao `UPDATE_COMPLETE`. Rodar o caminho A logo
depois do B, com três cuidados:

1. **O template é o de antes do corte**, o que corresponde ao que o `UPSERT` escreveu. O
   CloudFormation reescreve o grupo inteiro pelo template, e o diff que o change set mostra é
   contra o template guardado no stack (o alias), não contra a zona: as mesmas quatro linhas do
   caminho A.
2. **Conferir a zona pela API antes do `execute`:** apex e `www`, `A` e `AAAA`, em
   `ResourceRecords` do WordPress, TTL 3600, sem `AliasTarget`.

   ```bash
   aws route53 list-resource-record-sets --hosted-zone-id "$ZONA" --output json \
     --query "ResourceRecordSets[?(Name=='lotusotec.cl.' || Name=='www.lotusotec.cl.') && (Type=='A' || Type=='AAAA')]"
   ```

3. **Executar sem rollback automático:**

   ```bash
   aws cloudformation execute-change-set --region us-east-1 --change-set-name <arn> --disable-rollback
   aws cloudformation wait stack-update-complete --region us-east-1 --stack-name lotus-dns
   ```

   O lote do CloudFormation apaga o alias como o stack o guarda, e esse alias já não está na zona.
   No ensaio, o Route 53 aceitou; a documentação dele diz o contrário ("To delete a resource record
   set, you must specify all the same values that you specified when you created it"), então isso
   não é garantia. Se o Route 53 recusar, o lote não se aplica e a zona segue no WordPress, mas o
   rollback automático do CloudFormation tentaria devolver o `Registros` ao template guardado — o
   alias, isto é, o corte. Com `--disable-rollback`, o stack para em `UPDATE_FAILED` e a zona fica
   como está. Nesse caso, **não** rodar `rollback-stack` nem `continue-update-rollback`, que voltam
   ao último estado estável, o do corte: o site já está de volta, e a saída do stack se decide fora
   deste procedimento. O caso de recusa não foi ensaiado, nem o `--disable-rollback`.

Um `DELETE` velho de registro comum (um registro editado à mão na zona, com outros valores que os
do stack) também não foi ensaiado: o ensaio cobre o caso do corte, em que o lado velho é o alias da
distribuição e a zona tem o que `infra/rollback-corte.json` escreve.

## 6. Conferir depois de voltar

```bash
source ~/.nvm/nvm.sh >/dev/null && nvm use >/dev/null
AWS_PROFILE=lotus node scripts/infra/medir-propagacao.mjs --nome lotusotec.cl --esperado wordpress
AWS_PROFILE=lotus node scripts/infra/medir-propagacao.mjs --nome www.lotusotec.cl --esperado wordpress
AWS_PROFILE=lotus pnpm infra:conferir-zona --pos-delegacao --saida /tmp/conferencia-rollback.md
curl -sI https://lotusotec.cl/ | grep -i '^server:'     # não pode ser CloudFront
```

Como ler: o `convergiu em` é a primeira resposta nova de cada resolvedor, não a última antiga
(evidência §3.2). Uma medição que começa depois do `wait`, uns 100 s depois do `execute`, dá `0 s`
porque a cauda do alias (até 60 s) já acabou, não porque a troca foi instantânea. O
`conferir-zona` compara os quatro nameservers com o inventário de `scripts/infra/lib/zona.mjs`, o
de antes do corte depois do checkout de §3, e deve sair 0; sem `--saida`, ele grava o relatório em
`docs/infra/`. Desde `7.2.5` ele também confere linha de alias, então roda dos dois lados do corte.

E uma mensagem de e-mail de fora para `contacto@lotusotec.cl`: o MX não foi tocado, mas a prova é
a mensagem chegando, como em `B1`.

## 7. Rollback de desastre — o backup

Se o host perder o WordPress, a volta é restaurar o backup do StackCP (arquivos + dump; hashes e
guarda em `evidencia-backup-rollback-2026-09-29.md`, §1) pelo painel do StackCP — arquivos em
`public_html`, dump importado pelo phpMyAdmin no banco do `wp-config.php` do host. Não foi
exercitado no host (spec D4); a restauração local de §2 da evidência é a prova do conteúdo.

Sem login no `wp-admin` (spec D2), a senha do administrador se recupera pelo phpMyAdmin:

```sql
SELECT ID, user_login FROM wp_users;
UPDATE wp_users SET user_pass = MD5('senha-nova-temporaria') WHERE user_login = '<login>';
```

O WordPress rehasheia no primeiro login. Trocar a senha de novo pelo painel depois.

Fora do StackCP, noutro host, faltam duas peças que são do host, não do backup:

- a biblioteca `/usr/share/php/wp-stack-cache.php`, que o mu-plugin
  `wp-content/mu-plugins/wp-stack-cache.php` do backup exige: sem desativar o mu-plugin, a home
  para num aviso de `require` (evidência §2; o ensaio o renomeou só na cópia);
- a proteção que hoje responde `401` em `https://lotusotec.cl/wp-login.php` (cabeçalho
  `x-stackprotect-id`), que não é do WordPress: a cópia restaurada respondeu `200`. Proteger o
  `wp-login.php` antes de apontar o DNS para o host novo.
