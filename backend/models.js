const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  level_pureza: { type: DataTypes.FLOAT, defaultValue: 1.0 },
  level_rendimento: { type: DataTypes.FLOAT, defaultValue: 1.0 },
  level_limitante: { type: DataTypes.FLOAT, defaultValue: 1.0 },
  level_equilibrio: { type: DataTypes.FLOAT, defaultValue: 1.0 },
  pontos: { type: DataTypes.INTEGER, defaultValue: 0 },
  nivel: { type: DataTypes.INTEGER, defaultValue: 1 },
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

// NOVA TABELA: Banco de Questões Geradas
const Question = sequelize.define('Question', {
  topic: { type: DataTypes.STRING, allowNull: false },
  text: { type: DataTypes.TEXT, allowNull: false, unique: true }, // Evita duplicatas
  options: { type: DataTypes.JSON, allowNull: false }, // Guarda o Array ['A', 'B'...]
  correctAnswer: { type: DataTypes.INTEGER, allowNull: false },
  explanation: { type: DataTypes.TEXT, allowNull: true }
});

User.hasMany(History);
History.belongsTo(User);

module.exports = { User, History, Question, sequelize };