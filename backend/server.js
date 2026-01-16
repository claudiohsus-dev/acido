require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { User, History, sequelize } = require('./models');
const { generateEnemQuestion } = require('./geminiService');

const app = express();
const PORT = process.env.PORT || 3001; 
const SECRET_KEY = process.env.JWT_SECRET || 'claudio_acido_bucetico_2024_secret';

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// --- MIDDLEWARE DE PROTEÇÃO (CORRIGIDO) ---
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = { id: null, username: "Visitante" };
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (token === "sem-token") {
    req.user = { id: null, username: "Visitante" };
    return next();
  }

  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch (err) { 
    req.user = { id: null, username: "Visitante" };
    next();
  }
};

// --- ROTAS DE USUÁRIO ---

app.post('/api/login', async (req, res) => {
  try {
    const { nickname } = req.body;
    const finalName = (nickname || "Anonimo").trim();
    
    // Busca ou cria o aluno pelo nome
    const [user] = await User.findOrCreate({ 
      where: { username: finalName },
      defaults: { pontos: 0, nivel: 1, total_acertos: 0, total_erros: 0 }
    });

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: "Erro ao entrar no laboratório" });
  }
});

app.get('/api/stats', authenticate, async (req, res) => {
  if (!req.user.id) return res.json({ username: "Visitante", total_acertos: 0, nivel: 1 });
  try {
    const user = await User.findByPk(req.user.id);
    res.json(user);
  } catch (err) { res.status(500).json({ error: "Falha na análise de stats" }); }
});

// RANKING POR ACERTOS (ÚNICA ROTA)
app.get('/api/rankings', async (req, res) => {
  try {
    const users = await User.findAll({ 
      order: [['total_acertos', 'DESC']], 
      limit: 10,
      attributes: ['username', 'total_acertos', 'nivel'] 
    });
    
    const mapped = users.map(u => ({
      nickname: u.username,
      xp: u.total_acertos, // Mantemos 'xp' aqui para não quebrar o frontend antigo, mas enviamos acertos
      nivel: u.nivel
    }));
    res.json(mapped);
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

// --- ATUALIZAÇÃO ---
app.post('/api/update-stats', authenticate, async (req, res) => {
  if (!req.user.id) return res.json({ success: true, message: "Modo visitante" });
  try {
    const { acertos, erros } = req.body; // Recebemos os dados do TrainingView
    const user = await User.findByPk(req.user.id);
    
    const novosAcertos = (user.total_acertos || 0) + (acertos || 0);
    const novosErros = (user.total_erros || 0) + (erros || 0);
    
    // Nível baseado em acertos (ex: a cada 10 acertos sobe de nível)
    const novoNivel = Math.floor(novosAcertos / 10) + 1;

    await user.update({
      total_acertos: novosAcertos,
      total_erros: novosErros,
      nivel: novoNivel
    });
    
    res.json({ success: true, acertos: novosAcertos, nivel: novoNivel });
  } catch (err) { res.status(500).json({ error: "Erro ao oxidar stats" }); }
});

sequelize.sync().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Laboratório pronto na porta ${PORT}`);
  });
});