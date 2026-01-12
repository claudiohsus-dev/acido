// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { User, History, sequelize } = require('./models');
const { generateEnemQuestion } = require('./geminiService');

const app = express();
const PORT = process.env.PORT || 3001; // Dinâmico para o Render/Railway
const SECRET_KEY = process.env.JWT_SECRET || 'claudio_acido_bucetico_2024_secret';

app.use(cors());
app.use(express.json());

// --- MIDDLEWARE DE PROTEÇÃO ---
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Acesso negado. Cadê o reagente?" });
  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch (err) { res.status(403).json({ error: "Sessão expirada no ácido." }); }
};

// --- ROTAS DE USUÁRIO ---

app.post('/api/login', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Nome de alquimista obrigatório" });
  
  const [user] = await User.findOrCreate({ 
    where: { username: username.trim() },
    defaults: { pontos: 0, nivel: 1, total_acertos: 0, total_erros: 0 }
  });

  const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY);
  res.json({ token, user });
});

app.get('/api/stats', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.json(user);
  } catch (err) { res.status(500).json({ error: "Falha na análise de stats" }); }
});

app.get('/api/rankings', async (req, res) => {
  try {
    const users = await User.findAll({ 
      order: [['pontos', 'DESC']], 
      limit: 10,
      attributes: ['username', 'pontos', 'nivel'] 
    });
    res.json(users);
  } catch (err) { res.status(500).json({ error: "Erro ao invocar o ranking" }); }
});

// --- ROTA DE IA ---

app.get('/api/generate-question', authenticate, async (req, res) => {
  try {
    const topic = req.query.topic || "Estequiometria";
    const prompt = req.query.customPrompt || "";
    const count = Math.min(parseInt(req.query.count) || 1, 10); 
    
    const questions = [];
    for (let i = 0; i < count; i++) {
      const q = await generateEnemQuestion(topic, prompt);
      questions.push({ ...q, id: `${Date.now()}-${i}` });
    }
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: "Cláudio falhou na síntese." });
  }
});

// --- ATUALIZAÇÃO E HISTÓRICO ---

app.post('/api/update-stats', authenticate, async (req, res) => {
  try {
    const { points, acertos, erros } = req.body;
    const user = await User.findByPk(req.user.id);
    const novosPontos = (user.pontos || 0) + (points || 0);
    const novoNivel = Math.floor(novosPontos / 500) + 1;

    await user.update({
      pontos: novosPontos,
      total_acertos: (user.total_acertos || 0) + (acertos || 0),
      total_erros: (user.total_erros || 0) + (erros || 0),
      nivel: novoNivel
    });
    res.json({ success: true, points: novosPontos, level: novoNivel });
  } catch (err) { res.status(500).json({ error: "Erro ao oxidar stats" }); }
});

app.post('/api/submit', authenticate, async (req, res) => {
  try {
    const { topic, correct, questionText, userAnswer } = req.body;
    await History.create({ topic, correct, questionText, userAnswer, UserId: req.user.id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Erro no log" }); }
});

app.get('/api/history', authenticate, async (req, res) => {
  try {
    const history = await History.findAll({
      where: { UserId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    res.json(history);
  } catch (err) { res.status(500).json({ error: "Erro no histórico" }); }
});

// --- INICIALIZAÇÃO ÚNICA E CORRETA ---
sequelize.sync().then(() => {
  // O '0.0.0.0' é fundamental para que o serviço seja exposto na rede
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪
    🚀 CLÁUDIO DO ÁCIDO BUCÉTICO
    🔥 Laboratório pronto na porta ${PORT}
    🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪
    `);
  });
});