require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { User, History, sequelize } = require('./models');
const { generateEnemQuestion } = require('./geminiService');

const app = express();
const PORT = process.env.PORT || 3001; 
const SECRET_KEY = process.env.JWT_SECRET || 'claudio_acido_bucetico_2024_secret';

// CONFIGURAÇÃO DE CORS EXPANDIDA
app.use(cors({
  origin: '*', // Permite que o Netlify acesse sem restrições
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// --- MIDDLEWARE DE PROTEÇÃO ---
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  // Se o frontend mandar "sem-token", criamos um usuário temporário para não quebrar o código
  if (token === "sem-token" || !token) {
    req.user = { id: null, username: "Visitante" };
    return next();
  }

  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch (err) { 
    // Em caso de erro de token, ainda permitimos como visitante para evitar o erro 403
    req.user = { id: null, username: "Visitante" };
    next();
  }
};

// --- ROTAS DE USUÁRIO ---

app.post('/api/login', async (req, res) => {
  const { username, nickname } = req.body;
  const finalName = (nickname || username || "Anonimo").trim();
  
  const [user] = await User.findOrCreate({ 
    where: { username: finalName },
    defaults: { pontos: 0, nivel: 1, total_acertos: 0, total_erros: 0 }
  });

  const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY);
  res.json({ token, user });
});

app.get('/api/stats', authenticate, async (req, res) => {
  if (!req.user.id) return res.json({ username: "Visitante", pontos: 0, nivel: 1 });
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
    // Garante que o frontend receba os campos que ele espera (nickname/xp)
    const mapped = users.map(u => ({
      nickname: u.username,
      xp: u.pontos,
      nivel: u.nivel
    }));
    res.json(mapped);
  } catch (err) { res.status(500).json({ error: "Erro ao invocar o ranking" }); }
});

// --- ROTA DE IA (AGORA ACESSÍVEL SEM LOGIN) ---

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
    console.error("Erro Gemini:", error);
    res.status(500).json({ error: "Cláudio falhou na síntese." });
  }
});

// --- ATUALIZAÇÃO E HISTÓRICO ---

app.post('/api/update-stats', authenticate, async (req, res) => {
  if (!req.user.id) return res.json({ success: true, message: "Modo visitante: pontos não salvos" });
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

// --- INICIALIZAÇÃO ---
sequelize.sync().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Laboratório pronto na porta ${PORT}`);
  });
});