const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  
  // Níveis de Habilidade
  level_pureza: { type: DataTypes.FLOAT, defaultValue: 1.0 },
  level_rendimento: { type: DataTypes.FLOAT, defaultValue: 1.0 },
  level_limitante: { type: DataTypes.FLOAT, defaultValue: 1.0 },
  level_equilibrio: { type: DataTypes.FLOAT, defaultValue: 1.0 },
  
  // Progresso Geral
  pontos: { type: DataTypes.INTEGER, defaultValue: 0 },
  nivel: { type: DataTypes.INTEGER, defaultValue: 1 },

  // NOVO: Estatísticas de Batalha (Acertos e Erros)
  total_acertos: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_erros: { type: DataTypes.INTEGER, defaultValue: 0 }
});

const History = sequelize.define('History', {
  topic: { type: DataTypes.STRING, allowNull: false },
  correct: { type: DataTypes.BOOLEAN, allowNull: false },
  timeTaken: { type: DataTypes.INTEGER, defaultValue: 0 },
  questionText: { type: DataTypes.TEXT, allowNull: false },
  userAnswer: { type: DataTypes.STRING, allowNull: false }
});

User.hasMany(History);
History.belongsTo(User);

module.exports = { User, History, sequelize };