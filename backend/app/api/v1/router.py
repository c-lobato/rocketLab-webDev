from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import Optional
from math import ceil

from app.db.session import get_db
from app.movies.models import DimMovie, MovieReview
from app.movies.schemas import MovieResponse, PaginatedMovieResponse

api_router = APIRouter()

#listagem dos filmes
@api_router.get("/movies", response_model=PaginatedMovieResponse, tags=["Movies"])
async def list_movies(
    page: int = 1, 
    titulo: Optional[str] = None, 
    db: AsyncSession = Depends(get_db)
):
    limit = 40
    skip = (page - 1) * limit

    # 1. Query para contar o total de filmes (necessário para o frontend saber o total de páginas)
    count_stmt = select(func.count()).select_from(DimMovie)
    if titulo:
        count_stmt = count_stmt.where(DimMovie.titulo.icontains(titulo))
    
    total_items = await db.scalar(count_stmt)
    total_pages = ceil(total_items / limit) if total_items else 1

    # 2. Query principal com a nova ordenação cronológica e chave de desempate
    stmt = (
        select(
            DimMovie,
            func.coalesce(func.avg(MovieReview.nota), 0.0).label("media_avaliacoes")
        )
        .outerjoin(MovieReview, DimMovie.sk_movie_id == MovieReview.sk_movie_id)
        .group_by(DimMovie.sk_movie_id)
        .order_by(
            DimMovie.ano_lancamento.desc().nulls_last(), # Lançamentos mais recentes primeiro
            DimMovie.sk_movie_id.asc()                   # Desempate determinístico (evita filmes repetidos na paginação)
        )
        .offset(skip)
        .limit(limit)
    )

    if titulo:
        stmt = stmt.where(DimMovie.titulo.icontains(titulo))
    
    result = await db.execute(stmt)
    rows = result.all()
    
    movies_list = []
    for movie, media in rows:
        # Transforma os dados em dicionário
        movie_data = {column.name: getattr(movie, column.name) for column in movie.__table__.columns}
        
        media_val = round(media, 1) if media else None
        movie_data["media_avaliacoes"] = media_val
        
        # Calcula as estrelas (0-5)
        if media_val:
            movie_data["nota_estrelas"] = round((media_val / 2.0) * 2) / 2
        else:
            movie_data["nota_estrelas"] = 0.0
            
        movies_list.append(MovieResponse(**movie_data))
    
    # Retorna o envelope com os metadados da paginação
    return {
        "total_items": total_items,
        "total_pages": total_pages,
        "current_page": page,
        "items": movies_list
    }

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

@api_router.get("/movies/{sk_movie_id}", response_model=MovieResponse, tags=["Movies"])
async def get_movie_detail(
    sk_movie_id: str, 
    db: AsyncSession = Depends(get_db)
):
    # Query para buscar um filme específico pelo seu ID substituto (sk_movie_id)
    stmt = (
        select(
            DimMovie,
            func.coalesce(func.avg(MovieReview.nota), 0.0).label("media_avaliacoes")
        )
        .outerjoin(MovieReview, DimMovie.sk_movie_id == MovieReview.sk_movie_id)
        .where(DimMovie.sk_movie_id == sk_movie_id)
        .group_by(DimMovie.sk_movie_id)
    )
    
    result = await db.execute(stmt)
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Filme não encontrado")
        
    movie, media = row
    
    # Transforma os dados do modelo SQLAlchemy num dicionário
    movie_data = {column.name: getattr(movie, column.name) for column in movie.__table__.columns}
    
    media_val = round(media, 1) if media else None
    movie_data["media_avaliacoes"] = media_val
    
    # Converte a média para o sistema de 0 a 5 estrelas
    if media_val:
        movie_data["nota_estrelas"] = round((media_val / 2.0) * 2) / 2
    else:
        movie_data["nota_estrelas"] = 0.0
        
    return MovieResponse(**movie_data)