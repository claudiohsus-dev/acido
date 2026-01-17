const Groq = require("groq-sdk");

const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY 
});

/**
 * Motor de IA: CLÁUDIO
 * Agora analisa o banco de dados (existingContext) para evitar duplicatas.
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
          content: `Você é o CLÁUDIO, um químico genial e sarcástico que gerencia um banco de dados de alto nível.
          Sua tarefa: Gerar um JSON com ${count} questões de Química (Nível ENEM).
          
          ⚠️ REGRAS DE INTEGRIDADE:
          1. Analise as AMOSTRAS EXISTENTES abaixo. Você PROIBIDO de gerar questões com o mesmo enunciado ou resposta idêntica.
          2. Busque abordar subtemas diferentes dentro de "${topic}".
          3. Retorne APENAS o JSON: { "questions": [ { "topic": "...", "text": "...", "options": ["A", "B", "C", "D", "E"], "correctAnswer": 0, "explanation": "..." } ] }
          4. Mantenha o tom ácido e técnico nas explicações.`
        },
        {
          role: "user",
          content: `TEMA: ${topic}. 
          AMOSTRAS EXISTENTES NO BANCO (NÃO REPETIR):
          ${samples}
          
          Gere ${count} novas questões inéditas.`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7, // Aumentado levemente para favorecer criatividade e evitar repetição
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