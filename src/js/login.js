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

