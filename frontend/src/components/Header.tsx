import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchInput.trim() !== '') {
      // Redireciona para o catálogo levando o parâmetro de busca na URL
      navigate(`/?search=${encodeURIComponent(searchInput)}`);
    }
  };

  const handleVoltarCatalogo = () => {
    setSearchInput('');
    navigate('/');
  };

  return (
    <header className="mb-10 max-w-7xl mx-auto flex items-center justify-between border-b border-zinc-800 pb-5 font-sans">
      <div className="flex items-center gap-8">
        <h1 
          onClick={handleVoltarCatalogo}
          className="text-3xl font-bold text-yellow-500 tracking-wider uppercase cursor-pointer hover:text-yellow-400 transition-colors"
        >
          Rocket Movies
        </h1>
        
        <nav>
          <button 
            onClick={handleVoltarCatalogo}
            className="text-sm font-semibold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors cursor-pointer"
          >
            Catálogo
          </button>
        </nav>
      </div>
      
      {/* Barra de pesquisa global */}
      <div className="hidden sm:block">
        <input 
          type="text" 
          placeholder="Pesquisar filmes e pressione Enter..." 
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-zinc-900 border border-zinc-700 rounded px-4 py-2 text-sm focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 w-72 transition-all text-white placeholder-zinc-500"
        />
      </div>
    </header>
  );
}