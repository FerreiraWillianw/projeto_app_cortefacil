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

// ==========================================
// INTEGRAÇÃO COM O BACKEND (PYTHON)
// ==========================================
const BASE_URL = 'http://127.0.0.1:5000';
// Simulamos que o barbeiro logado no sistema tem o ID 1
const MEU_ID_BARBEIRO = 1; 

// Captura os campos de filtro
const inputFiltroData = document.getElementById('filtro-data');
const inputFiltroStatus = document.getElementById('filtro-status');

// Assim que a página abre...
document.addEventListener('DOMContentLoaded', () => {
    // 1. Bloqueia o campo de filtro de data para não permitir selecionar o passado (igual à regra de agendamento)
    const hoje = new Date().toISOString().split("T")[0];
    inputFiltroData.setAttribute('min', hoje);

    carregarMinhaAgenda();
});

// Se o barbeiro mudar a data ou o status, recarrega a lista automaticamente!
inputFiltroData.addEventListener('change', carregarMinhaAgenda);
inputFiltroStatus.addEventListener('change', carregarMinhaAgenda);

async function carregarMinhaAgenda() {
    const listaAgendamentos = document.getElementById('lista-agendamentos');
    listaAgendamentos.innerHTML = '<p style="text-align: center; color: #666;">A carregar a tua agenda...</p>';

    // Pega os valores atuais dos filtros
    const dataFiltrada = inputFiltroData.value;
    const statusFiltrado = inputFiltroStatus.value;

    try {
        // Monta o link (URL) passando os filtros para o Python
        let url = `${BASE_URL}/api/barbeiros/${MEU_ID_BARBEIRO}/agendamentos?status=${statusFiltrado}`;
        if (dataFiltrada) {
            url += `&data=${dataFiltrada}`;
        }

        const resposta = await fetch(url);
        const dados = await resposta.json();

        if (dados.sucesso) {
            listaAgendamentos.innerHTML = ''; 

            if (dados.agendamentos.length === 0) {
                listaAgendamentos.innerHTML = '<p style="text-align: center; color: #666;">Nenhum agendamento encontrado para este filtro.</p>';
                return;
            }

            dados.agendamentos.forEach(function(ag) {
                const partesData = ag.data.split('-');
                const dataBR = `${partesData[2]}/${partesData[1]}/${partesData[0]}`;
                const horaFormatada = ag.hora.slice(0, 5); 
                const telefoneTexto = ag.telefone ? ag.telefone : 'Sem telefone';

                const card = document.createElement('div');
                card.classList.add('card-barbearia');
                
                // MUDANÇA VISUAL: Adicionamos um ícone ou cor (tag) dependendo do status
                let tagStatus = '';
                if(ag.status === 'concluido') tagStatus = '<span style="color: #10b981; font-size: 12px; font-weight: bold;">(CONCLUÍDO)</span>';
                if(ag.status === 'cancelado') tagStatus = '<span style="color: #ef4444; font-size: 12px; font-weight: bold;">(CANCELADO)</span>';

                card.innerHTML = `
                    <div class="card-info">
                        <h3>${ag.nome} ${tagStatus}</h3>
                        <p><i class="ph ph-phone"></i> ${telefoneTexto}</p>
                        <p><i class="ph ph-calendar-blank"></i> ${dataBR}</p>
                        <p><i class="ph ph-clock"></i> ${horaFormatada}</p>
                    </div>
                    
                    <!-- Os botões. Se já estiver concluído/cancelado, podemos esconder ou alterar -->
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        ${ag.status === 'pendente' ? `<button class="btn-selecionar-barbearia" onclick="atualizarStatus(${ag.id}, 'concluido')" style="flex: 1; background-color: var(--secondary-color); color: var(--dark-color);">Concluir</button>` : ''}
                        <button class="btn-selecionar-barbearia" onclick="excluirAgendamento(${ag.id})" style="flex: 1; background-color: #ffeaea; color: #d63031;">Excluir</button>
                    </div>
                `;

                listaAgendamentos.appendChild(card);
            });
        }
    } catch (erro) {
        console.error("Erro ao carregar agenda:", erro);
        listaAgendamentos.innerHTML = '<p style="text-align: center; color: red;">Erro ao carregar dados do servidor.</p>';
    }
}

// Funções para os botões do cartão (Concluir e Excluir)
async function atualizarStatus(idAgendamento, novoStatus) {
    try {
        const resposta = await fetch(`${BASE_URL}/api/agendamentos/${idAgendamento}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus })
        });
        const dados = await resposta.json();
        
        if (dados.sucesso) carregarMinhaAgenda(); // Recarrega a tela para o cartão sumir
    } catch (erro) { console.error("Erro ao atualizar:", erro); }
}

async function excluirAgendamento(idAgendamento) {
    if (!confirm("Excluir este agendamento?")) return;
    try {
        const resposta = await fetch(`${BASE_URL}/api/agendamentos/${idAgendamento}`, { method: 'DELETE' });
        const dados = await resposta.json();
        
        if (dados.sucesso) carregarMinhaAgenda(); // Recarrega a tela para o cartão sumir
    } catch (erro) { console.error("Erro ao excluir:", erro); }
}