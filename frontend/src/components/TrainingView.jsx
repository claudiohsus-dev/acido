import React, { useState, useEffect } from 'react';

// URL do seu backend no Render
const BACKEND_URL = 'https://acido-klur.onrender.com';

const TrainingView = ({ token, onFinish, customPrompt, numQuestions }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        customPrompt: customPrompt || '',
        count: numQuestions || 1
      });

      // CORRIGIDO: Agora aponta para o Render
      const res = await fetch(`${BACKEND_URL}/api/generate-question?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Falha ao sintetizar as questões.");

      const data = await res.json();
      const questionsArray = Array.isArray(data) ? data : [data];
      const validQuestions = questionsArray.filter(q => q && q.options && q.text);
      
      if (validQuestions.length === 0) throw new Error("A IA gerou um formato inválido.");
      
      setQuestions(validQuestions);
    } catch (err) {
      console.error("Erro ao carregar questões:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleAnswer = async (index) => {
    if (isAnswered) return;
    
    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === questions[currentIndex].correctAnswer;
    if (isCorrect) {
      setCorrectAnswersCount(prev => prev + 1);
    }

    try {
      // CORRIGIDO: Agora aponta para o Render
      await fetch(`${BACKEND_URL}/api/submit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          topic: questions[currentIndex].topic || "Estequiometria",
          correct: isCorrect,
          questionText: questions[currentIndex].text,
          userAnswer: questions[currentIndex].options[index]
        })
      });
    } catch (err) {
      console.error("Erro ao registrar no histórico");
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsAnswered(false);
      setSelectedOption(null);
    } else {
      await finalizarTreino();
    }
  };

  const finalizarTreino = async () => {
    try {
      const totalXP = (correctAnswersCount * 50);
      const errosCount = questions.length - correctAnswersCount;

      // CORRIGIDO: Agora aponta para o Render
      await fetch(`${BACKEND_URL}/api/update-stats`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          points: totalXP, 
          acertos: correctAnswersCount, 
          erros: errosCount 
        })
      });
      onFinish(); 
    } catch (err) {
      onFinish();
    }
  };

  // ... (restante do código de UI permanece igual)
  if (error) return (
    <div className="text-center py-20 bg-white rounded-[3rem] shadow-xl border border-red-100 max-w-2xl mx-auto">
      <div className="text-4xl mb-4">⚠️</div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">Erro na Destilação</h3>
      <p className="text-slate-500 mb-6 px-10">{error}</p>
      <button onClick={fetchQuestions} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold">Tentar Novamente</button>
    </div>
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
      <p className="text-slate-500 font-medium">Sintetizando {numQuestions} questões com precisão...</p>
    </div>
  );

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto pb-10">
      <div className="mb-8 bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-3 tracking-[0.2em]">
          <span>Módulo de Treinamento: {currentIndex + 1} / {questions.length}</span>
          <div className="flex gap-3">
             <span className="text-emerald-500">Acertos: {correctAnswersCount}</span>
             <span className="text-rose-400">Erros: {currentIndex - correctAnswersCount + (isAnswered && selectedOption !== currentQuestion.correctAnswer ? 1 : 0)}</span>
          </div>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-600 h-full transition-all duration-1000 ease-out" 
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-indigo-900/5 border border-slate-100 mb-6">
        <div className="inline-block bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest mb-6">
          {currentQuestion?.topic || 'Estequiometria'}
        </div>
        
        <h2 className="text-xl font-semibold text-slate-800 leading-relaxed mb-10">
          {currentQuestion?.text}
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {currentQuestion?.options.map((option, index) => {
            let btnClass = "bg-slate-50 border-slate-200 hover:border-indigo-200 hover:bg-white";
            if (isAnswered) {
              if (index === currentQuestion.correctAnswer) {
                btnClass = "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-lg shadow-emerald-200/20";
              } else if (index === selectedOption) {
                btnClass = "bg-rose-50 border-rose-500 text-rose-800 shadow-sm";
              } else {
                btnClass = "opacity-40 border-transparent cursor-not-allowed";
              }
            }

            return (
              <button
                key={index}
                disabled={isAnswered}
                onClick={() => handleAnswer(index)}
                className={`flex items-center p-5 rounded-[2rem] border-2 transition-all duration-300 text-left font-semibold group ${btnClass}`}
              >
                <span className={`w-10 h-10 flex items-center justify-center rounded-2xl border-2 mr-5 transition-all font-black ${
                    isAnswered && index === currentQuestion.correctAnswer ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-inherit text-slate-400'
                }`}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="flex-1">{option}</span>
              </button>
            );
          })}
        </div>
      </div>

      {isAnswered && (
        <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="flex items-start gap-6 mb-10">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${selectedOption === currentQuestion.correctAnswer ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {selectedOption === currentQuestion.correctAnswer ? '✓' : '⚠'}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black mb-3 italic uppercase tracking-tighter">
                {selectedOption === currentQuestion.correctAnswer ? 'Análise Perfeita!' : 'Falha na Reação!'}
              </h3>
              <div className="text-slate-400 text-sm leading-relaxed font-mono bg-slate-800/40 p-5 rounded-2xl border border-white/5 whitespace-pre-line">
                {currentQuestion.explanation?.replaceAll('. ', '.\n\n')}
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleNext}
            className="w-full bg-white text-slate-900 py-5 rounded-[1.5rem] font-black hover:bg-indigo-50 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95 uppercase text-[10px] tracking-[0.2em]"
          >
            {currentIndex < questions.length - 1 ? 'Prosseguir para Próxima Etapa' : 'Finalizar e Consolidar XP'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TrainingView;