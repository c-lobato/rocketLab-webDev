from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class MovieResponse(BaseModel):
    sk_movie_id: str
    id_filme: str
    titulo: str
    ano_lancamento: Optional[int] = None
    duracao_minutos: Optional[int] = None
    sinopse: Optional[str] = None
    status_filme: Optional[str] = None
    url_poster: Optional[str] = None
    url_backdrop: Optional[str] = None
    media_avaliacoes: Optional[float] = None
    
    nota_estrelas: float 

    model_config = ConfigDict(from_attributes=True)

class PaginatedMovieResponse(BaseModel):
    total_items: int
    total_pages: int
    current_page: int
    items: List[MovieResponse]

class MovieDetailResponse(MovieResponse):
    orcamento_usd: Optional[float] = None
    receita_usd: Optional[float] = None
    lucro_usd: Optional[float] = None
    generos: List[str] = []
    elenco: List[str] = []
    diretores: List[str] = []
    produtoras: List[str] = []

    model_config = ConfigDict(from_attributes=True)