import React from 'react';

const ResultsModal = ({ acertos, total, isSurvival, onExit }) => {
  const porcentagem = Math.round((acertos / total) * 100);
  const explodiu = isSurvival && acertos < total;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`max-w-md w-full p-10 rounded-[3rem] shadow-2xl border-4 transform animate-in zoom-in-95 duration-500 ${
        explodiu ? 'bg-rose-900 border-rose-500' : 'bg-white border-lime-500'
      }`}>
        
        <div className="text-center">
          <div className="text-6xl mb-6">
            {explodiu ? '💀' : porcentagem >= 70 ? '🧪' : '🧊'}
          </div>
          
          <h2 className={`text-3xl font-black uppercase italic mb-2 ${explodiu ? 'text-white' : 'text-slate-900'}`}>
            {explodiu ? 'Laboratório em Cinzas' : 'Relatório de Ensaio'}
          </h2>
          
          <p className={`font-bold mb-8 uppercase text-[10px] tracking-[0.3em] ${explodiu ? 'text-rose-300' : 'text-slate-400'}`}>
            {isSurvival ? 'Modo Morte Súbita' : 'Treino Concluído'}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-black/20 p-6 rounded-3xl">
              <span className="block text-[10px] font-black text-white/50 uppercase mb-1">Acertos</span>
              <span className="text-4xl font-black text-white">{acertos}</span>
            </div>
            <div className="bg-black/20 p-6 rounded-3xl">
              <span className="block text-[10px] font-black text-white/50 uppercase mb-1">Eficácia</span>
              <span className="text-4xl font-black text-white">{porcentagem}%</span>
            </div>
          </div>

          <p className={`italic text-sm mb-10 leading-relaxed ${explodiu ? 'text-rose-200' : 'text-slate-600'}`}>
            {explodiu 
              ? "Cláudio: 'Eu avisei que era instável. Pelo menos os bombeiros chegaram rápido.'" 
              : "Cláudio: 'Nada mal. Seus neurônios ainda não derreteram completamente.'"}
          </p>

          <button 
            onClick={onExit}
            className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg active:scale-95 ${
              explodiu 
                ? 'bg-white text-rose-900 hover:bg-rose-100' 
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            Voltar ao Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsModal;