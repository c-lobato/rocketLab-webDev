import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';

interface Review {
  nome: string;
  nota: number;
  comentario: string;
}

interface MovieDetail {
  sk_movie_id: string;
  titulo: string;
  ano_lancamento: number | null;
  duracao_minutos: number | null;
  sinopse: string | null;
  url_poster: string | null;
  media_avaliacoes: number | null;
  nota_estrelas: number;
  generos: string[];
  elenco: string[];
  diretores: string[];
  produtoras: string[];
  reviews: Review[];
}

export default function MovieDetails() {
  const { id_do_filme } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados do Modal / Popup de Avaliação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [notaSelecionada, setNotaSelecionada] = useState(10); // Ex: 10 = 5 estrelas
  const [hoverNota, setHoverNota] = useState<number | null>(null);
  const [comentario, setComentario] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMovieDetails = () => {
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
  };

  useEffect(() => {
    fetchMovieDetails();
  }, [id_do_filme]);

  const handleDelete = () => {
    const confirmacao = window.confirm("Tem a certeza que deseja eliminar este filme? Esta ação não pode ser desfeita.");
    if (!confirmacao) return;

    fetch(`http://localhost:8000/api/v1/movies/${id_do_filme}`, {
      method: 'DELETE',
    })
      .then(res => {
        if (!res.ok) throw new Error("Erro ao eliminar filme");
        // Após eliminar com sucesso, volta automaticamente para o catálogo
        navigate('/');
      })
      .catch(err => {
        console.error("Erro na exclusão:", err);
        alert("Ocorreu um erro ao tentar eliminar o filme.");
      });
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeUsuario.trim() || !comentario.trim()) return;

    setSubmitting(true);

    fetch(`http://localhost:8000/api/v1/movies/${id_do_filme}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: nomeUsuario,
        nota: notaSelecionada,
        comentario: comentario,
      }),
    })
      .then(res => {
        if (!res.ok) throw new Error("Erro ao salvar avaliação");
        return res.json();
      })
      .then(() => {
        // Sucesso: fecha modal, limpa campos e recarrega os dados
        setIsModalOpen(false);
        setComentario('');
        setNomeUsuario('');
        setNotaSelecionada(10);
        setSubmitting(false);
        fetchMovieDetails();
      })
      .catch(err => {
        console.error(err);
        setSubmitting(false);
      });
  };

  const renderStars = (estrelas: number) => {
    return (
      <div className="flex items-center gap-0.5 text-yellow-500 text-lg">
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

  const renderSmallStars = (nota_original_0_a_10: number) => {
    const estrelas = Math.round((nota_original_0_a_10 / 2.0) * 2) / 2;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-sans">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-zinc-800 border-t-yellow-500 rounded-full animate-spin"></div>
          <p className="text-zinc-500 tracking-widest uppercase text-sm">Carregando filme...</p>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-black text-white p-8 font-sans">
        <Header />
        <div className="text-center py-20">
          <p className="text-xl text-zinc-400 mb-4">Filme não encontrado.</p>
        </div>
      </div>
    );
  }

  const activeNota = hoverNota !== null ? hoverNota : notaSelecionada;

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans relative">
      <Header />

      <main className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12">
        {/* Lado Esquerdo: Poster e Botões de Ação */}
        <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
          <div className="sticky top-8 flex flex-col gap-4">
            
            <div className="aspect-[2/3] bg-zinc-900 rounded border border-zinc-800 flex items-center justify-center shadow-2xl overflow-hidden">
              {movie.url_poster ? (
                <img src={movie.url_poster} alt={movie.titulo} className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl opacity-20">🎬</span>
              )}
            </div>

            {/* Painel de Administração (Editar e Excluir) */}
            <div className="flex gap-2">
              <button 
                onClick={() => console.log("A preparar a edição...")}
                className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black text-xs font-bold uppercase tracking-widest py-3 rounded transition-colors cursor-pointer shadow-lg"
              >
                Editar
              </button>
              
              <button 
                onClick={handleDelete}
                className="flex-1 bg-red-900/80 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-widest py-3 rounded transition-colors border border-red-800 hover:border-red-500 cursor-pointer shadow-lg"
              >
                Excluir
              </button>
            </div>

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
            <div className="flex items-center gap-2">
               {renderStars(movie.nota_estrelas)}
            </div>
          </div>

          {movie.generos.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {movie.generos.map((genero, idx) => (
                <span key={idx} className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full font-medium tracking-wide">
                  {genero}
                </span>
              ))}
            </div>
          )}

          <div className="border-t border-zinc-900 pt-6 mb-6">
            <h3 className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-3">Sinopse</h3>
            <p className="text-zinc-300 text-lg leading-relaxed max-w-3xl">
              {movie.sinopse || 'Este filme ainda não possui sinopse registada na base de dados.'}
            </p>
          </div>

          <div className="border-t border-zinc-900 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            {movie.diretores.length > 0 && (
              <div>
                <h4 className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-2">Direção</h4>
                <p className="text-zinc-200 text-sm font-medium">{movie.diretores.join(', ')}</p>
              </div>
            )}
            {movie.produtoras.length > 0 && (
              <div>
                <h4 className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-2">Produtoras</h4>
                <p className="text-zinc-200 text-sm font-medium">{movie.produtoras.join(', ')}</p>
              </div>
            )}
          </div>

          {movie.elenco.length > 0 && (
            <div className="border-t border-zinc-900 pt-6">
              <h4 className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-2">Elenco Principal</h4>
              <p className="text-zinc-300 text-sm leading-relaxed">{movie.elenco.join(', ')}</p>
            </div>
          )}

          {/* SEÇÃO DE AVALIAÇÕES + BOTÃO DE AVALIAR */}
          <div className="border-t border-zinc-900 pt-10 mt-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-zinc-500 text-xs uppercase tracking-widest font-bold">
                Avaliações de Usuários ({movie.reviews.length})
              </h3>
              
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded transition-colors cursor-pointer flex items-center gap-1.5 shadow-lg"
              >
                <span>+</span> Avaliar
              </button>
            </div>
            
            {movie.reviews.length === 0 ? (
              <p className="text-zinc-500 italic">Ainda não há avaliações para este filme. Seja o primeiro a avaliar!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {movie.reviews.map((review, idx) => (
                  <div key={idx} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-zinc-200 text-sm">{review.nome}</span>
                      {renderSmallStars(review.nota)}
                    </div>
                    <p className="text-zinc-400 text-sm italic leading-relaxed whitespace-pre-line">"{review.comentario}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* MODAL / POPUP ESTILO LETTERBOXD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-lg shadow-2xl overflow-hidden text-zinc-100">
            
            {/* Header do Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/80">
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300">
                Avaliar <span className="text-yellow-500">{movie.titulo}</span>
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white text-xl font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmitReview} className="p-6 flex flex-col gap-5">
              
              {/* Nome do Usuário */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-zinc-400 mb-2">
                  Seu Nome
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Insira seu nome..."
                  value={nomeUsuario}
                  onChange={(e) => setNomeUsuario(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all placeholder-zinc-600"
                />
              </div>

              {/* Classificação em Estrelas Interativa */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-zinc-400 mb-2">
                  Sua Nota
                </label>
                <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded p-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((starIdx) => {
                      const notaMeia = starIdx * 2 - 1; // 1, 3, 5, 7, 9 (0.5, 1.5...)
                      const notaCheia = starIdx * 2;    // 2, 4, 6, 8, 10 (1.0, 2.0...)
                      
                      return (
                        <div key={starIdx} className="relative inline-block text-2xl transition-transform hover:scale-110">
                          {/* Estrela base (cinza) */}
                          <span className="text-zinc-700">★</span>
                          
                          {/* Preenchimento dinâmico visual */}
                          {activeNota >= notaCheia ? (
                            <span className="absolute top-0 left-0 text-yellow-500 pointer-events-none">★</span>
                          ) : activeNota >= notaMeia ? (
                            <span className="absolute top-0 left-0 text-yellow-500 overflow-hidden w-[50%] pointer-events-none">★</span>
                          ) : null}

                          {/* Áreas de clique invisíveis sobrepostas */}
                          <button
                            type="button"
                            onClick={() => setNotaSelecionada(notaMeia)}
                            onMouseEnter={() => setHoverNota(notaMeia)}
                            onMouseLeave={() => setHoverNota(null)}
                            className="absolute top-0 left-0 w-1/2 h-full z-10 cursor-pointer focus:outline-none"
                            title={`${notaMeia / 2} estrelas`}
                          />
                          <button
                            type="button"
                            onClick={() => setNotaSelecionada(notaCheia)}
                            onMouseEnter={() => setHoverNota(notaCheia)}
                            onMouseLeave={() => setHoverNota(null)}
                            className="absolute top-0 right-0 w-1/2 h-full z-10 cursor-pointer focus:outline-none"
                            title={`${notaCheia / 2} estrelas`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-xs text-zinc-500 font-semibold ml-2">
                    ({activeNota / 2} de 5)
                  </span>
                </div>
              </div>

              {/* Caixas de Texto da Resenha com Limite Visual */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs uppercase tracking-wider font-bold text-zinc-400">
                    Sua Resenha
                  </label>
                  <span className={`text-xs font-mono ${comentario.length > 3800 ? 'text-red-400' : 'text-zinc-500'}`}>
                    {comentario.length} / 4000
                  </span>
                </div>
                <textarea 
                  required
                  rows={6}
                  maxLength={4000}
                  placeholder="Escreva sua resenha..."
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-4 text-sm text-zinc-200 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all placeholder-zinc-600 resize-none font-sans leading-relaxed"
                />
              </div>

              {/* Ações / Botão Salvar */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded transition-colors cursor-pointer shadow-lg"
                >
                  {submitting ? 'Salvando...' : 'Salvar Resenha'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}