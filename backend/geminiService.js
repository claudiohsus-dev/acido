const Groq = require("groq-sdk");

const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY 
});

/**
 * Motor de IA: CLÁUDIO
 * Agora analisa o banco de dados e gera dados técnicos (Massas e Reações).
 */
const generateEnemQuestion = async (topic, customPrompt, count = 1, existingContext = []) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("Chave da API Groq não configurada.");
    }

    // Preparar o resumo do que já existe para a IA não repetir
    const samples = existingContext.length > 0 
      ? existingContext.map(q => `- ${q.text.substring(0, 100)}...`).join('\n')
      : "Nenhuma amostra anterior.";

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Você é o CLÁUDIO, um químico genial e sarcástico.
          Sua tarefa: Gerar um JSON com ${count} questões de Química (Nível ENEM) sobre o tema solicitado.
          
          ⚠️ REGRAS DE CONTEÚDO TÉCNICO:
          1. Se a questão envolver cálculos, você DEVE obrigatoriamente fornecer as Massas Molares necessárias (ex: H=1, O=16, C=12 g/mol) ao final do enunciado.
          2. Se houver uma reação química, apresente a equação balanceada de forma clara no corpo do texto.
          3. Use formatação padrão para fórmulas (ex: H2O, H2SO4).
          
          ⚠️ REGRAS DE INTEGRIDADE:
          1. Analise as AMOSTRAS EXISTENTES abaixo. Você está PROIBIDO de gerar questões com o mesmo enunciado.
          2. Retorne APENAS o JSON no formato: { "questions": [ { "topic": "...", "text": "...", "options": ["A", "B", "C", "D", "E"], "correctAnswer": 0, "explanation": "..." } ] }
          3. Mantenha o tom ácido, técnico e sarcástico nas explicações.`
        },
        {
          role: "user",
          content: `TEMA: ${topic}. 
          CONTEXTO EXTRA: ${customPrompt || "Geral"}.
          AMOSTRAS EXISTENTES NO BANCO (NÃO REPETIR):
          ${samples}
          
          Gere ${count} novas questões inéditas com suporte a cálculos e dados de massa molar se necessário.`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7, 
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    const parsed = JSON.parse(content);
    
    return parsed.questions || [parsed];

  } catch (error) {
    console.error("⚠️ Erro no Cláudio:", error.message);
    return fallbackQuestion(topic, count);
  }
};

function fallbackQuestion(topic, count) {
  const base = {
    topic: topic,
    text: "O Cláudio está trocando as vidrarias (IA Indisponível). Qual a massa de 1 mol de Carbono?",
    options: ["10g", "12g", "14g", "6g", "24g"],
    correctAnswer: 1,
    explanation: "A massa molar do Carbono na tabela periódica é 12g/mol."
  };
  return Array(count).fill(base).map((q, i) => ({
    ...q,
    id: `fallback-${Date.now()}-${i}`,
    text: `(Modo Offline) ${q.text}`
  }));
}

module.exports = { generateEnemQuestion };