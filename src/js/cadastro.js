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

// Selecionamos o campo de telefone do HTML
const inputTelefone = document.getElementById('telefone');

// Ouvimos cada tecla que o usuário digita no campo de telefone
inputTelefone.addEventListener('input', function(e) {
    // 1. Pega o valor atual e remove TUDO o que não for número (\D significa "não-dígito")
    let valor = e.target.value.replace(/\D/g, "");

    // 2. Limita o tamanho máximo para 11 dígitos (DDD 2 + Celular 9)
    if (valor.length > 11) {
        valor = valor.substring(0, 11);
    }

    // 3. Aplica a formatação (máscara) dependendo do tamanho
    if (valor.length > 10) {
        // Formato Celular: (XX) XXXXX-XXXX
        valor = valor.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (valor.length > 6) {
        // Formato Fixo intermediário: (XX) XXXX-XXXX
        valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (valor.length > 2) {
        // Apenas com DDD: (XX) XXXX
        valor = valor.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    } else if (valor.length > 0) {
        // Apenas os primeiros dígitos: (XX
        valor = valor.replace(/^(\d{0,2})/, "($1");
    }

    // 4. Devolve o valor formatado para a caixinha na tela
    e.target.value = valor;
});

// ==========================================
// ETAPA 1: ENVIAR O FORMULÁRIO CLICANDO NO BOTÃO DELE E SOLICITAR O CÓDIGO INICIALMENTE
// ==========================================
formCadastro.addEventListener('submit', async function(evento) {
    evento.preventDefault();

    const senha = document.getElementById('senha').value;
    const confirmacao = document.getElementById('confirmar-senha').value;

    const regraSenhaForte = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!regraSenhaForte.test(senha)) {
        alert("❌ A senha precisa ter no mínimo 8 caracteres, com letras maísculas, minúsculas e caractere especial!");
        return;
    }

    if (senha !== confirmacao) {
        alert('❌ As senhas não conferem!');
        return; 
    }

    const btnEnviar = document.getElementById('btn-enviar-dados');
    btnEnviar.textContent = 'Cadastrando...';
    btnEnviar.disabled = true;

    const emailDigitado = document.getElementById('email').value;

    // Validação do Telefone: Pegamos o valor e limpamos tudo o que não for número
    const telefoneLimpo = document.getElementById('telefone').value.replace(/\D/g, "");

    if (telefoneLimpo.length < 10 || telefoneLimpo.length > 11) {
        alert('❌ O telefone deve conter 10 ou 11 dígitos (incluindo o DDD).');
        return; // Interrompe o envio
    }

    try {
        const resposta = await fetch(BASE_URL + '/solicitar-codigo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailDigitado })
        });

        const dadosResposta = await resposta.json();

        if (dadosResposta.sucesso === true) {
            document.getElementById('email-destino').textContent = emailDigitado
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
    const telefoneDigitado = document.getElementById('telefone').value.replace(/\D/g, "");
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

// ==========================================
// BOTÃO VOLTAR (Cancela a verificação e retorna ao form)
// ==========================================
const btnVoltar = document.getElementById('btn-voltar');

btnVoltar.addEventListener('click', function() {
    // 1. Para o relógio para não ficar rodando em segundo plano
    clearInterval(intervaloTemporizador);

    // 2. Esconde a seção de verificação e mostra a seção de cadastro de volta
    secaoVerificacao.style.display = 'none';
    secaoDados.style.display = 'block';

    // 3. Reativa o botão de envio original e reseta o seu texto
    const btnEnviar = document.getElementById('btn-enviar-dados');
    btnEnviar.textContent = 'Cadastrar';
    btnEnviar.disabled = false;

    // 4. Limpa o campo do código digitado
    document.getElementById('codigo-digitado').value = '';
});