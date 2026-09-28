import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

interface Movie {
  sk_movie_id: string;
  titulo: string;
  ano_lancamento: number | null;
  url_poster: string | null;
  nota_estrelas: number;
}

export default function Catalog() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialSearch = searchParams.get('search') || '';

  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [activeSearch, setActiveSearch] = useState(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch);

  const navigateTo = (page: number, search: string) => {
    setCurrentPage(page);
    setActiveSearch(search);
    
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('page', page.toString());
    
    if (search) {
      newUrl.searchParams.set('search', search);
    } else {
      newUrl.searchParams.delete('search');
    }
    
    window.history.pushState({}, '', newUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const query = activeSearch 
      ? `?titulo=${encodeURIComponent(activeSearch)}&page=${currentPage}` 
      : `?page=${currentPage}`;
      
    fetch(`http://localhost:8000/api/v1/movies${query}`)
      .then(response => response.json())
      .then(data => {
        setMovies(data.items || (Array.isArray(data) ? data : [])); 
        setTotalPages(data.total_pages || 1); 
      })
      .catch(error => console.error("Erro ao buscar filmes:", error));
  }, [currentPage, activeSearch]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      navigateTo(1, searchInput);
    }
  };

  const handleVoltarCatalogo = () => {
    setSearchInput('');
    navigateTo(1, '');
  };

  const renderStars = (estrelas: number) => {
    return (
      <div className="flex items-center gap-0.5 text-yellow-500 text-xs">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const difference = estrelas - starIndex + 1;
          if (difference >= 1) return <span key={starIndex}>★</span>;
          if (difference > 0) return (
            <span key={starIndex} className="relative inline-block text-zinc-700">
              ★<span className="absolute top-0 left-0 overflow-hidden text-yellow-500 w-[50%]">★</span>
            </span>
          );
          return <span key={starIndex} className="text-zinc-700">★</span>;
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <Header />

      <main className="max-w-7xl mx-auto">
        {activeSearch && (
          <div className="mb-6 pb-2 border-b border-zinc-900">
            <h2 className="text-xs text-zinc-500 font-semibold uppercase tracking-widest">
              Mostrando resultados para <span className="text-zinc-300">"{activeSearch}"</span>
            </h2>
          </div>
        )}

        {movies.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-lg">Nenhum filme encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {movies.map((movie) => (
              <Link 
                key={movie.sk_movie_id} 
                to={`/filme/${movie.sk_movie_id}`} 
                className="group cursor-pointer flex flex-col"
              >
                <div className="aspect-[2/3] bg-zinc-900 rounded border border-zinc-800 flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:border-yellow-500 group-hover:shadow-[0_0_15px_rgba(234,179,8,0.2)] overflow-hidden">
                  {movie.url_poster ? (
                    <img src={movie.url_poster} alt={movie.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl opacity-20 group-hover:scale-110 transition-transform duration-300">🎬</span>
                  )}
                </div>
                <div className="mt-2">
                  <h2 className="font-semibold text-zinc-200 text-sm truncate group-hover:text-yellow-500 transition-colors" title={movie.titulo}>
                    {movie.titulo}
                  </h2>
                  <div className="flex justify-between items-center text-xs text-zinc-500 mt-1 font-medium">
                    <span>{movie.ano_lancamento || 'N/A'}</span>
                    {renderStars(movie.nota_estrelas)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-12 mb-12 border-t border-zinc-800 pt-8 font-sans">
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2))
                .map((p, index, array) => {
                  const prev = array[index - 1];
                  const showEllipsis = prev && p - prev > 1;

                  return (
                    <div key={p} className="flex items-center">
                      {showEllipsis && <span className="text-zinc-600 px-2 tracking-widest">...</span>}
                      <button
                        onClick={() => navigateTo(p, activeSearch)}
                        className={`px-3 py-1 mx-0.5 rounded text-sm transition-all ${
                          currentPage === p 
                            ? 'bg-zinc-700 text-white font-bold' 
                            : 'bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white font-medium'
                        }`}
                      >
                        {p}
                      </button>
                    </div>
                  );
                })
              }
              {currentPage < totalPages && (
                <button
                  onClick={() => navigateTo(currentPage + 1, activeSearch)}
                  className="ml-4 text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors"
                >
                  Próxima →
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}