from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.movies.models import DimMovie

#router dos filmes 
api_router = APIRouter()

@api_router.get("/movies", tags=["Movies"])
async def list_movies(skip: int = 0, limit: int = 20, db: AsyncSession = Depends(get_db)):
    """
    Retorna uma lista paginada de filmes do catálogo.
    """
    #constrói a query com paginação (offset e limit)
    query = select(DimMovie).offset(skip).limit(limit)
    
    #executa a query de forma assíncrona
    result = await db.execute(query)
    movies = result.scalars().all()
    
    return movies



