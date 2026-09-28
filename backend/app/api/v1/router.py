from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import Optional
from math import ceil
import uuid
from sqlalchemy import insert

from app.db.session import get_db
from app.movies.models import DimMovie, MovieReview, FactMoviePerformance, DimGenre, DimCompany, bridge_movie_company, bridge_movie_person, DimPerson, bridge_movie_genre
from app.movies.schemas import MovieResponse, PaginatedMovieResponse, MovieDetailResponse, ReviewCreate, Review, MovieCreate

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

@api_router.get("/movies/{sk_movie_id}", response_model=MovieDetailResponse, tags=["Movies"])
async def get_movie_detail(
    sk_movie_id: str, 
    db: AsyncSession = Depends(get_db)
):
    # 1. Busca o filme principal e métricas
    stmt = (
        select(
            DimMovie,
            func.coalesce(func.avg(MovieReview.nota), 0.0).label("media_avaliacoes"),
            FactMoviePerformance.orcamento_usd,
            FactMoviePerformance.receita_usd,
            FactMoviePerformance.lucro_usd
        )
        .outerjoin(MovieReview, DimMovie.sk_movie_id == MovieReview.sk_movie_id)
        .outerjoin(FactMoviePerformance, DimMovie.sk_movie_id == FactMoviePerformance.sk_movie_id)
        .where(DimMovie.sk_movie_id == sk_movie_id)
        .group_by(
            DimMovie.sk_movie_id, 
            FactMoviePerformance.orcamento_usd, 
            FactMoviePerformance.receita_usd, 
            FactMoviePerformance.lucro_usd
        )
    )
    
    result = await db.execute(stmt)
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Filme não encontrado")
        
    movie, media, orcamento, receita, lucro = row
    movie_data = {column.name: getattr(movie, column.name) for column in movie.__table__.columns}
    
    media_val = round(media, 1) if media else None
    movie_data["media_avaliacoes"] = media_val
    movie_data["nota_estrelas"] = round((media_val / 2.0) * 2) / 2 if media_val else 0.0
    movie_data["orcamento_usd"] = orcamento
    movie_data["receita_usd"] = receita
    movie_data["lucro_usd"] = lucro

    # 2. Gêneros (usando .c. para acessar as colunas da tabela Core)
    genres_res = await db.execute(
        select(DimGenre.nome_genero)
        .select_from(bridge_movie_genre)
        .join(DimGenre, bridge_movie_genre.c.sk_genre_id == DimGenre.sk_genre_id)
        .where(bridge_movie_genre.c.sk_movie_id == sk_movie_id)
    )
    movie_data["generos"] = [g[0] for g in genres_res.all()]

    # 3. Pessoas (Elenco e Diretores)
    people_res = await db.execute(
        select(DimPerson.nome_pessoa, DimPerson.tipo_pessoa)
        .select_from(bridge_movie_person)
        .join(DimPerson, bridge_movie_person.c.sk_person_id == DimPerson.sk_person_id)
        .where(bridge_movie_person.c.sk_movie_id == sk_movie_id)
    )
    
    elenco, diretores = [], []
    for nome, tipo in people_res.all():
        if tipo == 'Ator':
            elenco.append(nome)
        elif tipo == 'Diretor':
            diretores.append(nome)
            
    movie_data["elenco"] = elenco[:10]
    movie_data["diretores"] = diretores

    # 4. Produtoras
    comp_res = await db.execute(
        select(DimCompany.nome_produtora)
        .select_from(bridge_movie_company)
        .join(DimCompany, bridge_movie_company.c.sk_company_id == DimCompany.sk_company_id)
        .where(bridge_movie_company.c.sk_movie_id == sk_movie_id)
    )
    movie_data["produtoras"] = [c[0] for c in comp_res.all()]

    #busca de reviews pela mais recente
    stmt_reviews = (
        select(MovieReview.nome, MovieReview.nota, MovieReview.comentario)
        .where(MovieReview.sk_movie_id == sk_movie_id)
        .order_by(MovieReview.created_at.desc())
    )
    reviews_res = await db.execute(stmt_reviews)
    
    movie_data["reviews"] = [
        {"nome": r.nome, "nota": r.nota, "comentario": r.comentario} 
        for r in reviews_res.all()
    ]
    
    return MovieDetailResponse(**movie_data)


