import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

export default function NewMovie() {
  const navigate = useNavigate();
  
  const [titulo, setTitulo] = useState('');
  const [ano, setAno] = useState('');
  const [generos, setGeneros] = useState('');
  const [diretores, setDiretores] = useState('');
  const [elenco, setElenco] = useState('');
  const [sinopse, setSinopse] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Deteta se há alterações para ativar o aviso de saída
  const isDirty = titulo || ano || generos || diretores || elenco || sinopse || posterUrl;

  // Bloqueio do navegador caso o utilizador tente fechar a aba ou atualizar a página
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !showSuccess) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, showSuccess]);

  const handleCancel = () => {
    if (isDirty) {
      const confirmLeave = window.confirm("Tens alterações não guardadas. Se saíres agora, o teu rascunho será perdido. Queres mesmo cancelar?");
      if (!confirmLeave) return;
    }
    navigate('/');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      titulo,
      ano_lancamento: parseInt(ano),
      sinopse,
      url_poster: posterUrl,
      generos: generos.split(',').map(s => s.trim()).filter(Boolean),
      diretores: diretores.split(',').map(s => s.trim()).filter(Boolean),
      elenco: elenco.split(',').map(s => s.trim()).filter(Boolean),
    };

    fetch('http://localhost:8000/api/v1/movies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(res => {
        if (!res.ok) throw new Error("Erro ao cadastrar filme");
        return res.json();
      })
      .then(() => {
        setShowSuccess(true);
        // Espera 2 segundos e redireciona para o catálogo
        setTimeout(() => {
          navigate('/');
        }, 2000);
      })
      .catch(err => {
        console.error(err);
        alert("Ocorreu um erro ao salvar o filme.");
        setSubmitting(false);
      });
  };

  // Ecrã de Sucesso
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-black text-white p-8 font-sans flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center animate-fadeIn">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(22,163,74,0.5)]">
            <span className="text-4xl">✓</span>
          </div>
          <h2 className="text-3xl font-bold text-zinc-100 mb-2">Filme Cadastrado!</h2>
          <p className="text-zinc-400">A redirecionar para o catálogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <Header />

      <main className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 border-b border-zinc-900 pb-4">
          <h1 className="text-2xl font-bold text-zinc-100 uppercase tracking-widest">
            Adicionar Novo Filme
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-10">
          
          {/* Lado Esquerdo: Preview do Poster */}
          <div className="w-full md:w-1/3 flex flex-col gap-4">
            <label className="block text-xs uppercase tracking-wider font-bold text-zinc-400">
              Poster (URL)
            </label>
            <input 
              type="url" 
              required
              value={posterUrl}
              onChange={(e) => setPosterUrl(e.target.value)}
              placeholder="Ex: https://img.omdbapi.com/?apikey=... (Opcional)"
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-all placeholder-zinc-700"
            />
            
            <div className="aspect-[2/3] w-full bg-zinc-900 rounded border border-zinc-800 flex items-center justify-center overflow-hidden mt-2 shadow-xl">
              {posterUrl ? (
                <img 
                  src={posterUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              ) : (
                <div className="text-center p-4">
                  <span className="text-4xl opacity-20 block mb-2">🖼️</span>
                  <p className="text-xs text-zinc-600 uppercase font-bold tracking-widest">Preview</p>
                </div>
              )}
            </div>
          </div>

          {/* Lado Direito: Campos do Formulário */}
          <div className="w-full md:w-2/3 flex flex-col gap-5">
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
              <div className="sm:col-span-3">
                <label className="block text-xs uppercase tracking-wider font-bold text-zinc-400 mb-2">Título</label>
                <input 
                  type="text" required value={titulo} onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Star Wars: Episódio V - O Império Contra-Ataca"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-all placeholder-zinc-700"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-xs uppercase tracking-wider font-bold text-zinc-400 mb-2">Ano</label>
                <input 
                  type="number" required value={ano} onChange={(e) => setAno(e.target.value)}
                  placeholder="Ex: 1980" min="1888" max="2100"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-all placeholder-zinc-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-zinc-400 mb-2">Gêneros (separados por vírgula)</label>
              <input 
                type="text" required value={generos} onChange={(e) => setGeneros(e.target.value)}
                placeholder="Ex: Ficção Científica, Ação, Aventura"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-all placeholder-zinc-700"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-zinc-400 mb-2">Direção (separados por vírgula)</label>
              <input 
                type="text" required value={diretores} onChange={(e) => setDiretores(e.target.value)}
                placeholder="Ex: Irvin Kershner, George Lucas"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-all placeholder-zinc-700"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-zinc-400 mb-2">Elenco Principal (separados por vírgula)</label>
              <input 
                type="text" required value={elenco} onChange={(e) => setElenco(e.target.value)}
                placeholder="Ex: Mark Hamill, Harrison Ford, Carrie Fisher"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-all placeholder-zinc-700"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-zinc-400 mb-2">Sinopse</label>
              <textarea 
                required rows={5} value={sinopse} onChange={(e) => setSinopse(e.target.value)}
                placeholder="Ex: Luke Skywalker inicia o seu treino Jedi com Yoda, enquanto os seus amigos são perseguidos implacavelmente por Darth Vader..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-4 text-sm text-white focus:outline-none focus:border-yellow-500 transition-all placeholder-zinc-700 resize-none leading-relaxed"
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-end gap-4 mt-4 pt-6 border-t border-zinc-900">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2.5 rounded text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-yellow-600 hover:bg-yellow-500 text-black text-xs font-bold uppercase tracking-widest px-8 py-2.5 rounded transition-colors cursor-pointer shadow-lg disabled:opacity-50"
              >
                {submitting ? 'A salvar...' : 'Cadastrar Filme'}
              </button>
            </div>

          </div>
        </form>
      </main>
    </div>
  );
}