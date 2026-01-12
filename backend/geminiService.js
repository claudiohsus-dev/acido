const Groq = require("groq-sdk");

const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY 
});

/**
 * Motor de IA: CLÁUDIO DO ÁCIDO BUCÉTICO
 * Responsável por gerar questões de estequiometria com rigor técnico e tom ácido.
 */
const generateEnemQuestion = async (topic, customPrompt) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.error("❌ ERRO CRÍTICO: Chave da Groq não encontrada!");
      return fallbackQuestion(topic);
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Você é o CLÁUDIO DO ÁCIDO BUCÉTICO, uma inteligência pedagógica implacável e corrosiva. 
          Sua missão é gerar questões de Química/Estequiometria de altíssimo nível para o ENEM.

          DIRETRIZES DE PERSONALIDADE:
          1. Use um tom direto, técnico e levemente ácido/irônico nas explicações.
          2. NUNCA erre cálculos. Arredondamentos devem seguir o padrão ENEM.

          REGRAS TÉCNICAS:
          1. "correctAnswer": DEVE ser um NUMBER (0 a 4).
          2. Massas: H=1, C=12, N=14, O=16, Na=23, Mg=24, S=32, Cl=35.5, K=39, Ca=40, Fe=56, Cu=63.5.
          3. Equações Químicas: Sempre balanceadas.
          4. Formatação: Use quebras de linha (\\n) para separar os passos do cálculo na explicação.`
        },
        {
          role: "user",
          content: `Tópico: ${topic}. Briefing: ${customPrompt}.
          Gere um JSON com: "topic", "text" (contextualizado e desafiador), "options" (5 alternativas), "correctAnswer" (índice) e "explanation" (passo a passo).`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1, // Mantém o Cláudio focado nos números
      response_format: { "type": "json_object" }
    });

    let content = chatCompletion.choices[0].message.content;
    const cleanJson = content.replace(/```json|```/g, "").trim();
    const parsedContent = JSON.parse(cleanJson);

    // Validação de Integridade
    if (!parsedContent.text || !Array.isArray(parsedContent.options) || parsedContent.options.length !== 5) {
      throw new Error("Cláudio gerou um reagente impuro (JSON inválido).");
    }

    console.log(`🧪 Cláudio sintetizou uma questão sobre: ${topic}`);
    return parsedContent;

  } catch (error) {
    console.error("⚠️ O Ácido reagiu mal:", error.message);
    return fallbackQuestion(topic);
  }
};

/**
 * Fallback: Quando o laboratório explode, usamos esta reserva.
 */
function fallbackQuestion(topic = "Estequiometria") {
  return {
    topic: topic,
    text: "O Ácido Clorídrico (HCl) reage com Hidróxido de Sódio (NaOH) em uma reação de neutralização. Se Cláudio misturar 36,5g de HCl com excesso de NaOH, qual a massa de NaCl formada? (Na=23, Cl=35.5, H=1, O=16)",
    options: ["29,25g", "40,00g", "58,50g", "73,00g", "117,00g"],
    correctAnswer: 2,
    explanation: "Reação: HCl + NaOH -> NaCl + H2O.\\n1. Massa molar HCl = 36,5g/mol.\\n2. Massa molar NaCl = 58,5g/mol.\\n3. Como usamos exatamente 1 mol de HCl, produziremos 1 mol de NaCl (58,5g)."
  };
}

module.exports = { generateEnemQuestion };