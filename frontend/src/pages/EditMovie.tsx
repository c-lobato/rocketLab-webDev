import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';

export default function EditMovie() {
  const { id_do_filme } = useParams();
  const navigate = useNavigate();

  const [titulo, setTitulo] = useState('');
  const [ano, setAno] = useState('');
  const [poster, setPoster] = useState('');
  const [generos, setGeneros] = useState('');
  const [diretores, setDiretores] = useState('');
  const [elenco, setElenco] = useState('');
  const [sinopse, setSinopse] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Carregar os dados atuais do filme
  useEffect(() => {
    fetch(`http://localhost:8000/api/v1/movies/${id_do_filme}`)
      .then((res) => {
        if (!res.ok) throw new Error('Filme não encontrado');
        return res.json();
      })
      .then((data) => {
        setTitulo(data.titulo || '');
        setAno(data.ano_lancamento ? data.ano_lancamento.toString() : '');
        setPoster(data.url_poster || '');
        setSinopse(data.sinopse || '');
        
        // Converte os arrays vindos do backend de volta para strings separadas por vírgula
        // Ajuste caso o seu backend devolva objetos em vez de strings simples
        setGeneros(Array.isArray(data.generos) ? data.generos.join(', ') : '');
        setDiretores(Array.isArray(data.diretores) ? data.diretores.join(', ') : '');
        setElenco(Array.isArray(data.elenco) ? data.elenco.join(', ') : '');
        
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar filme:", err);
        alert("Não foi possível carregar os dados do filme.");
        navigate('/');
      });
  }, [id_do_filme, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      titulo,
      ano_lancamento: parseInt(ano, 10),
      url_poster: poster,
      sinopse,
      generos: generos.split(',').map(g => g.trim()).filter(g => g !== ''),
      diretores: diretores.split(',').map(d => d.trim()).filter(d => d !== ''),
      elenco: elenco.split(',').map(a => a.trim()).filter(a => a !== '')
    };

    fetch(`http://localhost:8000/api/v1/movies/${id_do_filme}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) throw new Error("Erro ao atualizar filme");
        // Redireciona de volta para a página de detalhes do filme atualizado
        navigate(`/filme/${id_do_filme}`);
      })
      .catch(err => {
        console.error(err);
        alert("Ocorreu um erro ao guardar as alterações.");
      });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white font-sans p-6">
        <Header />
        <p className="text-center text-zinc-500 mt-20">A carregar dados do filme...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6">
      <Header />
      
      <main className="max-w-4xl mx-auto flex gap-12">
        {/* Lado Esquerdo: Preview do Poster */}
        <div className="w-1/3 flex-shrink-0">
          <p className="text-xs font-bold text-zinc-500 mb-2 uppercase tracking-widest">Poster (URL)</p>
          <input 
            type="text" 
            value={poster}
            onChange={(e) => setPoster(e.target.value)}
            placeholder="https://..."
            className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300 focus:border-yellow-500 focus:outline-none mb-4"
          />
          <div className="aspect-[2/3] bg-zinc-900 rounded border border-zinc-800 flex items-center justify-center overflow-hidden">
            {poster ? (
              <img src={poster} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-zinc-700 text-sm">Sem Imagem</span>
            )}
          </div>
        </div>

        {/* Lado Direito: Formulário de Edição */}
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-widest">Título do Filme</label>
                <input 
                  type="text" 
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                  className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-zinc-300 focus:border-yellow-500 focus:outline-none"
                />
              </div>
              <div className="w-32">
                <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-widest">Ano</label>
                <input 
                  type="number" 
                  value={ano}
                  onChange={(e) => setAno(e.target.value)}
                  required
                  className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-zinc-300 focus:border-yellow-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-widest">Gêneros (separados por vírgula)</label>
              <input 
                type="text" 
                value={generos}
                onChange={(e) => setGeneros(e.target.value)}
                placeholder="Ex: Ação, Ficção Científica"
                className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-zinc-300 focus:border-yellow-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-widest">Direção (separados por vírgula)</label>
              <input 
                type="text" 
                value={diretores}
                onChange={(e) => setDiretores(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-zinc-300 focus:border-yellow-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-widest">Elenco Principal (separados por vírgula)</label>
              <input 
                type="text" 
                value={elenco}
                onChange={(e) => setElenco(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-zinc-300 focus:border-yellow-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-widest">Sinopse</label>
              <textarea 
                value={sinopse}
                onChange={(e) => setSinopse(e.target.value)}
                rows={5}
                className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-zinc-300 focus:border-yellow-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-4 mt-4">
              <button 
                type="button"
                onClick={() => navigate(`/filme/${id_do_filme}`)}
                className="px-6 py-3 text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="bg-yellow-600 hover:bg-yellow-500 text-black px-8 py-3 rounded text-xs font-bold uppercase tracking-widest transition-colors shadow-lg cursor-pointer"
              >
                Guardar Alterações
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}