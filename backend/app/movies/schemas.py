from pydantic import BaseModel, ConfigDict
from typing import Optional

#esta classe é responsável por separar e organizar as saídas e campos que serão expostos na Swagger UI 

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

    #configuração crucial para que o Pydantic saiba ler objetos do SQLAlchemy
    model_config = ConfigDict(from_attributes=True)