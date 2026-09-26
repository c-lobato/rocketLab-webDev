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

    #constrói a query com paginação (offset e limit)
    query = select(DimMovie).offset(skip).limit(limit)

    if titulo:
        query = query.where(DimMovie.titulo.icontains(titulo))
    
    #executa a query de forma assíncrona
    result = await db.execute(query)
    movies = result.scalars().all()   #retorna a lista de todos os registros
    
    return movies

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
