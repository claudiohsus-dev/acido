import React, { useState, useEffect } from 'react';

const BACKEND_URL = 'https://acido-klur.onrender.com';

const TrainingView = ({ token, onFinish, customPrompt, numQuestions }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [reported, setReported] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        customPrompt: customPrompt || '',
        count: numQuestions || 1
      });

      const res = await fetch(`${BACKEND_URL}/api/generate-question?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Erro na comunicação com o laboratório.");

      const data = await res.json();
      setQuestions(Array.isArray(data) ? data : [data]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleAnswer = (index) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    if (index === questions[currentIndex].correctAnswer) {
      setCorrectAnswersCount(prev => prev + 1);
    }
  };

  const handleReport = () => {
    setReported(true);
    console.log("Questão reportada:", questions[currentIndex].id);
    // Aqui você poderia enviar um fetch para /api/report-question no futuro
  };

  const finalizarTreino = async () => {
    try {
      const errosCount = questions.length - correctAnswersCount;
      await fetch(`${BACKEND_URL}/api/update-stats`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          acertos: correctAnswersCount, 
          erros: errosCount 
        })
      });
      onFinish();
    } catch (err) {
      console.error("Erro ao salvar progresso:", err);
      onFinish();
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsAnswered(false);
      setSelectedOption(null);
      setReported(false);
    } else {
      await finalizarTreino();
    }
  };

  if (error) return (
    <div className="text-center py-20 bg-white rounded-[3rem] shadow-xl border border-red-100 max-w-2xl mx-auto">
      <div className="text-4xl mb-4">⚠️</div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">Erro na Destilação</h3>
      <p className="text-slate-500 mb-6 px-10">{error}</p>
      <button onClick={fetchQuestions} className="bg-lime-500 text-slate-900 px-8 py-3 rounded-2xl font-bold">Tentar Novamente</button>
    </div>
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-600 mb-4"></div>
      <p className="text-slate-500 font-medium">Sintetizando questões...</p>
    </div>
  );

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto pb-10">
      {/* Barra de Progresso Superior */}
      <div className="mb-8 bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-3 tracking-[0.2em]">
          <span>Molécula {currentIndex + 1} de {questions.length}</span>
          <div className="flex gap-3">
             <span className="text-emerald-500">Acertos: {correctAnswersCount}</span>
          </div>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-lime-500 h-full transition-all duration-1000 ease-out" 
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Card da Questão */}
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
           <span className="text-8xl font-black italic">H2SO4</span>
        </div>

        <div className="flex justify-between items-start mb-6">
          <div className="bg-lime-100 text-lime-700 px-4 py-1.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest">
            {currentQuestion.topic || 'Química'}
          </div>
          <button 
            onClick={handleReport}
            disabled={reported}
            className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${reported ? 'text-emerald-500' : 'text-slate-300 hover:text-rose-400'}`}
          >
            {reported ? '✓ Relatado' : '⚠ Reportar Erro'}
          </button>
        </div>
        
        <h2 className="text-xl font-semibold text-slate-800 leading-relaxed mb-10 relative z-10">
          {currentQuestion.text}
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {currentQuestion.options.map((option, index) => {
            let btnClass = "bg-slate-50 border-slate-200 hover:border-lime-200 hover:bg-white";
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

      {/* Feedback do Cláudio */}
      {isAnswered && (
        <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-500 relative">
          <div className="absolute -top-4 left-10 bg-lime-500 text-slate-900 px-4 py-1 rounded-full text-[10px] font-black uppercase italic">
            Cláudio analisa:
          </div>

          <div className="flex items-start gap-6 mb-10">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${selectedOption === currentQuestion.correctAnswer ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {selectedOption === currentQuestion.correctAnswer ? '🧪' : '☣️'}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black mb-3 italic uppercase tracking-tighter">
                {selectedOption === currentQuestion.correctAnswer ? 'Reação Estável!' : 'Explosão no Lab!'}
              </h3>
              
              <div className="space-y-4">
                <div className="text-slate-400 text-sm leading-relaxed font-medium bg-slate-800/40 p-5 rounded-2xl border border-white/5">
                  <span className="text-lime-400 font-bold block mb-1 uppercase text-[10px]">A lógica:</span>
                  {currentQuestion.explanation}
                </div>

                {/* Seção de Pegadinha (Simulada ou vinda da IA) */}
                <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl">
                   <span className="text-indigo-400 font-black block mb-1 uppercase text-[10px]">🚩 Pegadinha do ENEM:</span>
                   <p className="text-xs text-slate-300 italic">Cuidado com as unidades de medida! Muita gente esquece de converter gramas para mols antes de começar a estequiometria.</p>
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleNext}
            className="w-full bg-lime-500 text-slate-900 py-5 rounded-[1.5rem] font-black hover:bg-lime-400 transition-all shadow-[0_10px_30px_rgba(132,204,22,0.2)] active:scale-95 uppercase text-[10px] tracking-[0.2em]"
          >
            {currentIndex < questions.length - 1 ? 'Próxima Dose' : 'Ver Resultados'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TrainingView;