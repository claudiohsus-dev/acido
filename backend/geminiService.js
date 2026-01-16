const Groq = require("groq-sdk");

const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY 
});

/**
 * Motor de IA: CLÁUDIO DO ÁCIDO BUCÉTICO
 * Agora gera LOTES de questões para evitar repetição.
 */
const generateEnemQuestion = async (topic, customPrompt, count = 1) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.error("❌ ERRO CRÍTICO: Chave da Groq não encontrada!");
      return fallbackQuestion(topic, count);
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Você é o CLÁUDIO DO ÁCIDO BUCÉTICO.
          Sua missão é gerar um ARRAY (lista) contendo ${count} questões de Estequiometria DISTINTAS e INÉDITAS.
          
          REGRAS CRÍTICAS:
          1. As questões NÃO podem ser repetidas.
          2. Varie os elementos químicos e os cenários.
          3. Retorne APENAS um JSON válido com a chave "questions".
          
          FORMATO DO JSON:
          {
            "questions": [
              {
                "topic": "Estequiometria",
                "text": "Enunciado...",
                "options": ["A", "B", "C", "D", "E"],
                "correctAnswer": 0, // Índice numérico (0-4)
                "explanation": "Explicação ácida..."
              }
            ]
          }`
        },
        {
          role: "user",
          content: `Gere ${count} questões sobre: ${topic}.
          Contexto extra: ${customPrompt || "Desafios variados de pureza e rendimento"}.
          Mantenha rigor nos cálculos e sarcasmo nas explicações.`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5, // Aumentamos um pouco para garantir variedade
      response_format: { "type": "json_object" }
    });

    let content = chatCompletion.choices[0].message.content;
    const cleanJson = content.replace(/```json|```/g, "").trim();
    const parsedContent = JSON.parse(cleanJson);

    // Validação: Se a IA devolveu o objeto, pegamos o array 'questions'
    const questionsArray = parsedContent.questions || [parsedContent];

    console.log(`🧪 Cláudio sintetizou um lote de ${questionsArray.length} questões.`);
    return questionsArray;

  } catch (error) {
    console.error("⚠️ O Ácido reagiu mal:", error.message);
    return fallbackQuestion(topic, count);
  }
};

/**
 * Fallback que gera array para não quebrar o frontend
 */
function fallbackQuestion(topic, count) {
  const baseQuestion = {
    topic: topic,
    text: "O sistema de IA está temporariamente indisponível (FALHA NA SÍNTESE). Mas resolva esta: Qual a massa de 1 mol de H2O?",
    options: ["10g", "16g", "18g", "20g", "2g"],
    correctAnswer: 2,
    explanation: "H=1, O=16. Logo, 2*1 + 16 = 18g/mol."
  };
  
  // Retorna um array com o número de questões pedidas (repetidas neste caso, pois é erro)
  return Array(count).fill(baseQuestion).map((q, i) => ({
    ...q, 
    id: `fallback-${i}`,
    text: `(Modo de Segurança ${i+1}) ${q.text}`
  }));
}

module.exports = { generateEnemQuestion };