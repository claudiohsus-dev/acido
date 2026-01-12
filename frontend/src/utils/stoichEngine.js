// src/utils/stoichEngine.js

const reactions = [
  { equation: "N2 + 3H2 -> 2NH3", reactants: ["N2", "H2"], product: "NH3", ratios: [1, 3, 2], masses: [28, 2, 17] },
  { equation: "2H2 + O2 -> 2H2O", reactants: ["H2", "O2"], product: "H2O", ratios: [2, 1, 2], masses: [2, 32, 18] },
  { equation: "C + O2 -> CO2", reactants: ["C", "O2"], product: "CO2", ratios: [1, 1, 1], masses: [12, 32, 44] }
];

// O "export" antes da const é o que resolve o seu erro!
export const generateQuestion = (topic) => {
  const reaction = reactions[Math.floor(Math.random() * reactions.length)];
  const baseAmount = Math.floor(Math.random() * 50) + 10; 
  
  let questionText = "";
  let correctAnswer = 0;
  const currentTopic = topic || 'pureza';

  if (currentTopic === 'pureza') {
    const purity = Math.floor(Math.random() * 40) + 60; 
    questionText = `Dada a reação ${reaction.equation}, se temos ${baseAmount}g de ${reaction.reactants[0]} com ${purity}% de pureza, quantos gramas de ${reaction.product} serão formados? (Use 2 casas decimais)`;
    correctAnswer = (baseAmount / reaction.masses[0]) * (reaction.ratios[2] / reaction.ratios[0]) * reaction.masses[2] * (purity / 100);
  } else {
    const yieldPct = Math.floor(Math.random() * 30) + 70;
    questionText = `Na reação ${reaction.equation}, reagindo ${baseAmount}g de ${reaction.reactants[0]}, qual a massa de ${reaction.product} se o rendimento for ${yieldPct}%?`;
    correctAnswer = (baseAmount / reaction.masses[0]) * (reaction.ratios[2] / reaction.ratios[0]) * reaction.masses[2] * (yieldPct / 100);
  }

  return {
    text: questionText,
    answer: correctAnswer.toFixed(2),
    topic: currentTopic
  };
};