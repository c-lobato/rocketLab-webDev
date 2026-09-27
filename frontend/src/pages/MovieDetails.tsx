import { useParams, Link } from 'react-router-dom';

export default function MovieDetails() {
  const { id_do_filme } = useParams();

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

      <main className="max-w-7xl mx-auto flex flex-col md:flex-row gap-10">
        <div className="w-full md:w-1/3 lg:w-1/4">
          <div className="aspect-[2/3] bg-zinc-900 rounded border border-zinc-800 flex items-center justify-center shadow-2xl">
            <span className="text-zinc-600">Poster Aqui</span>
          </div>
        </div>

        <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-100 mb-2">
            Título do Filme <span className="text-zinc-500 text-3xl font-normal">(202X)</span>
          </h1>
          
          <div className="flex items-center gap-4 text-sm text-zinc-400 uppercase tracking-wider font-semibold mb-8">
            <span>Duração: --- min</span>
          </div>

          <p className="text-zinc-300 text-lg leading-relaxed max-w-3xl mb-8">
            Estamos a testar a navegação. O ID do filme que vamos procurar no backend é: <strong className="text-yellow-500">{id_do_filme}</strong>.
          </p>
        </div>
      </main>
    </div>
  );
}