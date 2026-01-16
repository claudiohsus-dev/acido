import React, { useState } from 'react';

const LoginView = ({ onLogin }) => {
  const [name, setName] = useState('');

  const handleLogin = async () => {
    const res = await fetch('https://acido-klur.onrender.com/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: name })
    });
    const data = await res.json();
    onLogin(data.token, data.user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md w-full text-center border-b-8 border-lime-500">
        <h2 className="text-3xl font-black mb-2 italic">IDENTIFIQUE-SE, <span className="text-lime-600">ALQUIMISTA</span></h2>
        <p className="text-slate-500 mb-8 font-medium">Insira seu nome para registrar seus acertos no ranking.</p>
        <input 
          className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 mb-4 text-center font-bold text-xl outline-none focus:border-lime-500"
          placeholder="Seu Nome ou Nickname"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button 
          onClick={handleLogin}
          className="w-full bg-slate-900 text-lime-400 py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform"
        > Entrar no Laboratório </button>
      </div>
    </div>
  );
};

export default LoginView;