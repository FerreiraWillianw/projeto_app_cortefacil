import os
import psycopg2 
import random 
from datetime import datetime, timedelta 
from flask import Flask, jsonify, request
from flask_cors import CORS 
from dotenv import load_dotenv

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# 1. Carregar configurações
load_dotenv()
db_url = os.getenv("CONNECTION_STRING")
email_sistema = os.getenv("EMAIL_SISTEMA")
senha_sistema = os.getenv("SENHA_SISTEMA")

if not db_url or not email_sistema or not senha_sistema:
    raise ValueError("Faltam variáveis no arquivo .env!")

app = Flask(__name__)
CORS(app)

cadastros_pendentes = {}

# 2. Função de E-mail
def enviar_email_codigo(destinatario, codigo):
    mensagem = MIMEMultipart()
    mensagem['From'] = email_sistema
    mensagem['To'] = destinatario
    mensagem['Subject'] = "Seu código de verificação - CorteFácil"

    corpo_email = f"""
    Olá!
    
    Você solicitou a criação de uma conta no CorteFácil.
    Seu código de verificação é: {codigo}
    
    Este código é válido por apenas 2 minutos.
    
    Se não solicitou este código, ignore este e-mail.
    """
    mensagem.attach(MIMEText(corpo_email, 'plain'))

    try:
        servidor = smtplib.SMTP('smtp.gmail.com', 587)
        servidor.starttls() 
        servidor.login(email_sistema, senha_sistema) 
        servidor.send_message(mensagem) 
        servidor.quit() 
        return True
    except Exception as e:
        print("Erro ao enviar e-mail:", e)
        return False

# ==============================================================
# ROTA 1: SOLICITAR O CÓDIGO
# ==============================================================
@app.route('/solicitar-codigo', methods=['POST'])
def solicitar_codigo():
    dados_recebidos = request.get_json()
    email_usuario = dados_recebidos.get('email')

    codigo_gerado = str(random.randint(100000, 999999))
    tempo_validade = datetime.now() + timedelta(minutes=2)

    # CORREÇÃO: Agora só guardamos o código e o tempo
    cadastros_pendentes[email_usuario] = {
        'codigo': codigo_gerado,
        'expira_em': tempo_validade
    }

    email_enviado = enviar_email_codigo(email_usuario, codigo_gerado)

    if email_enviado:
        return jsonify({"sucesso": True, "mensagem": "Código enviado! Verifique o seu e-mail."}), 200
    else:
        del cadastros_pendentes[email_usuario]
        return jsonify({"sucesso": False, "mensagem": "Erro ao tentar enviar o e-mail."}), 500

# ==============================================================
# ROTA 2: VALIDAR E GUARDAR NO BANCO (CORRIGIDA)
# ==============================================================
@app.route('/cadastro', methods=['POST'])
def fazer_cadastro():
    # CORREÇÃO: Pegamos TODOS os dados direto do Javascript aqui!
    dados = request.get_json()
    nome = dados.get('nome')
    email_usuario = dados.get('email')
    telefone = dados.get('telefone')
    senha = dados.get('password')
    codigo_digitado = dados.get('codigo')

    registro = cadastros_pendentes.get(email_usuario)

    # Validações do Código
    if not registro:
        return jsonify({"sucesso": False, "mensagem": "Código não solicitado ou e-mail incorreto."}), 400
    
    if datetime.now() > registro['expira_em']:
        del cadastros_pendentes[email_usuario] 
        return jsonify({"sucesso": False, "mensagem": "O código expirou! Solicite um novo."}), 400
    
    if codigo_digitado != registro['codigo']:
        return jsonify({"sucesso": False, "mensagem": "Código incorreto. Tente novamente."}), 400

    # Se o código estiver certo, salvamos no banco
    try:
        conexao = psycopg2.connect(db_url)
        cursor = conexao.cursor()

        comando_sql = """
            INSERT INTO barbeiros (nome, email, telefone, senha) 
            VALUES (%s, %s, %s, %s);
        """
        cursor.execute(comando_sql, (nome, email_usuario, telefone, senha))
        conexao.commit()
        
        cursor.close()
        conexao.close()
        
        del cadastros_pendentes[email_usuario]

        return jsonify({"sucesso": True, "mensagem": "E-mail validado e conta criada com sucesso!"}), 201

    except psycopg2.errors.UniqueViolation:
        del cadastros_pendentes[email_usuario]
        return jsonify({"sucesso": False, "mensagem": "Este e-mail já está cadastrado."}), 409
    
    except Exception as erro:
        # Adicionamos este print para ver no terminal exatamente o que deu errado
        print("ERRO TÉCNICO NO BANCO:", erro)
        return jsonify({"sucesso": False, "mensagem": "Erro no servidor", "erro": str(erro)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)