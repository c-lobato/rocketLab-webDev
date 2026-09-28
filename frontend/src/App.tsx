import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Catalog from './pages/Catalog';
import MovieDetails from './pages/MovieDetails';
import NewMovie from './pages/NewMovie'; 
import EditMovie from './pages/EditMovie';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota principal: O Catálogo */}
        <Route path="/" element={<Catalog />} />
        
        {/* Rota dinâmica: A página do Filme */}
        <Route path="/filme/:id_do_filme" element={<MovieDetails />} />
        
        {/* Rota do formulário de Cadastro */}
        <Route path="/cadastrar" element={<NewMovie />} />

        {/* Rota da página de Edição de filme*/}
        <Route path="/editar/:id_do_filme" element={<EditMovie />} />
      </Routes>
    </BrowserRouter>
  );
}