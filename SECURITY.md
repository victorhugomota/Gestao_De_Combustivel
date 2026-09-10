# Segurança e dados

Este é um app pessoal (família Mota, 1 veículo flex) hospedado no GitHub Pages.
Toda a persistência é no Firebase (Firestore + Storage) do projeto
`consumocombustivel-3adda`.

## Estado atual

- As chaves do Firebase no código-fonte **são públicas por design** — isso é
  normal em apps web Firebase. A segurança real depende das **regras**.
- Enquanto as regras estiverem em "modo teste", **qualquer pessoa** com a URL
  pode ler, gravar e apagar os dados e gerar custo de leitura na conta.

## O que fazer (uma vez)

1. **Habilitar login anônimo**
   Firebase Console → Authentication → Sign-in method → **Anônimo** → Ativar.
   O app já faz login anônimo automático (`src/firebase.js`). Se você não
   habilitar, o app continua funcionando, mas as regras abaixo bloqueiam tudo.

2. **Publicar as regras deste repositório**

   Com a Firebase CLI:
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules,storage:rules --project consumocombustivel-3adda
   ```

   Ou manualmente: copie `firestore.rules` em Console → Firestore → Regras, e
   `storage.rules` em Console → Storage → Regras, e publique.

3. **(Opcional, mais restritivo)**
   Para liberar só para vocês dois, troque o provedor Anônimo por
   **E-mail/Senha**, crie os dois usuários e, em `firestore.rules`, troque
   `request.auth != null` por uma checagem de UID:
   ```
   function isFamilia() {
     return request.auth != null && request.auth.uid in ['UID_VICTOR', 'UID_MARIA'];
   }
   ```

## Backup

Os dados vivem só no Firestore. Exporte periodicamente em
Console → Firestore → Importar/Exportar, ou use
`gcloud firestore export gs://<bucket>`.

## Dependências externas (sem SLA)

| Serviço | Uso | Risco |
|---|---|---|
| `router.project-osrm.org` | distâncias viárias | servidor demo, pode cair — o app cai para estimativa e sinaliza |
| `nominatim.openstreetmap.org` / `photon.komoot.io` | autocomplete de endereço | rate-limit; há cache local de 30 dias em `src/utils/geocode.js` |
| `viacep.com.br` | CEP → endereço | idem |
| Projeto `sitedeviagens-f1aaa` | leitura da coleção `trips` | esquema definido por outro app; campos lidos com fallback |
