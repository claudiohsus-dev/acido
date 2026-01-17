import React, { useState, useEffect } from 'react';
import ResultsModal from './ResultsModal';

const BACKEND_URL = 'https://acido-klur.onrender.com';

const TrainingView = ({ token, onFinish, customPrompt, numQuestions, isSurvival }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [reported, setReported] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  
  const [showResults, setShowResults] = useState(false);

  const [combo, setCombo] = useState(0);
  const [eliminatedOptions, setEliminatedOptions] = useState([]);
  const [fraseDica, setFraseDica] = useState("");

  const frasesAcidas = [
    "Tá difícil? Toma aqui, tirei uma pra ver se você para de passar vergonha.",
    "Até uma solução saturada tem mais paciência que eu. Menos uma opção.",
    "Vou te ajudar dessa vez, mas na prova o Cláudio não vai estar lá, hein!",
    "Seus neurônios entraram em equilíbrio químico? Eliminei uma pra você."
  ];

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        customPrompt: customPrompt || '',
        count: isSurvival ? 20 : (numQuestions || 1)
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
      setCombo(prev => prev + 1);
    } else {
      setCombo(0);
    }
  };

  // --- NOVA FUNÇÃO: CORRIGIR GABARITO NO BANCO ---
  const handleFixQuestion = async () => {
    if (isCorrecting) return;
    const currentQ = questions[currentIndex];
    
    setIsCorrecting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/fix-question`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          questionId: currentQ.id, 
          newCorrectAnswer: selectedOption 
        })
      });

      if (res.ok) {
        // Atualiza localmente para o usuário não ser prejudicado
        setCorrectAnswersCount(prev => prev + 1);
        setCombo(prev => prev + 1);
        
        // Atualiza o objeto da questão na lista local
        const updatedQuestions = [...questions];
        updatedQuestions[currentIndex].correctAnswer = selectedOption;
        setQuestions(updatedQuestions);
        
        alert("Cláudio: 'Filtrei as impurezas! Essa questão foi corrigida no banco.'");
      }
    } catch (err) {
      console.error("Erro ao corrigir amostra:", err);
    } finally {
      setIsCorrecting(false);
    }
  };

  const pedirSocorro = () => {
    if (isAnswered) return;
    const currentQ = questions[currentIndex];
    const incorrects = currentQ.options
      .map((_, i) => i)
      .filter(i => i !== currentQ.correctAnswer && !eliminatedOptions.includes(i));
    
    if (incorrects.length > 0) {
      const randomWrong = incorrects[Math.floor(Math.random() * incorrects.length)];
      setEliminatedOptions([...eliminatedOptions, randomWrong]);
      setFraseDica(frasesAcidas[Math.floor(Math.random() * frasesAcidas.length)]);
    }
  };

  const handleReport = () => setReported(true);

  const finalizarTreino = async () => {
    try {
      const totalRespondidas = currentIndex + 1;
      const errosCount = totalRespondidas - correctAnswersCount;

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
      setShowResults(true);
    } catch (err) {
      setShowResults(true);
    }
  };

  const handleNext = async () => {
    const errou = selectedOption !== questions[currentIndex].correctAnswer;
    
    if (isSurvival && errou) {
      await finalizarTreino();
      return;
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsAnswered(false);
      setSelectedOption(null);
      setReported(false);
      setEliminatedOptions([]);
      setFraseDica("");
    } else {
      await finalizarTreino();
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-600 mb-4"></div>
      <p className="text-slate-500 font-medium">Destilando conhecimento...</p>
    </div>
  );

  if (error) return (
    <div className="text-center py-20 bg-white rounded-[3rem] shadow-xl border border-red-100 max-w-2xl mx-auto px-6">
      <div className="text-4xl mb-4">⚠️</div>
      <h3 className="text-xl font-bold text-slate-800 mb-2 uppercase italic">Amostra Contaminada</h3>
      <p className="text-slate-500 mb-6 text-sm">{error}</p>
      <button onClick={fetchQuestions} className="bg-lime-500 text-slate-900 px-8 py-3 rounded-2xl font-bold uppercase text-xs tracking-widest">Tentar Nova Reação</button>
    </div>
  );

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  const isCorrect = selectedOption === currentQuestion.correctAnswer;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto pb-10 px-4">
      <div className="mb-8 bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-3 tracking-[0.2em]">
          <span>{isSurvival ? "⚠️ MODO MORTE SÚBITA" : `Molécula ${currentIndex + 1} de ${questions.length}`}</span>
          <div className="flex gap-3 items-center">
             {combo >= 3 && <span className="text-orange-500 animate-pulse">🔥 COMBO X{combo}</span>}
             <span className="text-emerald-500">Acertos: {correctAnswersCount}</span>
          </div>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ease-out ${combo >= 3 ? 'exotermico' : (isSurvival ? 'bg-rose-500' : 'bg-lime-500')}`} 
            style={{ width: isSurvival ? "100%" : `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 mb-6 relative overflow-hidden">
        {!isAnswered && (
          <button 
            onClick={pedirSocorro}
            className="absolute top-20 right-4 bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 p-2 rounded-xl transition-all text-[9px] font-bold uppercase z-20 border border-transparent hover:border-rose-200"
          >
            🧪 Socorro
          </button>
        )}

        <div className="flex justify-between items-start mb-6">
          <div className={`${isSurvival ? 'bg-rose-100 text-rose-700' : 'bg-lime-100 text-lime-700'} px-4 py-1.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest`}>
            {currentQuestion.topic || 'Química'}
          </div>
          <button onClick={handleReport} disabled={reported} className={`text-[9px] font-bold uppercase tracking-widest ${reported ? 'text-emerald-500' : 'text-slate-300'}`}>
            {reported ? '✓ Relatado' : '⚠ Reportar'}
          </button>
        </div>
        
        <h2 className="text-xl font-semibold text-slate-800 leading-relaxed mb-10 relative z-10">
          {currentQuestion.text}
        </h2>

        {fraseDica && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl animate-in slide-in-from-top-2">
            <p className="text-[10px] italic text-rose-600 font-bold uppercase tracking-tighter">Cláudio diz:</p>
            <p className="text-xs text-rose-500 font-medium">"{fraseDica}"</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {currentQuestion.options.map((option, index) => {
            const isEliminated = eliminatedOptions.includes(index);
            let btnClass = "bg-slate-50 border-slate-200";
            
            if (!isAnswered && !isEliminated) btnClass += " hover:border-lime-200 hover:bg-white active:scale-95";
            if (isEliminated) btnClass = "opacity-20 grayscale scale-95 cursor-not-allowed border-dashed";

            if (isAnswered) {
              if (index === currentQuestion.correctAnswer) btnClass = "bg-emerald-50 border-emerald-500 text-emerald-800";
              else if (index === selectedOption) btnClass = "bg-rose-50 border-rose-500 text-rose-800";
              else btnClass = "opacity-40 border-transparent";
            }

            return (
              <button
                key={index}
                disabled={isAnswered || isEliminated}
                onClick={() => handleAnswer(index)}
                className={`flex items-center p-5 rounded-[2rem] border-2 transition-all duration-300 text-left font-semibold ${btnClass}`}
              >
                <span className={`w-10 h-10 flex items-center justify-center rounded-2xl border-2 mr-5 font-black shrink-0 ${
                    isAnswered && index === currentQuestion.correctAnswer ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white text-slate-400'
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
        <div className={`bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-500 relative ${!isCorrect ? 'glitch-error' : ''}`}>
          <div className="absolute -top-4 left-10 bg-lime-500 text-slate-900 px-4 py-1 rounded-full text-[10px] font-black uppercase italic">
              Cláudio analisa:
          </div>

          <div className="flex items-start gap-6 mb-10">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isCorrect ? (combo >= 3 ? '🔥' : '🧪') : '☣️'}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black mb-3 italic uppercase tracking-tighter">
                {isCorrect 
                  ? (combo >= 3 ? 'REAÇÃO EXOTÉRMICA!' : 'Reação Estável!') 
                  : (isSurvival ? 'FALHA CRÍTICA NO LAB!' : 'Explosão Química!')}
              </h3>
              
              <div className="text-slate-400 text-sm leading-relaxed font-medium bg-slate-800/40 p-5 rounded-2xl border border-white/5">
                <span className="text-lime-400 font-bold block mb-1 uppercase text-[10px]">A lógica:</span>
                {currentQuestion.explanation}
              </div>

              {/* BOTÃO DE CORREÇÃO DE GABARITO */}
              {!isCorrect && (
                <button 
                  onClick={handleFixQuestion}
                  disabled={isCorrecting}
                  className="mt-4 text-[9px] font-black text-rose-400 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-all bg-rose-500/10 px-3 py-2 rounded-lg border border-rose-500/20 hover:bg-rose-500/20"
                >
                  {isCorrecting ? '⏳ Processando...' : '🛠️ Marcar minha resposta como a correta'}
                </button>
              )}
            </div>
          </div>
          
          <button 
            onClick={handleNext} 
            className={`w-full py-5 rounded-[1.5rem] font-black transition-all uppercase text-[10px] tracking-[0.2em] shadow-lg ${
              (isSurvival && !isCorrect) 
                ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                : 'bg-lime-500 hover:bg-lime-400 text-slate-900'
            }`}
          >
            {isSurvival && !isCorrect 
              ? 'ABANDONAR LABORATÓRIO (VOCÊ EXPLODIU)' 
              : (currentIndex < questions.length - 1 ? 'Próxima Dose' : 'Ver Resultados')}
          </button>
        </div>
      )}

      {showResults && (
        <ResultsModal 
          acertos={correctAnswersCount} 
          total={currentIndex + 1} 
          isSurvival={isSurvival} 
          onExit={onFinish} 
        />
      )}
    </div>
  );
};

export default TrainingView;