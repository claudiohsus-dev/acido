import React, { useState, useEffect, useCallback } from 'react';
import TrainingView from './components/TrainingView'; 

// DEFINIÇÃO ÚNICA DA URL (Prioriza a variável do deploy, senão usa localhost)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const App = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [view, setView] = useState('login'); 
  const [username, setUsername] = useState('');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [customPrompt, setCustomPrompt] = useState('');
  const [numQuestions, setNumQuestions] = useState(1);

  const fetchStats = useCallback(async (authToken) => {
    try {
      const res = await fetch(`${API_URL}/stats`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        if (view === 'login') setView('menu');
      } else {
        handleLogout();
      }
    } catch (err) {
      setError("Erro ao conectar com o laboratório.");
    }
  }, [view]);

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
    if (token) fetchStats(token);
    fetchRankings();
  }, [token, fetchStats]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ALTERAÇÃO 1: O servidor espera 'nickname' conforme sua tabela SQL
        body: JSON.stringify({ nickname: username }) 
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setView('menu');
      } else {
        setError(data.error || "Erro ao entrar");
      }
    } catch (err) {
      setError("O Cláudio está offline.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setView('login');
  };

  if (view === 'login') {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-white p-4">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-lime-500/30 text-center">
          <h1 className="text-4xl font-black mb-2 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-green-500">
            CLÁUDIO DO <br/> ÁCIDO BUCÉTICO
          </h1>
          <p className="text-slate-400 mb-8 font-medium">Estequiometria corrosiva e extrema.</p>
          
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <input 
              required
              className="w-full p-4 rounded-2xl bg-slate-800 border border-slate-700 outline-none focus:ring-2 ring-lime-500 transition-all text-lg text-white"
              placeholder="Seu Nickname"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
            {error && <p className="text-red-400 text-sm font-medium">{error}</p>}
            <button 
              disabled={loading}
              className="w-full bg-lime-600 hover:bg-lime-500 disabled:bg-slate-700 py-4 rounded-2xl font-bold text-xl shadow-lg shadow-lime-500/20 transition-all active:scale-95 text-slate-950"
            >
              {loading ? 'SINTETIZANDO...' : 'ENTRAR NO LABORATÓRIO'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans">
      <div className="max-w-5xl mx-auto px-6">
        
        <header className="flex flex-col md:flex-row justify-between items-center py-8 gap-4">
          <div className="cursor-pointer" onClick={() => setView('menu')}>
            <h1 className="text-2xl font-black text-slate-900 leading-none italic">
               CLÁUDIO DO <span className="text-lime-600 uppercase">Ácido Bucético</span>
            </h1>
            {/* ALTERAÇÃO 2: O objeto user do banco vem com 'nickname' */}
            <p className="text-slate-500 font-medium italic">@{user?.nickname || user?.username}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <div className="flex gap-2">
                {/* ALTERAÇÃO 3: Ajustado para usar 'xp' que é o nome da sua coluna no SQL */}
                <span className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 font-bold text-lime-600">🧪 {user?.xp || 0} XP</span>
                <span className="bg-slate-900 px-4 py-2 rounded-xl shadow-md font-bold text-lime-400 border border-lime-500/50">Lvl {user?.nivel || 1}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-red-50 text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-100 font-bold">
              Deslogar
            </button>
          </div>
        </header>

        {view === 'training' ? (
          <TrainingView 
            token={token} 
            customPrompt={customPrompt} 
            numQuestions={numQuestions}
            onFinish={() => {
              fetchStats(token);
              setView('menu');
              setCustomPrompt(''); 
            }} 
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 underline decoration-lime-400">Descreve aí, fiote</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-slate-500 mb-2 text-sm font-medium">O que o menor quente deve preparar hoje?</p>
                    <textarea 
                      className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 ring-lime-500 transition-all text-slate-700"
                      placeholder="Ex: Misturas complexas, rendimento baixo..."
                      rows="2"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-slate-700 font-bold text-sm uppercase">Volume de Questões:</span>
                    <div className="flex gap-2">
                      {[1, 3, 5, 10].map((n) => (
                        <button
                          key={n}
                          onClick={() => setNumQuestions(n)}
                          className={`w-10 h-10 rounded-xl font-bold transition-all ${
                            numQuestions === n 
                            ? 'bg-lime-500 text-slate-950 shadow-md' 
                            : 'bg-white text-slate-400 border border-slate-200 hover:border-lime-300'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setView('training')} 
                className="w-full group bg-slate-900 text-white py-12 rounded-[2.5rem] shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.98] border-b-8 border-lime-600 flex flex-col items-center"
              >
                <span className="text-4xl font-black tracking-tighter mb-2 uppercase italic text-lime-400">DERRAMAR ÁCIDO</span>
                <span className="text-slate-400 font-medium uppercase tracking-widest text-sm group-hover:text-white transition-colors">
                  Iniciar {numQuestions > 1 ? `Simulado (${numQuestions})` : 'Treino'} via IA
                </span>
              </button>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 h-fit">
              <h2 className="text-xl font-black mb-6 flex items-center gap-2 underline decoration-lime-500">🏆 Mestres Ácidos</h2>
              <div className="space-y-4">
                {rankings.map((r, i) => (
                  <div key={i} className={`flex justify-between items-center p-3 rounded-xl ${i === 0 ? 'bg-lime-50 border border-lime-200 shadow-sm' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${i === 0 ? 'text-lime-600' : 'text-slate-400'}`}>{i+1}º</span>
                      {/* ALTERAÇÃO 4: Ranking também usa nickname */}
                      <span className="font-bold text-slate-700">{r.nickname || r.username}</span>
                    </div>
                    <span className="font-black text-slate-800">{r.xp || r.pontos} XP</span>
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