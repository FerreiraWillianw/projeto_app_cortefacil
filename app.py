import os
import psycopg2 
import random 
from datetime import datetime, timedelta 
from flask import Flask, jsonify, request
from flask_cors import CORS 
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash

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
codigos_recuperacao = {}

# 2. Função de E-mail
def enviar_email_codigo(destinatario, codigo, motivo="cadastro"):
    mensagem = MIMEMultipart()
    mensagem['From'] = email_sistema
    mensagem['To'] = destinatario

    # Escolhemos o Assunto e o Texto baseados no motivo
    if motivo == "cadastro":
        mensagem['Subject'] = "Seu código de verificação - CorteFácil"
        corpo_email = f"""
            Olá!
                
            Você solicitou a criação de uma conta no CorteFácil.
            Seu código de verificação é: {codigo}
                
            Este código é válido por apenas 2 minutos.
                
            Se não solicitou este código, ignore este e-mail.
        """
    elif motivo == "recuperacao":
        mensagem['Subject'] = "Recuperação de Senha - CorteFácil"
        corpo_email = f"""
            Olá!
                
            Você solicitou a recuperação da sua senha no CorteFácil.
            Seu código de segurança para redefinir a senha é: {codigo}
                
            Se você não solicitou esta alteração, por favor ignore este e-mail. Ninguém pode acessar sua conta sem este código.
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
# ROTA: LOGIN
# ==============================================================
@app.route('/login', methods=['POST'])
def fazer_login():
    dados = request.get_json()
    email_digitado = dados.get('email')
    senha_digitada = dados.get('password')

    try:
        conexao = psycopg2.connect(db_url)
        cursor = conexao.cursor()

        # 1. Buscamos do banco se existe algum barbeiro com este e-mail
        # Pedimos para trazer o ID, o NOME e a SENHA (que está em hash)
        comando_sql = """
            SELECT
                id, nome, senha
            FROM
                barbeiros
            WHERE
                email = %s;
        """

        cursor.execute(comando_sql, (email_digitado,))

        # O fetchone() pega o primeiro resultado que encontrar.
        usuario = cursor.fetchone()

        cursor.close()
        conexao.close()

        # 2. Se o usuário for "None" (não encontrou nada no banco)
        # Ele retorna uma "Tupla" (uma lista fixa) parecida com isso: (1, 'William', 'pbkdf2:sha256...')
        if not usuario:
            return jsonify({"sucesso": False, "mensagem": "E-mail ou senha incorretos"}), 401

        # 3. Separamos os dados da Tupla nas suas respectivas variáveis
        id_banco = usuario[0]
        nome_banco = usuario[1]
        senha_hash_banco = usuario[2]

        # 4. Verificação da senha
        if check_password_hash(senha_hash_banco, senha_digitada):
            return jsonify({
                "sucesso": True,
                "mensagem": f"Bem-vindo, {nome_banco}!",
                "usuario": {
                    "id": id_banco,
                    "nome": nome_banco
                }
            }), 200
        else:
            return jsonify({
                "sucesso": False,
                "mensagem": "E-mail ou senha incorretos."
            }), 401

    except Exception as erro:
        print("ERRO NO LOGIN:", erro)
        return jsonify({"sucesso": False, "mensagem": "Erro interno no servidor!"}), 500


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

    senha_criptografada = generate_password_hash(senha)

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
        cursor.execute(comando_sql, (nome, email_usuario, telefone, senha_criptografada))
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

# ==============================================================
# ROTA 4: SOLICITAR RECUPERAÇÃO DE SENHA
# ==============================================================
@app.route('/solicitar-recuperacao', methods=['POST'])
def solicitar_recuperacao():
    dados = request.get_json()
    email_digitado = dados.get('email')

    try:
        conexao = psycopg2.connect(db_url)
        cursor = conexao.cursor()

        # 1. Verifica se o e-mail existe no banco de dados
        comando_sql = "SELECT id, nome FROM barbeiros WHERE email = %s;"
        cursor.execute(comando_sql, (email_digitado,))
        usuario = cursor.fetchone()

        cursor.close()
        conexao.close()

        # 2. Se não existir, retornamos um erro, mas de forma genérica por segurança
        if not usuario:
            return jsonify({"sucesso": False, "mensagem": "Se este e-mail estiver registrado, receberá um código em breve."}), 200

        # 3. Se existir, geramos um código de 6 dígitos
        nome_barbeiro = usuario[1]
        codigo_gerado = str(random.randint(100000, 999999))

        # Guardamos o código na memória do Python, associado a este e-mail
        codigos_recuperacao[email_digitado] = codigo_gerado

        # 4. Lógica de envio de e-mail
        sucesso_email = enviar_email_codigo(email_digitado, codigo_gerado, motivo="recuperacao")

        if sucesso_email:
            return jsonify({"sucesso": True, "mensagem": "Código enviado com sucesso! Verifique o seu e-mail."}), 200
        else:
            # Se a internet cair e o e-mail não for, apagamos o código da memória
            # para não haver código fantasmas, e avisamos o utilizados
            del codigos_recuperacao[email_digitado]
            return jsonify({"sucesso": False, "mensagem": "Erro ao tentar enviar o e-mail. Tente novamente mais tarde."}), 500

    except Exception as erro:
        print("ERRO NA RECUPERAÇÃO:", erro)
        return jsonify({"sucesso": False, "mensagem": "Erro interno no servidor."}), 500

# ==============================================================
# ROTA 5: REDEFINIR A SENHA (ATUALIZAR O BANCO)
# ==============================================================
@app.route('/redefinir-senha', methods=['POST'])
def redefinir_senha():
    dados = request.get_json()
    email_digitado = dados.get('email')
    codigo_digitado = dados.get('codigo')
    nova_senha = dados.get('nova_senha')

    try:
        # 1. Verifica se o código bate com o que es´ta guardado na memória
        codigo_real = codigos_recuperacao.get(email_digitado)

        if not codigo_real or codigo_real != codigo_digitado:
            return jsonify({"sucesso": False, "mensagem": "Código inválido ou expirado."}), 400

        # 2. Se o código estiver certo, fazemos o Hash (criptografia) da nova senha
        senha_criptografada = generate_password_hash(nova_senha)

        # 3. Atualizamos a senha do barbeiro no banco de dados
        conexao = psycopg2.connect(db_url)
        cursor = conexao.cursor()

        comando_sql = "UPDATE barbeiros SET senha = %s WHERE email = %s;"
        cursor.execute(comando_sql, (senha_criptografada, email_digitado))
        conexao.commit()

        cursor.close()
        conexao.close()

        # 4. Removemos o código da memória (para não ser usado duas vezes por hackers)
        del codigos_recuperacao[email_digitado]

        return jsonify({"sucesso": True, "mensagem": "Senha alterada com sucesso! Agora pode fazer o login."}), 200
    
    except Exception as erro:
        print("ERRO AO REDEFINIR A SENHA:", erro)
        return jsonify({"sucesso": False, "mensagem": "Erro interno no servidor."}), 500

# ==============================================================
# ROTA 6: LISTAR BARBEIROS (PARA A PÁGINA DO CLIENTE)
# ==============================================================
@app.route('/api/barbeiros', methods=['GET'])
def listar_barbeiros():
    try:
        conexao = psycopg2.connect(db_url)
        cursor = conexao.cursor()

        # Buscamos apenas o ID e o Nome de todos os barbeiros
        comando_sql = "SELECT id, nome FROM barbeiros ORDER BY nome ASC;"
        cursor.execute(comando_sql)
        barbeiros_banco = cursor.fetchall()

        cursor.close()
        conexao.close()

        # Transformamos o resultado numa lista de dicionários para o Javascript entender
        lista_barbeiros = []
        for barbeiro in barbeiros_banco:
            lista_barbeiros.append({
                "id": barbeiro[0],
                "nome": barbeiro[1]
            })

        return jsonify({"sucesso": True, "barbeiros": lista_barbeiros}), 200

    except Exception as erro:
        print("ERRO AO BUSCAR BARBEIROS:", erro)
        return jsonify({"sucesso": False, "mensagem": "Erro interno no servidor."}), 500

# ==============================================================
# ROTA 7: BUSCAR DISPONIBILIDADE DO BARBEIRO
# ==============================================================
@app.route('/api/barbeiros/<int:barbeiro_id>/disponibilidade', methods=["GET"])
def buscar_disponibilidade(barbeiro_id):
    try:
        conexao = psycopg2.connect(db_url)
        cursor = conexao.cursor()

        comando_sql = """
            SELECT dia_semana, hora_inicio, hora_fim
            FROM disponibilidade_barbeiro
            WHERE barbeiro_id = %s
            ORDER BY dia_semana ASC;
        """

        cursor.execute(comando_sql, (barbeiro_id,))
        registros = cursor.fetchall()

        cursor.close()
        conexao.close()

        # Monta a lista com os dias e jornadas cadastradas
        dias_permitidos = []
        for reg in registros:
            dias_permitidos.append({
                "dia_semana": reg[0],
                "hora_inicio": str(reg[1]),
                "hora_fim": str(reg[2])
            })

        return jsonify({
            "sucesso": True, 
            "disponibilidade": dias_permitidos
        }), 200

    except Exception as erro:
        print("ERRO AO BUSCAR DISPONIBILIDADE:", erro)
        return jsonify({"sucesso": False, "mensagem": "Erro interno no servidor."}), 500

# ==============================================================
# ROTA 8: BUSCAR HORÁRIOS DISPONÍVEIS NO DIA
# ==============================================================
@app.route('/api/barbeiros/<int:barbeiro_id>/horarios', methods=['GET'])
def buscar_horarios(barbeiro_id):
    # O JavaScript vai enviar a data no final do link, ex: ?data=2026-10-13
    data_str = request.args.get('data') 

    if not data_str:
        return jsonify({"sucesso": False, "mensagem": "Data não informada."}), 400

    try:
        # 1. Converter a data de texto para um objeto que o Python entende
        data_obj = datetime.strptime(data_str, '%Y-%m-%d')
        
        # TRUQUE: O Python diz que Segunda é 0 e Domingo é 6. 
        # Nós usamos esta matemática para converter para o padrão do JS (Domingo = 0)
        dia_semana = (data_obj.weekday() + 1) % 7 

        conexao = psycopg2.connect(db_url)
        cursor = conexao.cursor()

        # 2. Buscar o horário de expediente do barbeiro neste dia
        cursor.execute("""
            SELECT hora_inicio, hora_fim
            FROM disponibilidade_barbeiro
            WHERE barbeiro_id = %s AND dia_semana = %s
        """, (barbeiro_id, dia_semana))
        expediente = cursor.fetchone()

        # Se não houver expediente, devolvemos a lista vazia
        if not expediente:
            cursor.close()
            conexao.close()
            return jsonify({"sucesso": True, "horarios": []}), 200

        hora_inicio_banco = expediente[0] # Ex: 08:00:00
        hora_fim_banco = expediente[1]    # Ex: 19:00:00

        # 3. Buscar os horários que JÁ ESTÃO OCUPADOS na tabela de agendamentos
        cursor.execute("""
            SELECT hora_agendamento
            FROM agendamentos
            WHERE barbeiro_id = %s AND data_agendamento = %s AND status != 'cancelado'
        """, (barbeiro_id, data_str))
        ocupados_banco = cursor.fetchall()

        cursor.close()
        conexao.close()

        # Pegamos os resultados do banco e formatamos para texto "HH:MM" (Ex: "14:30")
        horarios_ocupados = []
        for ocupado in ocupados_banco:
            hora_formatada = ocupado[0].strftime('%H:%M')
            horarios_ocupados.append(hora_formatada)

        # 4. A FÁBRICA DE HORÁRIOS (De 30 em 30 minutos)
        horarios_livres = []

        # Juntamos a data com a hora para o Python conseguir fazer as contas de tempo
        hora_atual = datetime.combine(data_obj, hora_inicio_banco)
        hora_final = datetime.combine(data_obj, hora_fim_banco)

        # Enquanto a hora atual for menor que a hora de saída...
        while hora_atual < hora_final:
            hora_texto = hora_atual.strftime('%H:%M')

            # Se este horário NÃO estiver na lista de ocupados, adicionamos aos livres!
            if hora_texto not in horarios_ocupados:
                horarios_livres.append(hora_texto)

            # Dá um salto de 30 minutos para testar o próximo horário
            hora_atual += timedelta(minutes=30)

        return jsonify({"sucesso": True, "horarios": horarios_livres}), 200

    except Exception as erro:
        print("ERRO AO GERAR HORÁRIOS:", erro)
        return jsonify({"sucesso": False, "mensagem": "Erro interno no servidor."}), 500


# ==============================================================
# ROTA 9: SALVAR O AGENDAMENTO NO BANCO DE DADOS
# ==============================================================
@app.route('/api/agendar', methods=['POST'])
def criar_agendamento():
    # Recebemos os dados enviados pelo JavaScript
    dados = request.get_json()

    nome = dados.get('nome')
    telefone = dados.get('telefone')
    barbeiro_id = dados.get('barbeiro_id')
    data_agendamento = dados.get('data')
    hora_agendamento = dados.get('hora')

    # 1. Validação básica: garantir que nada chegou vazio
    if not all([nome, telefone, barbeiro_id, data_agendamento, hora_agendamento]):
        return jsonify({"sucesso": False, "mensagem": "Por favor, preencha todos os campos."}), 400

    try:
        conexao = psycopg2.connect(db_url)
        cursor = conexao.cursor()
        
        # 2. Comando SQL para Inserir (Gravar) os dados na tabela agendamentos
        # O status e o criado_em são gerados automaticamente pelo banco!
        comando_sql = """
            INSERT INTO agendamentos (barbeiro_id, nome_cliente, telefone_cliente, data_agendamento, hora_agendamento)
            VALUES (%s, %s, %s, %s, %s)
        """

        # Executamos o comando substituindo os %s pelos dados reais
        cursor.execute(comando_sql, (barbeiro_id, nome, telefone, data_agendamento, hora_agendamento))
        conexao.commit() # O commit é o que realmente "salva" a alteração no banco
        
        cursor.close()
        conexao.close()

        return jsonify({"sucesso": True, "mensagem": "Agendamento realizado com sucesso! Esperamos por você."}), 201
        
    except Exception as erro:
        print("ERRO AO SALVAR AGENDAMENTO:", erro)
        return jsonify({"sucesso": False, "mensagem": "Erro interno ao tentar salvar o agendamento."}), 500

    
# ==============================================================
# ROTA 10: LISTAR AGENDAMENTOS DO BARBEIRO (COM FILTROS)
# ==============================================================
@app.route('/api/barbeiros/<int:barbeiro_id>/agendamentos', methods=['GET'])
def listar_agendamentos_barbeiro(barbeiro_id):
    # Lemos os filtros enviados pela URL pelo JavaScript
    filtro_data = request.args.get('data') 
    filtro_status = request.args.get('status')

    try:
        conexao = psycopg2.connect(db_url)
        cursor = conexao.cursor()

        # Começamos a montar o comando SQL e a lista de valores
        comando_sql = """
            SELECT id, nome_cliente, telefone_cliente, data_agendamento, hora_agendamento, status
            FROM agendamentos
            WHERE barbeiro_id = %s
        """
        valores = [barbeiro_id]

        # 1. Aplicar filtro de DATA
        if filtro_data:
            comando_sql += " AND data_agendamento = %s"
            valores.append(filtro_data)
        else:
            # Se não enviar data, por padrão busca de hoje para a frente
            comando_sql += " AND data_agendamento >= CURRENT_DATE"

        # 2. Aplicar filtro de STATUS
        if filtro_status and filtro_status != 'todos':
            comando_sql += " AND status = %s"
            valores.append(filtro_status)
        else:
            # Se for 'todos', trazemos pendentes e concluídos (ocultamos cancelados por padrão)
            comando_sql += " AND status != 'cancelado'"

        # Finaliza o comando com a ordenação
        comando_sql += " ORDER BY data_agendamento ASC, hora_agendamento ASC;"

        # Executamos usando a lista de valores (transformada em tupla)
        cursor.execute(comando_sql, tuple(valores))
        registros = cursor.fetchall()
        
        cursor.close()
        conexao.close()

        agendamentos = []
        if registros:
            for reg in registros:
                agendamentos.append({
                    "id": reg[0],
                    "nome": reg[1],
                    "telefone": reg[2],
                    "data": str(reg[3]),
                    "hora": str(reg[4]),
                    "status": reg[5]
                })

        return jsonify({"sucesso": True, "agendamentos": agendamentos}), 200

    except Exception as erro:
        print(f"ERRO AO LISTAR AGENDAMENTOS: {erro}")
        return jsonify({"sucesso": False, "mensagem": "Erro interno no servidor."}), 500

# ==============================================================
# ROTA 11: ATUALIZAR STATUS DO AGENDAMENTO (Ex: Concluir)
# ==============================================================
@app.route('/api/agendamentos/<int:agendamento_id>/status', methods=['PATCH'])
def atualizar_status_agendamento(agendamento_id):
    dados = request.get_json()
    novo_status = dados.get('status') # O JavaScript vai enviar 'concluido' ou 'cancelado'

    try:
        conexao = psycopg2.connect(db_url)
        cursor = conexao.cursor()

        # Atualiza apenas a coluna status do agendamento específico
        cursor.execute("""
            UPDATE agendamentos 
            SET status = %s 
            WHERE id = %s
        """, (novo_status, agendamento_id))

        conexao.commit() # Salva a alteração
        cursor.close()
        conexao.close()

        return jsonify({"sucesso": True, "mensagem": "Status atualizado com sucesso!"}), 200

    except Exception as erro:
        print("ERRO AO ATUALIZAR STATUS:", erro)
        return jsonify({"sucesso": False, "mensagem": "Erro ao atualizar status."}), 500


# ==============================================================
# ROTA 12: EXCLUIR AGENDAMENTO
# ==============================================================
@app.route('/api/agendamentos/<int:agendamento_id>', methods=['DELETE'])
def excluir_agendamento(agendamento_id):
    try:
        conexao = psycopg2.connect(db_url)
        cursor = conexao.cursor()

        # Apaga a linha inteira da tabela de agendamentos
        cursor.execute("DELETE FROM agendamentos WHERE id = %s", (agendamento_id,))

        conexao.commit() # Salva a alteração
        cursor.close()
        conexao.close()

        return jsonify({"sucesso": True, "mensagem": "Agendamento excluído com sucesso!"}), 200

    except Exception as erro:
        print("ERRO AO EXCLUIR AGENDAMENTO:", erro)
        return jsonify({"sucesso": False, "mensagem": "Erro ao excluir agendamento."}), 500

# ==============================================================
# ROTA: ATUALIZAR APENAS A DISPONIBILIDADE DO BARBEIRO
# ==============================================================
@app.route('/api/barbeiros/<int:barbeiro_id>/perfil', methods=['PUT'])
def atualizar_perfil(barbeiro_id):
    # 1. Recebemos apenas a disponibilidade do JavaScript
    dados = request.get_json()
    nova_disponibilidade = dados.get('disponibilidade', [])

    try:
        conexao = psycopg2.connect(db_url)
        cursor = conexao.cursor()

        # 2. Limpar a agenda antiga
        # Removemos todos os horários deste barbeiro para podermos inserir a nova configuração limpa
        comando_delete = "DELETE FROM disponibilidade_barbeiro WHERE barbeiro_id = %s"
        cursor.execute(comando_delete, (barbeiro_id,))

        # 3. Inserir a nova disponibilidade
        if nova_disponibilidade:
            comando_insert = """
                INSERT INTO disponibilidade_barbeiro (barbeiro_id, dia_semana, hora_inicio, hora_fim)
                VALUES (%s, %s, %s, %s)
            """
            for disp in nova_disponibilidade:
                cursor.execute(comando_insert, (
                    barbeiro_id, 
                    int(disp['dia_semana']), # Forçamos para Inteiro, respeitando a sua tabela!
                    disp['hora_inicio'], 
                    disp['hora_fim']
                ))

        # 4. Guardamos as alterações
        conexao.commit()
        
        cursor.close()
        conexao.close()

        return jsonify({"sucesso": True, "mensagem": "Horários guardados com sucesso!"}), 200

    except Exception as erro:
        print(f"ERRO AO ATUALIZAR HORÁRIOS: {erro}")
        return jsonify({"sucesso": False, "mensagem": "Erro interno no servidor ao tentar guardar."}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)