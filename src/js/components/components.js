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

// ==========================================
// CRIADOR DE SELECTS CUSTOMIZADOS (GENÉRICO & MÚLTIPLO)
// ==========================================

document.addEventListener("DOMContentLoaded", function() {
    
    const selectsOriginais = document.querySelectorAll('.select-customizado');

    selectsOriginais.forEach(selectOriginal => {
        const container = selectOriginal.parentElement;
        
        // Descobre se este select é de múltipla escolha ou não
        const eMultiplo = selectOriginal.hasAttribute('multiple');
        
        const header = document.createElement('div');
        header.className = 'select-falso-header';
        
        // Define o texto inicial
        if (eMultiplo) {
            header.textContent = "Selecione as opções...";
        } else {
            header.textContent = selectOriginal.options[selectOriginal.selectedIndex].text;
        }
        
        const lista = document.createElement('ul');
        lista.className = 'select-falso-lista';

        // Lógica de clicar no Header para abrir/fechar
        header.addEventListener('click', function(evento) {
            evento.stopPropagation(); 
            const estaAberto = lista.style.display === 'block';
            
            document.querySelectorAll('.select-falso-lista').forEach(l => l.style.display = 'none');
            document.querySelectorAll('.select-falso-header').forEach(h => h.classList.remove('aberto'));

            if (!estaAberto) {
                lista.style.display = 'block';
                header.classList.add('aberto');
            }
        });

        // Cria os itens da lista
        Array.from(selectOriginal.options).forEach(opcaoOriginal => {
            const li = document.createElement('li');
            li.textContent = opcaoOriginal.text;
            
            // Evento de Clique na opção
            li.addEventListener('click', function(evento) {
                
                if (eMultiplo) {
                    // ==========================================
                    // LÓGICA PARA MÚLTIPLA ESCOLHA (DIAS DA SEMANA)
                    // ==========================================
                    evento.stopPropagation(); // Impede a lista de fechar!
                    
                    // Inverte a seleção (se estava clicado, desclica)
                    opcaoOriginal.selected = !opcaoOriginal.selected;
                    li.classList.toggle('item-selecionado');
                    
                    // Conta quantos itens estão selecionados para atualizar o texto do Header
                    const selecionados = Array.from(selectOriginal.selectedOptions).length;
                    if (selecionados === 0) header.textContent = "Selecione os dias...";
                    else if (selecionados === 1) header.textContent = "1 dia selecionado";
                    else header.textContent = `${selecionados} dias selecionados`;
                    
                } else {
                    // ==========================================
                    // LÓGICA PARA ESCOLHA ÚNICA (EX: FILTRO DE STATUS)
                    // ==========================================
                    header.textContent = opcaoOriginal.text;
                    selectOriginal.value = opcaoOriginal.value;
                    lista.style.display = 'none';
                    header.classList.remove('aberto');
                }
                
                // Avisa o sistema que o valor mudou
                selectOriginal.dispatchEvent(new Event('change'));
            });
            
            lista.appendChild(li);
        });

        container.appendChild(header);
        container.appendChild(lista);
    });

    // Clicar fora fecha os menus
    document.addEventListener('click', function() {
        document.querySelectorAll('.select-falso-lista').forEach(l => l.style.display = 'none');
        document.querySelectorAll('.select-falso-header').forEach(h => h.classList.remove('aberto'));
    });
});