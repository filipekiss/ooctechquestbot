# OOC Tech Quest Bot

Um bot pra encaminhar mensagens do [grupo Tech Quest][grupo] no Telegram para o [canal
OOC Tech Quest][canal]

## Como usar o bot

Copie o arquivo `environment.ts.example` para `environment.ts`. O `BOT_TOKEN`
é o token da API do Telegram. O `ARCHIVE_CHANNEL_ID` é a ID do canal pra onde as
mensagens devem ser encaminhadas.


Variáveis de ambiente (`.env`): `BOT_TOKEN`, `BOT_USERNAME`, `ARCHIVE_CHANNEL_ID`
(canal do /ooc), `QUOTES_CHANNEL_ID` (canal onde as quotes ficam salvas, opcional:
sem ele as quotes ficam desativadas), `DB_NAME` e `AMAZON_AFFILIATE_TAG`.

Execute `npm start`. Para usar um bot de teste, crie `.env.dev` e rode `npm run dev`.
Testes: `npm test`.

[grupo]: https://t.me/joinchat/S2uNQsSa1Q4cBHHC
[canal]: https://t.me/ooctechquest
