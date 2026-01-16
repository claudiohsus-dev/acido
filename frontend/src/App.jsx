import React, { useState, useEffect } from 'react';
import TrainingView from './components/TrainingView';
import LoginView from './components/LoginView';

const API_URL = 'https://acido-klur.onrender.com/api';

const App = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [view, setView] = useState('menu'); 
  const [rankings, setRankings] = useState([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [numQuestions, setNumQuestions] = useState(1);

  // 1. Buscar Rankings (Atualizado para buscar por acertos no futuro)
  const fetchRankings = async () => {
    try {
      const res = await fetch(`${API_URL}/rankings`);
      const data = await res.json();
      setRankings(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Falha ao carregar ranking"); }
  };

  // 2. Validar Token e buscar dados do usuário ao abrir o site
  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.username !== "Visitante") setUser(data);
        else setToken(null);
      })
      .catch(() => {
        setToken(null);
        localStorage.removeItem('token');
      });
    }
    fetchRankings();
  }, [token]);

  const handleLoginSuccess = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  // Se não houver token, obriga o Login
  if (!token) {
    return <LoginView onLogin={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans">
      <div className="max-w-5xl mx-auto px-6">
        
        <header className="flex flex-col md:flex-row justify-between items-center py-8 gap-4">
          <div className="cursor-pointer" onClick={() => setView('menu')}>
            <h1 className="text-2xl font-black text-slate-900 leading-none italic uppercase">
                Claudio <span className="text-lime-600">Ácido</span>
            </h1>
            <p className="text-slate-500 font-medium italic">@{user?.username || 'Carregando...'}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 font-bold text-emerald-600">
               🎯 {user?.total_acertos || 0} Acertos
            </span>
            <span className="bg-slate-900 px-4 py-2 rounded-xl shadow-md font-bold text-lime-400 border border-lime-500/50">
               Lvl {user?.nivel || 1}
            </span>
            <button onClick={handleLogout} className="ml-2 text-slate-400 hover:text-rose-500 font-bold text-xs uppercase transition-colors">Sair</button>
          </div>
        </header>

        {view === 'training' ? (
          <TrainingView 
            token={token} 
            customPrompt={customPrompt} 
            numQuestions={numQuestions}
            onFinish={() => {
              setView('menu');
              setCustomPrompt(''); 
              // Recarregar stats do usuário e ranking após terminar
              setToken(token); // Isso dispara o useEffect de atualização
              fetchRankings();
            }} 
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 underline decoration-lime-400 italic">Descreve aí, fiote</h2>
                <textarea 
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 ring-lime-500 font-medium"
                  placeholder="Ex: Rendimento baixo, misturas de gases..."
                  rows="2"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                />
                <div className="mt-4 flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                  <span className="text-slate-700 font-bold text-sm uppercase tracking-tighter">Dose de Ácido (Questões):</span>
                  <div className="flex gap-2">
                    {[1, 3, 5].map((n) => (
                      <button key={n} onClick={() => setNumQuestions(n)} className={`w-10 h-10 rounded-xl font-bold transition-all ${numQuestions === n ? 'bg-lime-500 text-slate-950 scale-110 shadow-lg' : 'bg-white border hover:bg-slate-100'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setView('training')} 
                className="w-full bg-slate-900 text-white py-12 rounded-[2.5rem] shadow-2xl border-b-8 border-lime-600 flex flex-col items-center group active:translate-y-1 active:border-b-0 transition-all"
              >
                <span className="text-4xl font-black mb-2 uppercase italic text-lime-400 group-hover:tracking-widest transition-all">DERRAMAR ÁCIDO</span>
                <span className="text-slate-400 font-medium uppercase text-sm tracking-widest">Sintetizar via Groq AI</span>
              </button>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
              <h2 className="text-xl font-black mb-6 underline decoration-lime-500 italic uppercase">🏆 Mestres Ácidos</h2>
              <div className="space-y-4">
                {rankings.map((r, i) => (
                  <div key={i} className={`flex justify-between items-center p-3 rounded-xl ${i === 0 ? 'bg-lime-50 border border-lime-200' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`font-black ${i < 3 ? 'text-lime-600' : 'text-slate-400'}`}>{i+1}º</span>
                      <span className="font-bold text-slate-700">{r.nickname}</span>
                    </div>
                    <span className="font-black text-slate-800">{r.xp} <span className="text-[10px] text-slate-400 uppercase">Acertos</span></span>
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