const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;

// Rota simples para gerar um trace. O delay artificial existe só para que o
// span tenha uma duração visível quando você olhar o trace no Grafana.
app.get('/ola', (req, res) => {
  const delayMs = 100 + Math.floor(Math.random() * 200);

  setTimeout(() => {
    res.json({
      mensagem: 'Olá do api-node!',
      delayMs,
    });
  }, delayMs);
});

app.get('/saude', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`api-node escutando na porta ${PORT}`);
});
