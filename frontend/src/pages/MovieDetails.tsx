import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

interface MovieDetail {
  sk_movie_id: string;
  titulo: string;
  ano_lancamento: number | null;
  duracao_minutos: number | null;
  sinopse: string | null;
  url_poster: string | null;
  url_backdrop: string | null;
  media_avaliacoes: number | null;
  nota_estrelas: number;
}

export default function MovieDetails() {
  const { id_do_filme } = useParams();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/api/v1/movies/${id_do_filme}`)
      .then(response => {
        if (!response.ok) throw new Error("Filme não encontrado");
        return response.json();
      })
      .then(data => {
        setMovie(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Erro ao buscar detalhes:", error);
        setLoading(false);
      });
  }, [id_do_filme]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-sans">
        <p className="text-zinc-500 tracking-widest uppercase text-sm animate-pulse">A carregar detalhes...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-sans">
        <p className="text-xl text-zinc-400 mb-4">Filme não encontrado.</p>
        <Link to="/" className="text-yellow-500 hover:underline">← Voltar ao Catálogo</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <header className="mb-10 max-w-7xl mx-auto flex items-center justify-between border-b border-zinc-800 pb-5">
        <Link to="/" className="text-3xl font-bold text-yellow-500 tracking-wider uppercase hover:text-yellow-400 transition-colors">
          Rocket Movies
        </Link>
        <Link to="/" className="text-sm font-semibold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">
          ← Voltar ao Catálogo
        </Link>
      </header>

      <main className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12">
        {/* Poster */}
        <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
          <div className="aspect-[2/3] bg-zinc-900 rounded border border-zinc-800 flex items-center justify-center shadow-2xl overflow-hidden">
            {movie.url_poster ? (
              <img src={movie.url_poster} alt={movie.titulo} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl opacity-20">🎬</span>
            )}
          </div>
        </div>

        {/* Informações detalhadas */}
        <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-100 mb-2">
            {movie.titulo} <span className="text-zinc-500 text-3xl font-normal">({movie.ano_lancamento || 'N/A'})</span>
          </h1>
          
          <div className="flex items-center gap-4 text-sm text-zinc-400 uppercase tracking-wider font-semibold mb-6">
            <span>Duração: {movie.duracao_minutos ? `${movie.duracao_minutos} min` : 'N/A'}</span>
            <span>•</span>
            <span className="text-yellow-500">Média: {movie.media_avaliacoes ?? 'Sem notas'} / 10</span>
          </div>

          <div className="border-t border-zinc-900 pt-6 mt-2">
            <h3 className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-3">Sinopse</h3>
            <p className="text-zinc-300 text-lg leading-relaxed max-w-3xl">
              {movie.sinopse || 'Este filme ainda não possui sinopse registada na base de dados.'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}