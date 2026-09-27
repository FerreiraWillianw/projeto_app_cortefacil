const BASE_URL = "http://127.0.0.1:5000";

// Elementos da tela
const secaoDados = document.getElementById('secao-dados');
const secaoVerificacao = document.getElementById('secao-verificacao');
const formCadastro = document.getElementById('form-cadastro');
const btnValidarCodigo = document.getElementById('btn-validar-codigo');

// Elementos do Temporizador
const textoTemporizador = document.getElementById('temporizador-texto');
const btnReenviar = document.getElementById('btn-reenviar-codigo');
let intervaloTemporizador; // Variável global para podermos parar o relógio

// ==========================================
// FUNÇÃO DO RELÓGIO CONTAGEM REGRESSIVA
// ==========================================
function iniciarTemporizador() {
    let tempoEmSegundos = 120; // 2 minutos
    
    // Limpa qualquer relógio antigo que já estivesse a rodar
    clearInterval(intervaloTemporizador);
    
    // Esconde o botão de reenviar e liga o botão de validar
    btnReenviar.style.display = 'none';
    btnValidarCodigo.disabled = false;

    // Começa o cronômetro
    intervaloTemporizador = setInterval(function() {
        // Matemática para pegar os minutos e segundos
        let minutos = Math.floor(tempoEmSegundos / 60);
        let segundos = tempoEmSegundos % 60;

        // Adiciona um zero à esquerda se for menor que 10 (ex: 02:09)
        minutos = minutos < 10 ? '0' + minutos : minutos;
        segundos = segundos < 10 ? '0' + segundos : segundos;

        // Atualiza a tela
        textoTemporizador.textContent = `${minutos}:${segundos}`;

        // Quando o tempo acabar...
        if (tempoEmSegundos <= 0) {
            clearInterval(intervaloTemporizador); // Para o relógio
            textoTemporizador.textContent = "Código expirado!";
            btnReenviar.style.display = 'inline-block'; // Mostra o botão de reenviar
            btnValidarCodigo.disabled = true; // Impede de validar código velho
        }
        
        tempoEmSegundos--; // Tira 1 segundo
    }, 1000); // Roda a cada 1000 milissegundos (1 segundo)
}

// ==========================================
// ETAPA 1: SOLICITAR O CÓDIGO INICIALMENTE
// ==========================================
formCadastro.addEventListener('submit', async function(evento) {
    evento.preventDefault();

    const senha = document.getElementById('senha').value;
    const confirmacao = document.getElementById('confirmar-senha').value;

    if (senha !== confirmacao) {
        alert('❌ As senhas não conferem!');
        return; 
    }

    const btnEnviar = document.getElementById('btn-enviar-dados');
    btnEnviar.textContent = 'Enviando e-mail...';
    btnEnviar.disabled = true;

    const emailDigitado = document.getElementById('email').value;

    try {
        const resposta = await fetch(BASE_URL + '/solicitar-codigo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailDigitado })
        });

        const dadosResposta = await resposta.json();

        if (dadosResposta.sucesso === true) {
            // Escondemos o form e mostramos a caixinha do código
            secaoDados.style.display = 'none';
            secaoVerificacao.style.display = 'block';
            
            // LIGAMOS O RELÓGIO AQUI!
            iniciarTemporizador();
            
            alert('✅ ' + dadosResposta.mensagem);
        } else {
            alert('❌ Erro: ' + dadosResposta.mensagem);
            btnEnviar.textContent = 'Cadastrar';
            btnEnviar.disabled = false;
        }
    } catch (erro) {
        console.error("Erro:", erro);
        alert("Erro ao conectar com o servidor.");
        btnEnviar.textContent = 'Cadastrar';
        btnEnviar.disabled = false;
    }
});

// ==========================================
// ETAPA 1.5: REENVIAR O CÓDIGO
// ==========================================
btnReenviar.addEventListener('click', async function() {
    const emailDigitado = document.getElementById('email').value;
    
    btnReenviar.textContent = "Reenviando...";
    btnReenviar.disabled = true;

    try {
        const resposta = await fetch(BASE_URL + '/solicitar-codigo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailDigitado })
        });

        const dadosResposta = await resposta.json();

        if (dadosResposta.sucesso === true) {
            // Se deu certo, limpamos a tela e reiniciamos o relógio!
            document.getElementById('codigo-digitado').value = "";
            btnReenviar.textContent = "Reenviar Código";
            btnReenviar.disabled = false;
            iniciarTemporizador();
            alert('✅ Um novo código foi enviado para o seu e-mail!');
        } else {
            alert('❌ Erro: ' + dadosResposta.mensagem);
            btnReenviar.textContent = "Reenviar Código";
            btnReenviar.disabled = false;
        }
    } catch (erro) {
        console.error("Erro:", erro);
        alert("Erro ao conectar com o servidor.");
        btnReenviar.textContent = "Reenviar Código";
        btnReenviar.disabled = false;
    }
});

// ==========================================
// ETAPA 2: VALIDAR O CÓDIGO E SALVAR
// ==========================================
btnValidarCodigo.addEventListener('click', async function() {
    const codigo = document.getElementById('codigo-digitado').value;
    
    if (codigo.length !== 6) {
        alert('⚠️ O código deve ter exatos 6 dígitos.');
        return;
    }

    const nomeDigitado = document.getElementById('nome').value;
    const emailDigitado = document.getElementById('email').value;
    const telefoneDigitado = document.getElementById('telefone').value;
    const senhaDigitada = document.getElementById('senha').value;

    btnValidarCodigo.textContent = 'Validando...';
    btnValidarCodigo.disabled = true;

    try {
        const resposta = await fetch(BASE_URL + '/cadastro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: nomeDigitado,
                email: emailDigitado,
                telefone: telefoneDigitado,
                password: senhaDigitada,
                codigo: codigo 
            })
        });

        const dadosResposta = await resposta.json();

        if (dadosResposta.sucesso === true) {
            alert('🎉 ' + dadosResposta.mensagem);
            window.location.href = 'login.html';
        } else {
            alert('❌ Erro: ' + dadosResposta.mensagem);
            btnValidarCodigo.textContent = 'Validar e Criar Conta';
            btnValidarCodigo.disabled = false;
        }
    } catch (erro) {
        console.error("Erro:", erro);
        alert("Erro ao tentar validar.");
        btnValidarCodigo.textContent = 'Validar e Criar Conta';
        btnValidarCodigo.disabled = false;
    }
});