@api_router.post("/movies/{sk_movie_id}/reviews", response_model=Review, tags=["Movies"])
async def create_movie_review(
    sk_movie_id: str,
    review_in: ReviewCreate,
    db: AsyncSession = Depends(get_db)
):
    # Verifica se o filme existe
    movie_res = await db.execute(select(DimMovie).where(DimMovie.sk_movie_id == sk_movie_id))
    if not movie_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Filme não encontrado")
    
    new_review = MovieReview(
        sk_movie_id=sk_movie_id,
        nome=review_in.nome,
        nota=review_in.nota,
        comentario=review_in.comentario
    )
    db.add(new_review)
    await db.commit()
    await db.refresh(new_review)
    
    return Review(nome=new_review.nome, nota=new_review.nota, comentario=new_review.comentario)

@api_router.post("/movies", response_model=MovieResponse, status_code=201, tags=["Movies"])
async def create_movie(
    movie_in: MovieCreate,
    db: AsyncSession = Depends(get_db)
):
    # 1. Criar o registro principal do filme
    new_movie = DimMovie(
        id_filme=f"user_{uuid.uuid4().hex[:8]}", # Gera um ID único exigido pelo modelo
        titulo=movie_in.titulo,
        ano_lancamento=movie_in.ano_lancamento,
        sinopse=movie_in.sinopse,
        url_poster=movie_in.url_poster
    )
    
    db.add(new_movie)
    await db.flush() #salvamento previo para gerar o sk_movie_id

    # 2. Processar Gêneros e ligar na Bridge
    for nome_genero in movie_in.generos:
        # Busca se o gênero já existe para não duplicar
        gen_res = await db.execute(select(DimGenre).where(DimGenre.nome_genero == nome_genero))
        genre = gen_res.scalar_one_or_none()
        
        if not genre:
            genre = DimGenre(nome_genero=nome_genero)
            db.add(genre)
            await db.flush()
            
        await db.execute(
            insert(bridge_movie_genre).values(sk_movie_id=new_movie.sk_movie_id, sk_genre_id=genre.sk_genre_id)
        )

    # 3. Processar Diretores e ligar na Bridge
    for nome_diretor in movie_in.diretores:
        dir_res = await db.execute(
            select(DimPerson).where(DimPerson.nome_pessoa == nome_diretor, DimPerson.tipo_pessoa == 'Diretor')
        )
        diretor = dir_res.scalar_one_or_none()
        
        if not diretor:
            diretor = DimPerson(nome_pessoa=nome_diretor, tipo_pessoa='Diretor')
            db.add(diretor)
            await db.flush()
            
        await db.execute(
            insert(bridge_movie_person).values(sk_movie_id=new_movie.sk_movie_id, sk_person_id=diretor.sk_person_id)
        )

    for nome_ator in movie_in.elenco:
        ator_res = await db.execute(
            select(DimPerson).where(DimPerson.nome_pessoa == nome_ator, DimPerson.tipo_pessoa == 'Ator')
        )
        ator = ator_res.scalar_one_or_none()
        
        if not ator:
            ator = DimPerson(nome_pessoa=nome_ator, tipo_pessoa='Ator')
            db.add(ator)
            await db.flush()
            
        await db.execute(
            insert(bridge_movie_person).values(sk_movie_id=new_movie.sk_movie_id, sk_person_id=ator.sk_person_id)
        )
        
    await db.commit()
    
    return MovieResponse(
        sk_movie_id=new_movie.sk_movie_id,
        titulo=new_movie.titulo,
        ano_lancamento=new_movie.ano_lancamento,
        url_poster=new_movie.url_poster
    )