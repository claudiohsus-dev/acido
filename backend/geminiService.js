const Groq = require("groq-sdk");

const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY 
});

/**
 * Motor de IA: CLÁUDIO DO ÁCIDO BUCÉTICO
 * Gera lotes de questões para garantir variedade e performance.
 */
const generateEnemQuestion = async (topic, customPrompt, count = 1) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("Chave da API Groq não configurada.");
    }

    // Prompt otimizado para JSON Array
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Você é o CLÁUDIO, um químico genial e sarcástico.
          Sua tarefa: Gerar um JSON contendo uma lista de ${count} questões de Química (Nível ENEM) sobre o tema solicitado.
          
          REGRAS:
          1. Retorne APENAS um JSON válido.
          2. O formato deve ser: { "questions": [ { "topic": "...", "text": "...", "options": ["A", "B", "C", "D", "E"], "correctAnswer": 0, "explanation": "..." } ] }
          3. As questões devem ser DIFERENTES entre si.
          4. correctAnswer é o índice numérico (0 a 4).`
        },
        {
          role: "user",
          content: `Tema: ${topic}. Contexto: ${customPrompt || "Geral"}. Gere ${count} questões.`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.6, 
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    const parsed = JSON.parse(content);
    
    // Garante que retornamos um array
    return parsed.questions || [parsed];

  } catch (error) {
    console.error("⚠️ Erro no Cláudio:", error.message);
    return fallbackQuestion(topic, count);
  }
};

/**
 * Fallback (Modo de Segurança) caso a IA falhe ou a chave expire
 */
function fallbackQuestion(topic, count) {
  const base = {
    topic: topic,
    text: "O Cláudio está trocando as vidrarias (IA Indisponível). Responda: Qual a massa de 1 mol de Carbono?",
    options: ["10g", "12g", "14g", "6g", "24g"],
    correctAnswer: 1,
    explanation: "A massa molar do Carbono na tabela periódica é 12g/mol."
  };
  
  // Cria um array com o número de questões solicitadas
  return Array(count).fill(base).map((q, i) => ({
    ...q,
    id: `fallback-${Date.now()}-${i}`,
    text: `(Modo Offline ${i+1}) ${q.text}`
  }));
}

module.exports = { generateEnemQuestion };