import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Catalog from './pages/Catalog';
import MovieDetails from './pages/MovieDetails';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota principal: O Catálogo */}
        <Route path="/" element={<Catalog />} />
        
        {/* Rota dinâmica: A página do Filme */}
        <Route path="/filme/:id_do_filme" element={<MovieDetails />} />
      </Routes>
    </BrowserRouter>
  );
}