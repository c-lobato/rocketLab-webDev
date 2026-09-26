from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.movies.models import DimMovie
from app.movies.schemas import MovieResponse

 
api_router = APIRouter()

#listagem dos filmes
@api_router.get("/movies", response_model=list[MovieResponse], tags=["Movies"])
async def list_movies(skip: int = 0, limit: int = 20, db: AsyncSession = Depends(get_db)):
    """
    Retorna uma lista paginada de filmes do catálogo.
    """
    #constrói a query com paginação (offset e limit)
    query = select(DimMovie).offset(skip).limit(limit)
    
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

    return movie
