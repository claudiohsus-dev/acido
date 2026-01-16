require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { User, sequelize } = require('./models');
const { generateEnemQuestion } = require('./geminiService');

const app = express();
const PORT = process.env.PORT || 3001; 
const SECRET_KEY = process.env.JWT_SECRET || 'segredo_padrao_dev';

app.use(cors({ origin: '*' }));
app.use(express.json());

// --- MIDDLEWARE DE AUTENTICAÇÃO ---
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = { id: null, username: "Visitante" };
    return next();
  }
  
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch (err) { 
    req.user = { id: null, username: "Visitante" };
    next();
  }
};

// --- ROTAS ---

// 1. LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { nickname } = req.body;
    const finalName = (nickname || "Anonimo").trim();
    const [user] = await User.findOrCreate({ 
      where: { username: finalName },
      defaults: { total_acertos: 0, total_erros: 0, nivel: 1 }
    });
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY);
    res.json({ token, user });
  } catch (err) { res.status(500).json({ error: "Erro no login" }); }
});

// 2. GERAÇÃO DE QUESTÕES
app.get('/api/generate-question', authenticate, async (req, res) => {
  try {
    const topic = req.query.topic || "Estequiometria";
    const prompt = req.query.customPrompt || "";
    const count = Math.min(parseInt(req.query.count) || 1, 5); 
    
    const questions = await generateEnemQuestion(topic, prompt, count);
    
    const questionsWithIds = questions.map((q, i) => ({
      ...q,
      id: `${Date.now()}-${i}`
    }));

    res.json(questionsWithIds);
  } catch (error) {
    res.status(500).json({ error: "Falha na geração." });
  }
});

// 3. BUSCAR ESTATÍSTICAS (A que estava dando 404)
app.get('/api/stats', authenticate, async (req, res) => {
  if (!req.user.id) return res.status(401).json({ error: "Acesso negado" });
  
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    res.json({
      username: user.username,
      total_acertos: user.total_acertos || 0,
      total_erros: user.total_erros || 0,
      nivel: user.nivel || 1
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
});

// 4. ATUALIZAR ESTATÍSTICAS
app.post('/api/update-stats', authenticate, async (req, res) => {
  if (!req.user.id) return res.json({ success: true, msg: "Visitante não salva progresso" });
  
  try {
    const { acertos, erros } = req.body;
    const user = await User.findByPk(req.user.id);
    
    const novosAcertos = (user.total_acertos || 0) + (acertos || 0);
    const novosErros = (user.total_erros || 0) + (erros || 0);
    const novoNivel = Math.floor(novosAcertos / 10) + 1;

    await user.update({
      total_acertos: novosAcertos,
      total_erros: novosErros,
      nivel: novoNivel
    });
    
    res.json({ success: true, nivel: novoNivel });
  } catch (err) { res.status(500).json({ error: "Erro ao salvar stats" }); }
});

// 5. RANKING
app.get('/api/rankings', async (req, res) => {
  try {
    const users = await User.findAll({ 
      order: [['total_acertos', 'DESC']], 
      limit: 10,
      attributes: ['username', 'total_acertos', 'nivel'] 
    });
    const mapped = users.map(u => ({
      nickname: u.username,
      xp: u.total_acertos,
      nivel: u.nivel
    }));
    res.json(mapped);
  } catch (err) { res.status(500).json({ error: "Erro no ranking" }); }
});

// --- INICIALIZAÇÃO ---
sequelize.sync().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Cláudio está online na porta ${PORT}`);
  });
}).catch(err => {
  console.error("❌ Erro ao sincronizar banco de dados:", err);
});