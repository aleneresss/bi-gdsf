const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const LOG_DIR = '\\\\truenas\\TI\\AUTOMACAO\\DISPARO_GURU\\MATRIZ\\logs_guru';

// Função para extrair a data do nome do arquivo no formato chatguru_log_YYYY-MM-DD.json
function extrairDataDoNome(nomeArquivo) {
  const regex = /^chatguru_log_(\d{4}-\d{2}-\d{2})\.json$/;
  const match = nomeArquivo.match(regex);
  return match ? match[1] : null;
}

// Rota para listar datas baseadas nos nomes dos arquivos
app.get('/datas', (req, res) => {
  try {
    const arquivos = fs.readdirSync(LOG_DIR).filter(f => f.endsWith('.json'));
    const datas = arquivos
      .map(extrairDataDoNome)
      .filter(Boolean)
      .sort((a,b) => b.localeCompare(a)); // ordem decrescente
    res.json(datas);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar datas' });
  }
});

// Rota para retornar dados de uma data específica
app.get('/dados', (req, res) => {
  const data = req.query.data;
  if (!data) return res.status(400).json({ error: 'Parâmetro data obrigatório' });

  // Procura arquivo que contenha a data no nome
  const arquivos = fs.readdirSync(LOG_DIR);
  const arquivoDesejado = arquivos.find(f => f.includes(data) && f.endsWith('.json'));

  if (!arquivoDesejado) {
    return res.status(404).json({ error: 'Arquivo de dados não encontrado para essa data' });
  }

  const caminho = path.join(LOG_DIR, arquivoDesejado);

  try {
    const registros = JSON.parse(fs.readFileSync(caminho, 'utf8'));

    const agrupado = {};
    let totalDia = 0;

    registros.forEach(reg => {
      const dataHora = new Date(reg.timestamp);
      if (isNaN(dataHora)) return;

      const hora = dataHora.toTimeString().slice(0,2) + ':00';
      const origem = reg.file_name || 'Desconhecida';

      if (!agrupado[hora]) agrupado[hora] = {};
      if (!agrupado[hora][origem]) agrupado[hora][origem] = 0;
      agrupado[hora][origem]++;
      totalDia++;
    });

    res.json({ agrupado, totalDia });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao ler o arquivo' });
  }
});

const PORT = 3000;
app.use(express.static('public'));
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
