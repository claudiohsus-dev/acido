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

  // Busca o ranking de usuários
  const fetchRankings = async () => {
    try {
      const res = await fetch(`${API_URL}/rankings`);
      const data = await res.json();
      setRankings(Array.isArray(data) ? data : []);
    } catch (err) { 
      console.error("Falha ao carregar ranking"); 
    }
  };

  // Busca dados do usuário logado
  const fetchUserStats = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.username && data.username !== "Visitante") {
        setUser(data);
      } else {
        handleLogout();
      }
    } catch (err) {
      handleLogout();
    }
  };

  useEffect(() => {
    fetchUserStats();
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

  // Lógica de XP baseada em acertos (cada 10 acertos = 1 nível)
  const xpPercentage = user ? (user.total_acertos % 10) * 10 : 0;
  const nextLevelThreshold = user ? 10 - (user.total_acertos % 10) : 10;

  if (!token) {
    return <LoginView onLogin={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans">
      <div className="max-w-5xl mx-auto px-6">
        
        <header className="flex flex-col md:flex-row justify-between items-center py-8 gap-6">
          <div className="cursor-pointer group" onClick={() => setView('menu')}>
            <h1 className="text-2xl font-black text-slate-900 leading-none italic uppercase group-hover:text-lime-600 transition-colors">
                Claudio <span className="text-lime-600">Ácido</span>
            </h1>
            <p className="text-slate-500 font-medium italic">@{user?.username || 'Carregando...'}</p>
          </div>

          <div className="flex flex-col items-end gap-2 w-full md:w-auto">
            <div className="flex items-center gap-3">
              <span className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 font-bold text-emerald-600">
                  🎯 {user?.total_acertos || 0} Acertos
              </span>
              <div className="relative group">
                <span className="bg-slate-900 px-6 py-2 rounded-xl shadow-md font-bold text-lime-400 border border-lime-500/50 block cursor-help">
                   Lvl {user?.nivel || 1}
                </span>
                <div className="absolute -bottom-10 right-0 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  Faltam {nextLevelThreshold} acertos para o Lvl {(user?.nivel || 1) + 1}
                </div>
              </div>
              <button onClick={handleLogout} className="ml-2 text-slate-400 hover:text-rose-500 font-bold text-xs uppercase transition-colors">Sair</button>
            </div>
            
            <div className="w-full md:w-64 bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-300 relative">
              <div 
                className="bg-lime-500 h-full transition-all duration-1000 ease-out shadow-[0_0_12px_#84cc16] barra-progresso-acido"
                style={{ width: `${xpPercentage}%` }}
              />
            </div>
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
              // Atualiza stats e rankings imediatamente após o treino
              fetchUserStats();
              fetchRankings();
            }} 
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 underline decoration-lime-400 italic">Descreve aí, fiote</h2>
                <textarea 
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 ring-lime-500 font-medium transition-all"
                  placeholder="Ex: Misturas gasosas, Estequiometria de pureza..."
                  rows="2"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                />
                <div className="mt-4 flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                  <span className="text-slate-700 font-bold text-sm uppercase tracking-tighter">Dose de Ácido:</span>
                  <div className="flex gap-2">
                    {[1, 3, 5].map((n) => (
                      <button 
                        key={n} 
                        onClick={() => setNumQuestions(n)} 
                        className={`w-10 h-10 rounded-xl font-bold transition-all ${numQuestions === n ? 'bg-lime-500 text-slate-950 scale-110 shadow-lg' : 'bg-white border border-slate-200 hover:border-lime-400'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setView('training')} 
                className="w-full bg-slate-900 text-white py-12 rounded-[2.5rem] shadow-2xl border-b-8 border-lime-600 flex flex-col items-center group active:translate-y-1 active:border-b-0 transition-all overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-lime-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-4xl font-black mb-2 uppercase italic text-lime-400 group-hover:tracking-widest transition-all relative z-10">DERRAMAR ÁCIDO</span>
                <span className="text-slate-400 font-medium uppercase text-sm tracking-widest relative z-10">Sintetizar via Banco de Dados & IA</span>
              </button>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
              <h2 className="text-xl font-black mb-6 underline decoration-lime-500 italic uppercase">🏆 Mestres Ácidos</h2>
              <div className="space-y-4">
                {rankings.length > 0 ? rankings.map((r, i) => (
                  <div key={i} className={`flex justify-between items-center p-3 rounded-xl transition-all ${i === 0 ? 'bg-lime-50 border border-lime-200 scale-105' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`font-black ${i === 0 ? 'text-lime-600' : i < 3 ? 'text-slate-600' : 'text-slate-400'}`}>
                        {i === 0 ? '👑' : `${i + 1}º`}
                      </span>
                      <span className="font-bold text-slate-700">{r.nickname}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-black text-slate-800">{r.xp} <span className="text-[9px] text-slate-400 uppercase tracking-tighter">pts</span></span>
                      <span className="text-[10px] font-bold text-lime-600 uppercase">Lvl {r.nivel}</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-slate-400 font-medium py-4">Nenhum mestre ainda...</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;