import { useState, useEffect } from 'react';

interface Movie {
  sk_movie_id: string;
  titulo: string;
  ano_lancamento: number | null;
  url_poster: string | null;
  nota_estrelas: number; // Agora este campo vem sempre preenchido pelo backend
}

export default function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Busca os filmes na API, aplicando o filtro de título se houver
    const query = searchTerm ? `?titulo=${encodeURIComponent(searchTerm)}` : '';
    fetch(`http://localhost:8000/api/v1/movies${query}`)
      .then(response => response.json())
      .then(data => setMovies(data))
      .catch(error => console.error("Erro ao buscar filmes:", error));
  }, [searchTerm]);

  // Função que desenha as estrelas (estilo Letterboxd)
  const renderStars = (estrelas: number) => {
    return (
      <div className="flex items-center gap-0.5 text-yellow-500 text-xs">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const difference = estrelas - starIndex + 1;
          
          if (difference >= 1) {
            // Estrela inteira dourada
            return <span key={starIndex}>★</span>;
          } else if (difference > 0) {
            // Meia estrela (dourada e cinza)
            return (
              <span key={starIndex} className="relative inline-block text-zinc-700">
                ★
                <span className="absolute top-0 left-0 overflow-hidden text-yellow-500 w-[50%]">★</span>
              </span>
            );
          } else {
            // Estrela vazia (cinza escuro)
            return <span key={starIndex} className="text-zinc-700">★</span>;
          }
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      
      {/* Cabeçalho */}
      <header className="mb-10 max-w-7xl mx-auto flex items-center justify-between border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-yellow-500 tracking-wider uppercase">
            Rocket Movies
          </h1>
        </div>
        
        {/* Barra de pesquisa */}
        <div className="hidden sm:block">
          <input 
            type="text" 
            placeholder="Pesquisar filmes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded px-4 py-2 text-sm focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 w-72 transition-all text-white placeholder-zinc-500"
          />
        </div>
      </header>

      {/* Grelha de Filmes */}
      <main className="max-w-7xl mx-auto">
        {movies.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-lg">Nenhum filme encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {movies.map((movie) => (
              <div key={movie.sk_movie_id} className="group cursor-pointer flex flex-col">
                
                {/* Poster */}
                <div className="aspect-[2/3] bg-zinc-900 rounded border border-zinc-800 flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:border-yellow-500 group-hover:shadow-[0_0_15px_rgba(234,179,8,0.2)] overflow-hidden">
                  {movie.url_poster ? (
                    <img src={movie.url_poster} alt={movie.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl opacity-20 group-hover:scale-110 transition-transform duration-300">🎬</span>
                  )}
                </div>
                
                {/* Informações do Filme */}
                <div className="mt-2">
                  <h2 className="font-semibold text-zinc-200 text-sm truncate group-hover:text-yellow-500 transition-colors" title={movie.titulo}>
                    {movie.titulo}
                  </h2>
                  <div className="flex justify-between items-center text-xs text-zinc-500 mt-1 font-medium">
                    <span>{movie.ano_lancamento || 'N/A'}</span>
                    
                    {/* Renderiza as estrelas passando o valor exato que veio da API */}
                    {renderStars(movie.nota_estrelas)}
                    
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}