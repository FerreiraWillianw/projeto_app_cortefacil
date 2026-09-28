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
})