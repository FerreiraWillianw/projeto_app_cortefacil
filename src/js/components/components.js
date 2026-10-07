// ==========================================
// CAIXA DE FERRAMENTAS: COMPONENTES GLOBAIS
// ==========================================

const URL_API_GLOBAL = 'http://127.0.0.1:5000';

/**
 * COMPONENTE 1: CALENDÁRIO COM BLOQUEIOS
 * @param {string} idDoInput - ID do campo HTML
 * @param {Array} diasDeTrabalho - Dias permitidos [1,2,3...]
 * @param {Function} aoMudarData - (Opcional) O que fazer quando a data é escolhida
 */
function criarComponenteData(idDoInput, diasDeTrabalho = [], aoMudarData = null) {
    return flatpickr(document.getElementById(idDoInput), {
        minDate: "today",       
        locale: "pt",
        dateFormat: "Y-m-d",    
        altInput: true,
        altFormat: "d/m/Y",     
        disable: [
            function(dataDoCalendario) {
                if (diasDeTrabalho.length === 0) return false; 
                return !diasDeTrabalho.includes(dataDoCalendario.getDay());
            }
        ],
        // MÁGICA: Se passarmos uma ação, ela é executada quando a data muda!
        onChange: function(datasSelecionadas, dataEmTexto) {
            if (aoMudarData) {
                aoMudarData(dataEmTexto); // Envia a data (ex: 2026-10-01) para a função
            }
        }
    });
}

/**
 * COMPONENTE 2: BUSCAR HORÁRIOS LIVRES NO PYTHON
 * @param {number} barbeiroId - ID do barbeiro
 * @param {string} dataSelecionada - Data escolhida (YYYY-MM-DD)
 * @param {string} idSelectHora - O ID do <select> HTML que vai receber as opções
 */
async function carregarHorariosDisponiveis(barbeiroId, dataSelecionada, idSelectHora) {
    const selectHora = document.getElementById(idSelectHora);
    
    selectHora.innerHTML = '<option value="" disabled selected>Carregando horários...</option>';
    selectHora.disabled = true;

    try {
        const resposta = await fetch(`${URL_API_GLOBAL}/api/barbeiros/${barbeiroId}/horarios?data=${dataSelecionada}`);
        const dados = await resposta.json();

        if (dados.sucesso) {
            selectHora.innerHTML = '<option value="" disabled selected>Escolha o horário...</option>';
            
            if (dados.horarios.length === 0) {
                selectHora.innerHTML = '<option value="" disabled selected>Nenhum horário livre</option>';
            } else {
                // Cria as opções (options) para o Select
                dados.horarios.forEach(hora => {
                    const opcao = document.createElement('option');
                    opcao.value = hora;
                    opcao.textContent = hora;
                    selectHora.appendChild(opcao);
                });
                selectHora.disabled = false; // Desbloqueia para o utilizador
            }
        }
    } catch (erro) {
        console.error("Erro ao buscar horários:", erro);
        selectHora.innerHTML = '<option value="" disabled selected>Erro ao carregar</option>';
    }
}