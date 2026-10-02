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
// INTEGRAÇÃO COM O BACKEND (PYTHON) E FILTROS
// ==========================================
const BASE_URL = 'http://127.0.0.1:5000';
const MEU_ID_BARBEIRO = 1; 

const inputFiltroData = document.getElementById('filtro-data');
const inputFiltroStatus = document.getElementById('filtro-status');

// Variável para guardar os dias que o barbeiro trabalha
let diasTrabalhoBarbeiro = [];

// Assim que a página abre... (Agora é async!)
document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. BUSCAR A DISPONIBILIDADE ANTES DE MONTAR O CALENDÁRIO
    try {
        const respostaDisp = await fetch(`${BASE_URL}/api/barbeiros/${MEU_ID_BARBEIRO}/disponibilidade`);
        const dadosDisp = await respostaDisp.json();

        if (dadosDisp.sucesso) {
            // Guardamos os dias na nossa lista (ex: [1, 2, 3, 4, 5])
            diasTrabalhoBarbeiro = dadosDisp.disponibilidade.map(item => Number(item.dia_semana));
        }
    } catch (erro) {
        console.error("Erro ao buscar disponibilidade:", erro);
    }

    // 2. INICIALIZA O FLATPICKR JÁ COM OS BLOQUEIOS
    flatpickr(inputFiltroData, {
        minDate: "today",       
        locale: "pt",
        dateFormat: "Y-m-d",    
        altInput: true,
        altFormat: "d/m/Y",     
        disable: [
            function(dataDoCalendario) {
                // Se a lista estiver vazia (erro na rede), não bloqueia nada para não travar
                if (diasTrabalhoBarbeiro.length === 0) return false; 
                
                const dia = dataDoCalendario.getDay();
                // Bloqueia (return true) se o dia NÃO estiver na lista de dias de trabalho
                return !diasTrabalhoBarbeiro.includes(dia);
            }
        ],
        onChange: function() {
            carregarMinhaAgenda(); // Recarrega os cartões quando muda a data
        }
    });

    // 3. Carrega a agenda pela primeira vez
    carregarMinhaAgenda();
});

// Se o barbeiro mudar o status no select, recarrega a lista
inputFiltroStatus.addEventListener('change', carregarMinhaAgenda);

async function carregarMinhaAgenda() {
    const listaAgendamentos = document.getElementById('lista-agendamentos');
    listaAgendamentos.innerHTML = '<p style="text-align: center; color: #666;">A carregar a tua agenda...</p>';

    const dataFiltrada = inputFiltroData.value;
    const statusFiltrado = inputFiltroStatus.value;

    try {
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

                // ==========================================
                // LÓGICA DAS BADGES (ETIQUETAS VISUAIS)
                // ==========================================
                let badgeHTML = '';
                if(ag.status === 'pendente') {
                    badgeHTML = '<span class="badge badge-pendente">Pendente</span>';
                } else if(ag.status === 'concluido') {
                    badgeHTML = '<span class="badge badge-concluido">Concluído</span>';
                } else if(ag.status === 'cancelado') {
                    badgeHTML = '<span class="badge badge-cancelado">Cancelado</span>';
                }

                const card = document.createElement('div');
                card.classList.add('card-barbearia');
                
                card.innerHTML = `
                    <div class="card-info">
                        <!-- NOME E BADGE LADO A LADO -->
                        <div style="display: flex; align-items: center; margin-bottom: 6px;">
                            <h3 style="margin: 0;">${ag.nome}</h3>
                            ${badgeHTML}
                        </div>
                        <p><i class="ph ph-phone"></i> ${telefoneTexto}</p>
                        <p><i class="ph ph-calendar-blank"></i> ${dataBR}</p>
                        <p><i class="ph ph-clock"></i> ${horaFormatada}</p>
                    </div>
                    
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