# Quizsage Client
Client tools for interacting with quizsage api


## REPL Usage
You can fire up a repl:
```bash
cp cli/env.template cli/.env # edit me

npm run cli
```

## Basic Usage
Checkout the [source code](./lib/API.js) for all options

```js
const { API } = require("quizsage-client");


const api = new API({
    address : "localhost",
    port : 1234,
    protocol : "http",
});

await api.login("USERNAME", "PASSWORD");

await api.bible_books();
```
