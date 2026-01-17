require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { User, Question, sequelize } = require('./models');
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

// 2. GERAÇÃO DE QUESTÕES (AGORA COM ANÁLISE DE CONTEXTO)
app.get('/api/generate-question', authenticate, async (req, res) => {
  try {
    const topic = req.query.topic || "Estequiometria";
    const customPrompt = req.query.customPrompt || "";
    const count = Math.min(parseInt(req.query.count) || 1, 5); 

    // Busca questões aleatórias já existentes para servir ao usuário
    const cachedQuestions = await Question.findAll({
      where: { topic: topic },
      order: sequelize.random(),
      limit: count
    });

    if (cachedQuestions.length >= count) {
      console.log(`📦 Cache hit: ${topic}`);
      return res.json(cachedQuestions);
    }

    console.log(`🤖 Cache miss: ${topic}. Solicitando reforço ao Cláudio...`);

    // --- NOVA LÓGICA DE CONTEXTO ---
    // Busca as questões existentes (mesmo que poucas) para enviar à IA como contexto de NÃO REPETIÇÃO
    const existingForContext = await Question.findAll({
      where: { topic: topic },
      attributes: ['text'],
      limit: 10 // Enviamos as últimas 10 para a IA ter base
    });

    // Chama a IA passando o que já existe no banco
    const aiQuestions = await generateEnemQuestion(topic, customPrompt, count, existingForContext);
    
    const savedQuestions = [];
    for (const q of aiQuestions) {
      // Evita duplicatas exatas caso a IA ignore o sistema de contexto (segurança extra)
      const [newQ, created] = await Question.findOrCreate({
        where: { text: q.text },
        defaults: {
          topic: topic,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation
        }
      });
      savedQuestions.push(newQ);
    }

    // Se a IA gerou menos do que o total esperado pelo frontend, 
    // mesclamos com o que já tínhamos no cache para não dar erro
    const finalResponse = savedQuestions.length >= count 
      ? savedQuestions 
      : [...savedQuestions, ...cachedQuestions].slice(0, count);

    res.json(finalResponse);
  } catch (error) {
    console.error("Erro na geração/caching:", error);
    res.status(500).json({ error: "Falha na geração de questões." });
  }
});

// 3. ROTA PARA CORRIGIR GABARITO
app.post('/api/fix-question', authenticate, async (req, res) => {
  try {
    const { questionId, newCorrectAnswer } = req.body;
    
    const question = await Question.findByPk(questionId);
    if (!question) {
      return res.status(404).json({ error: "Questão não encontrada no arquivo do Cláudio." });
    }

    await question.update({ correctAnswer: newCorrectAnswer });
    
    console.log(`🛠️ Questão ${questionId} corrigida por ${req.user.username}`);
    res.json({ success: true, message: "Reação estabilizada! Gabarito atualizado." });
  } catch (err) {
    res.status(500).json({ error: "Erro ao processar correção." });
  }
});

// 4. BUSCAR ESTATÍSTICAS
app.get('/api/stats', authenticate, async (req, res) => {
  if (!req.user.id) return res.status(401).json({ error: "Acesso negado" });
  try {
    const user = await User.findByPk(req.user.id);
    res.json({
      username: user.username,
      total_acertos: user.total_acertos || 0,
      total_erros: user.total_erros || 0,
      nivel: user.nivel || 1
    });
  } catch (err) { res.status(500).json({ error: "Erro ao buscar stats" }); }
});

// 5. ATUALIZAR ESTATÍSTICAS
app.post('/api/update-stats', authenticate, async (req, res) => {
  if (!req.user.id) return res.json({ success: true, msg: "Visitante não salva progresso" });
  try {
    const { acertos, erros } = req.body;
    const user = await User.findByPk(req.user.id);
    const novosAcertos = (user.total_acertos || 0) + (acertos || 0);
    const novosErros = (user.total_erros || 0) + (erros || 0);
    const novoNivel = Math.floor(novosAcertos / 10) + 1;
    await user.update({ total_acertos: novosAcertos, total_erros: novosErros, nivel: novoNivel });
    res.json({ success: true, nivel: novoNivel });
  } catch (err) { res.status(500).json({ error: "Erro ao salvar stats" }); }
});

// 6. RANKING
app.get('/api/rankings', async (req, res) => {
  try {
    const users = await User.findAll({ 
      order: [['total_acertos', 'DESC']], 
      limit: 10,
      attributes: ['username', 'total_acertos', 'nivel'] 
    });
    res.json(users.map(u => ({ nickname: u.username, xp: u.total_acertos, nivel: u.nivel })));
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