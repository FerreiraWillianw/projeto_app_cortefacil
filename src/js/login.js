const formLogin = document.getElementById('form-login');
const BASE_URL = 'http://127.0.0.1:5000';

formLogin.addEventListener('submit', async function(evento) {
    evento.preventDefault();

    const emailDigitado = document.getElementById('email').value;
    const senhaDigitada = document.getElementById('senha').value;
    const btnEntrar = document.getElementById('btn-entrar');

    btnEntrar.textContent = 'Entrando...';
    btnEntrar.disabled = true;

    try {
        // Empacota os dados e envia para a rota /login

        const resposta = await fetch(BASE_URL + '/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: emailDigitado,
                password: senhaDigitada
            })
        });

        const dadosResposta = await resposta.json();

        if (dadosResposta.sucesso === true) {
            // NOVO: Guardamos os dados do barbeiro na memória do navegador (localStorage)
            // Usamos JSON.stringify para transformar o objeto em texto, pois o localStorage só aceita texto
            localStorage.setItem('barbeiro_logado', JSON.stringify(dadosResposta.usuario));
            alert("🎉 " + dadosResposta.mensagem);

            // Se deu tudo certo, redireciona o utilizador para a página principal!
            window.location.href = 'pagina_inicial.html';
        } else {
            // Mensagem genérica: "E-mail ou senha incorretos" por segurança
            alert('❌ ' + dadosResposta.mensagem);
            btnEntrar.textContent = 'Entrar';
            btnEntrar.disabled = false;
            document.getElementById('area-recuperar-senha').style.display = 'block';
        }
    } catch (erro) {
        console.error("Erro:", erro);
        alert("Erro ao conectar com o servidor.");
        btnEntrar.textContent = 'Entrar';
        btnEntrar.disabled = false;
    }
});

// ==========================================
// MOSTRAR / ESCONDER SENHA (Copiado do Cadastro)
// ==========================================
const botoesVerSenha = document.querySelectorAll('.toggle-senha');

botoesVerSenha.forEach(function(botao) {
    
    // O TRUQUE MÁGICO: Evita que o input perca o foco quando clicamos no ícone
    botao.addEventListener('mousedown', function(evento) {
        evento.preventDefault(); 
    });

    // A lógica de trocar o ícone e o tipo de texto
    botao.addEventListener('click', function() {
        const campoSenha = botao.previousElementSibling;

        if (campoSenha.type === 'password') {
            campoSenha.type = 'text';
            botao.classList.remove('ph-eye');
            botao.classList.add('ph-eye-closed');
        } else {
            campoSenha.type = 'password';
            botao.classList.remove('ph-eye-closed');
            botao.classList.add('ph-eye');
        }
    });
});


// ==========================================
// NAVEGAÇÃO: ESQUECI A SENHA
// ==========================================

const linkEsqueciSenha = document.getElementById('link-esqueci-senha');
const btnVoltarLogin = document.getElementById('btn-voltar-login');

const secaoRecuperarSenha = document.getElementById('secao-recuperar-senha');
const areaRecuperarLink = document.getElementById('area-recuperar-senha');

// Quando lica no link "Esqueceu a senha?"
linkEsqueciSenha.addEventListener('click', function(evento) {
    evento.preventDefault();

    // Esconde a parte do login e o link
    formLogin.style.display = 'none';
    areaRecuperarLink.style.display = 'none';

    // Mostra a parte de digitar o e-mail para recuperar
    secaoRecuperarSenha.style.display = 'block';
});

// Quando clica no botão "Voltar ao Login"
btnVoltarLogin.addEventListener('click', function() {
    // Esconde a parte de recuperação
    secaoRecuperarSenha.style.display = 'none';

    // Mostrar o formuláario de login novamente (mantemos o link escondido até ele errar novamente)
    formLogin.style.display = 'block'
})

// ==========================================
// ENVIAR SOLICITAÇÃO DE RECUPERAÇÃO
// ==========================================
const formRecuperar = document.getElementById('form-recuperar');

if (formRecuperar) {
    formRecuperar.addEventListener('submit', async function(evento) {
        evento.preventDefault(); // Impede a página de recarregar

        const emailRecuperacao = document.getElementById('email-recuperacao').value;
        const btnEnviarCodigo = document.getElementById('btn-enviar-codigo-rec');

        btnEnviarCodigo.textContent = 'Enviando...';
        btnEnviarCodigo.disabled = true;

        try {
            // Fazemos o pedido para a nossa nova rota no Python
            const resposta = await fetch(BASE_URL + '/solicitar-recuperacao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailRecuperacao })
            });

            const dadosResposta = await resposta.json();

            if (dadosResposta.sucesso === true) {
                alert('📧 ' + dadosResposta.mensagem);
                
                document.getElementById('secao-recuperar-senha').style.display = 'none';
                document.getElementById('secao-nova-senha').style.display = 'block';

            } else {
                alert('❌ ' + dadosResposta.mensagem);
            }
        } catch (erro) {
            console.error("Erro:", erro);
            alert("Erro ao conectar com o servidor.");
        } finally {
            // Restaura o botão independentemente de dar erro ou sucesso
            btnEnviarCodigo.textContent = 'Enviar Código';
            btnEnviarCodigo.disabled = false;
        }
    });
};

// ==========================================
// ENVIAR NOVA SENHA E CÓDIGO
// ==========================================

const formNovaSenha = document.getElementById('form-nova-senha');

if (formNovaSenha) {
    formNovaSenha.addEventListener('submit', async function (evento) {
        evento.preventDefault();

        // Pegamos o e-mail lá do outro input, o código e a nova senha
        const emailRecuperacao = document.getElementById('email-recuperacao').value;
        const codigoDigitado = document.getElementById('codigo-recuperacao').value;
        const novaSenha = document.getElementById('nova-senha').value;
        const btnSalvar = document.getElementById('btn-salvar-senha');

        btnSalvar.textContent = 'Salvando...';
        btnSalvar.disabled = true;

        try {
            // Vamos enviar tudo para a nossa nova rota do Python
            const resposta = await fetch(BASE_URL + '/redefinir-senha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: emailRecuperacao,
                    codigo: codigoDigitado,
                    nova_senha: novaSenha
                })
            });

            const dadosResposta = await resposta.json();

            if (dadosResposta.sucesso === true) {
                alert('✅ ' + dadosResposta.mensagem);
                // Se der sucesso, recarrega a página para voltar ao login inicial!
                window.location.reload();
            } else {
                alert('❌ ' + dadosResposta.mensagem);
                btnSalvar.textContent = 'Salvar Nova Senha';
                btnSalvar.disabled = false;
            }
        } catch (erro) {
            console.error("Erro:", erro);
            alert("Erro ao conectar com o servidor.");
            btnSalvar.textContent = 'Salvar Nova Senha';
            btnSalvar.disabled = false;
        }
    });
};


