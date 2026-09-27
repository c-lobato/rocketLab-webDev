from pydantic import BaseModel, ConfigDict
from typing import Optional

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
    
    # Campo normal, obrigatório, sem mágica
    nota_estrelas: float 

    model_config = ConfigDict(from_attributes=True)