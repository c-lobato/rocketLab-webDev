from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import Optional

from app.db.session import get_db
from app.movies.models import DimMovie, MovieReview
from app.movies.schemas import MovieResponse

api_router = APIRouter()

#listagem dos filmes
@api_router.get("/movies", response_model=list[MovieResponse], tags=["Movies"])
async def list_movies(
    skip: int = 0, 
    limit: int = 20, 
    titulo: Optional[str] = None, 
    db: AsyncSession = Depends(get_db)
    ):

    stmt = (
        select(
            DimMovie,
            func.coalesce(func.avg(MovieReview.nota), 0.0).label("media_avaliacoes")
        )
        .outerjoin(MovieReview, DimMovie.sk_movie_id == MovieReview.sk_movie_id)
        .group_by(DimMovie.sk_movie_id)
        .offset(skip)
        .limit(limit)
    )

    if titulo:
        stmt = stmt.where(DimMovie.titulo.icontains(titulo))
    
    result = await db.execute(stmt)
    rows = result.all()
    
    movies_list = []
    for movie, media in rows:
        # Pega os campos do modelo SQLAlchemy
        movie_data = {column.name: getattr(movie, column.name) for column in movie.__table__.columns}
        
        # 1. Injeta a média (ou null se não tiver)
        media_val = round(media, 1) if media else None
        movie_data["media_avaliacoes"] = media_val
        
        # 2. Calcula as estrelas (0-5)
        if media_val:
            movie_data["nota_estrelas"] = round((media_val / 2.0) * 2) / 2
        else:
            movie_data["nota_estrelas"] = 0.0
            
        # Instancia o Pydantic explicitamente para garantir que o FastAPI leia tudo!
        movies_list.append(MovieResponse(**movie_data))
    
    return movies_list

#busca dos filmes pelo id (nao está relacionado à barra de pesquisa)
@api_router.get("/{movie_id}", response_model=MovieResponse, tags=["Movies"])
async def get_movie(movie_id: str, db: AsyncSession = Depends(get_db)):
    
    query = select(DimMovie).where(DimMovie.sk_movie_id == movie_id)
    result = await db.execute(query)
    movie = result.scalars().first()   #retorna o primeiro registro encontrado 

    if not movie:
        raise HTTPException(status_code=404, detail="Filme não encontrado")

    #calculo das medias de notas do filme
    query_media = select(func.avg(MovieReview.nota)).where(MovieReview.sk_movie_id == movie_id)
    result_media = await db.execute(query_media)
    media = result_media.scalar()

    #transforma o modelo sqlalchemy num dicionario e injeta a media
    movie_data = {column.name: getattr(movie, column.name) for column in movie.__table__.columns}
    
    #arredonda pra uma casa decimal
    movie_data["media_avaliacoes"] = round(media, 1) if media else None

    return movie_data
