// ==========================================
// VERIFICAÇÃO DE SEGURANÇA (O CRACHÁ)
// ==========================================

// 1. Tentamos procurar o crachá 'barbeiro_logado' na memória do navegador
const crachaTexto = localStorage.getItem('barbeiro_logado');

// 2. Se o texto não existir (for null), significa que ele não fez login
if (!crachaTexto) {
    alert("⛔ Acesso negado! Por favor, faça o login primeiro.")
    window.location.href = 'login.html';
} else {
    const barbeiro = JSON.parse(crachaTexto)
}


// ==========================================
// FUNÇÃO DE LOGOUT (Sair do sistema)
// ==========================================

function fazerLogout() {
    localStorage.removeItem('barbeiro_logado');
    window.location.href = 'login.html';
}


// ==========================================
// BOTÃO DE SAIR (LOGOUT SEGURO)
// ==========================================

const btnSair = document.getElementById('btn-sair');

if (btnSair) {
    btnSair.addEventListener('click', function(evento) {
        evento.preventDefault();

        // 1. Rasgamos o crachá!
        localStorage.removeItem('barbeiro_logado');

        // 2. Mandamos o utilizador de volta para o login
        window.location.href = 'login.html'
    })
}