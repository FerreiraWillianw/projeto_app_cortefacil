from flask import Flask, jsonify
from supabase import create_client, Client

import os
from dotenv import load_dotenv

load_dotenv()

url_supabase: str = os.getenv("SUPABASE_URL")
chave_supabase: str = os.getenv("SUPABASE_KEY")

if not url_supabase or not chave_supabase:
    raise ValueError("Faltam as credenciais do Supabase no ficheiro do .env!")

supabase: Client = create_client(url_supabase, chave_supabase)

app = Flask(__name__)

@app.route('/')

def testar_conexao():
    try:
        resposta = supabase.table('barbeiros').select("*").execute()
        return jsonify({
            "mensagem": "Conexão com o banco de dados realizada com sucesso e com segurança!",
            "dados": resposta.data
        }), 200
    except Exception as erro:
        return jsonify({
            "mensagem": "Erro ao conectar com o banco de dados.",
            "erro": str(erro)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)