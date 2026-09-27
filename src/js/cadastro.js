const BASE_URL = "http://127.0.0.1:5000";

const formCadastro = document.getElementById('form-cadastro');

formCadastro.addEventListener('submit', async function(evento) {
    evento.preventDefault();

    const senhaDigitada = document.getElementById('senha').value;
    const confirmacaoDigitada = document.getElementById('confirmar-senha').value;

    if (senhaDigitada !== confirmacaoDigitada) {
        alert("As senhas não conferem, por favor, digite novamente!")
        return;
    }

    const nomeDigitado = document.getElementById('nome').value;
    const emailDigitado = document.getElementById('email').value;
    const telefoneDigitado = document.getElementById('telefone').value;
    
    try {
        const urlCompleta = BASE_URL + '/cadastro';
        const resposta = await fetch(urlCompleta, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome: nomeDigitado,
                email: emailDigitado,
                telefone: telefoneDigitado,
                senha: senhaDigitada
            })
        });

        const dadosResposta = await resposta.json();

        if (dadosResposta.sucesso === true) {
            alert('✅ ' + dadosResposta.mensagem);
            window.location.href = 'login.html';
        } else {
            alert('❌ Erro: ' + dadosResposta.mensagem);
        }

    } catch (erro) {
        console.error("Erro de comunicação:", erro);
        alert("Erro ao conectar com o servidor. O backend Python está rodando?");
    }

});