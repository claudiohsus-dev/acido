import React, { useState, useEffect } from 'react';
import TrainingView from './components/TrainingView'; 

// Remova a lógica complexa e coloque o link direto para testar
const API_URL = 'https://acido-klur.onrender.com/api';
const App = () => {
  // Usuário "fake" para o sistema não dar erro de undefined
  const [user, setUser] = useState({ nickname: 'Visitante', xp: 0, nivel: 1 });
  const [view, setView] = useState('menu'); 
  const [rankings, setRankings] = useState([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [numQuestions, setNumQuestions] = useState(1);

  const fetchRankings = async () => {
    try {
      const res = await fetch(`${API_URL}/rankings`);
      const data = await res.json();
      setRankings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Falha ao carregar ranking");
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans">
      <div className="max-w-5xl mx-auto px-6">
        
        <header className="flex flex-col md:flex-row justify-between items-center py-8 gap-4">
          <div className="cursor-pointer" onClick={() => setView('menu')}>
            <h1 className="text-2xl font-black text-slate-900 leading-none italic">
               CLÁUDIO DO <span className="text-lime-600 uppercase">Ácido Bucético</span>
            </h1>
            <p className="text-slate-500 font-medium italic">@{user.nickname}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 font-bold text-lime-600">🧪 {user.xp} XP</span>
            <span className="bg-slate-900 px-4 py-2 rounded-xl shadow-md font-bold text-lime-400 border border-lime-500/50">Lvl {user.nivel}</span>
          </div>
        </header>

        {view === 'training' ? (
          <TrainingView 
            token="sem-token" 
            customPrompt={customPrompt} 
            numQuestions={numQuestions}
            onFinish={() => {
              setView('menu');
              setCustomPrompt(''); 
              fetchRankings();
            }} 
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 underline decoration-lime-400">Descreve aí, fiote</h2>
                <textarea 
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 ring-lime-500"
                  placeholder="Ex: Misturas complexas, rendimento baixo..."
                  rows="2"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                />
                <div className="mt-4 flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                  <span className="text-slate-700 font-bold text-sm uppercase">Questões:</span>
                  <div className="flex gap-2">
                    {[1, 3, 5].map((n) => (
                      <button key={n} onClick={() => setNumQuestions(n)} className={`w-10 h-10 rounded-xl font-bold ${numQuestions === n ? 'bg-lime-500 text-slate-950' : 'bg-white border'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setView('training')} 
                className="w-full bg-slate-900 text-white py-12 rounded-[2.5rem] shadow-2xl border-b-8 border-lime-600 flex flex-col items-center"
              >
                <span className="text-4xl font-black mb-2 uppercase italic text-lime-400">DERRAMAR ÁCIDO</span>
                <span className="text-slate-400 font-medium uppercase text-sm">Iniciar Treino via IA</span>
              </button>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
              <h2 className="text-xl font-black mb-6 underline decoration-lime-500">🏆 Mestres Ácidos</h2>
              <div className="space-y-4">
                {rankings.map((r, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-50">
                    <span className="font-bold text-slate-700">{i+1}º {r.nickname}</span>
                    <span className="font-black text-slate-800">{r.xp} XP</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;