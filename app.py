# ==============================================================
# 1. IMPORTAÇÃO DE FERRAMENTAS
# ==============================================================
import os
import psycopg2 
from flask import Flask, jsonify, request
from flask_cors import CORS 
from dotenv import load_dotenv

# ==============================================================
# 2. CONFIGURAÇÕES INICIAIS
# ==============================================================
# Lê o nosso arquivo .env para pegar a senha com segurança
load_dotenv()
db_url = os.getenv("CONNECTION_STRING")

# Iniciamos o servidor e ligamos o CORS para permitir que 
# o Live Server (porta 5500) converse com o Python (porta 5000)
app = Flask(__name__)
CORS(app)

# ==============================================================
# 3. A NOSSA ÚNICA ROTA: CADASTRO
# ==============================================================
@app.route('/cadastro', methods=['POST'])
def fazer_cadastro():
    
    # Passo 1: Pegar os dados que vão chegar do HTML
    dados = request.get_json()
    nome = dados.get('nome')
    email = dados.get('email')
    telefone = dados.get('telefone')
    senha = dados.get('password')

    try:
        # Passo 2: Conectar ao banco de dados PostgreSQL
        conexao = psycopg2.connect(db_url)
        cursor = conexao.cursor()

        # Passo 3: Escrever o SQL
        # Usamos %s porque é a regra exigida pela biblioteca psycopg2 
        # para evitar que códigos maliciosos entrem no banco.
        comando_sql = """
            INSERT INTO barbeiros (nome, email, telefone, senha) 
            VALUES (%s, %s, %s, %s);
        """

        # Passo 4: Executar o SQL
        # Passamos as nossas 4 variáveis na exata ordem dos 4 '%s' acima
        cursor.execute(comando_sql, (nome, email, telefone, senha))
        
        # O commit é obrigatório para SALVAR de verdade no banco
        conexao.commit()

        # Passo 5: Fechar a conexão e avisar que deu certo
        cursor.close()
        conexao.close()

        return jsonify({
            "sucesso": True, 
            "mensagem": "Usuário cadastrado com sucesso!"
        }), 201

    except Exception as erro:
        # Se algo der errado (ex: faltou internet, email repetido), o Python avisa
        return jsonify({
            "sucesso": False, 
            "mensagem": "Erro ao cadastrar", 
            "erro_tecnico": str(erro)
        }), 500

# ==============================================================
# 4. LIGAR O SERVIDOR
# ==============================================================
if __name__ == '__main__':
    app.run(debug=True, port=5000)