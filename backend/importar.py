import sqlite3
import csv

#este arquivo carrega apenas a tabela bridge_movies_person pois é a de maior tamanho de arquivos. carregar pelo Database Client não é viável pela quantidade 
#massiva de dados presentes na tabela

# Caminhos exatos baseados na sua estrutura de pastas
caminho_csv = r"C:\CAIO_PESSOAL\ROCKET LAB\dev\atividade\bases_atv_dev_2\bridge_movie_person.csv"
caminho_db = "rocketlab.db"

print("A iniciar a importação em lote...")

conexao = sqlite3.connect(caminho_db)
cursor = conexao.cursor()

# Limpar a tabela caso a extensão tenha inserido dados pela metade
cursor.execute("DELETE FROM bridge_movie_person;")

with open(caminho_csv, 'r', encoding='utf-8') as ficheiro:
    leitor = csv.reader(ficheiro)
    colunas = next(leitor)  # Captura o cabeçalho
    
    # Prepara a instrução SQL dinâmica com base no número de colunas
    placeholders = ",".join(["?"] * len(colunas))
    sql = f"INSERT INTO bridge_movie_person ({','.join(colunas)}) VALUES ({placeholders})"
    
    # Executa a inserção de todas as linhas de uma só vez
    cursor.executemany(sql, leitor)

conexao.commit()
conexao.close()

print("Importação concluída com sucesso em poucos segundos!")