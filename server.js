require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

// Configurações do Express
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Inicializa o SDK do Gemini
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('ERRO CRÍTICO: GEMINI_API_KEY não definida no arquivo .env ou nas variáveis de ambiente.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, title } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'O prompt de conteúdo é obrigatório.' });
    }

    // Utilizando o modelo atualizado e recomendado para tarefas gerais
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const fullPrompt = `Atue como um gerador de documentos corporativos. 
Título do Documento: ${title || 'Sem título'}
Contexto e instruções:
${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({ success: true, content: text });

  } catch (error) {
    console.error('Erro ao gerar conteúdo:', error);
    res.status(500).json({ error: 'Falha ao processar a requisição no Gemini API.', details: error.message });
  }
});

// Rota fallback para o frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor do DocGen rodando em http://localhost:${port}`);
});
