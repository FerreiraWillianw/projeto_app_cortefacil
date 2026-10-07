const BASE_URL = 'http://127.0.0.1:5000';
const selectBarbeiro = document.getElementById('select-barbeiro');
const inputData = document.getElementById('data-agendamento');

// Variável que guarda a regra do barbeiro atualmente selecionado
let diasTrabalhoBarbeiro = [];
let calendario;

// Garantimos que tudo arranca apenas quando o HTML estiver pronto
document.addEventListener('DOMContentLoaded', async function() {
    
    // 1. INICIALIZA O FLATPICKR COM SEGURANÇA
    calendario = flatpickr(inputData, {
        minDate: "today",           // Bloqueia dias passados
        locale: "pt",               // Deixa os meses e dias em português
        dateFormat: "Y-m-d",        // O formato secreto que o Python/Banco recebe (ex: 2026-10-01)
        altInput: true,             // Habilita o "campo alternativo" visual para o utilizador
        altFormat: "d/m/Y",         // O formato bonito que aparece na tela para o brasileiro (ex: 01/10/2026)
        disable: [],                
    });

    // 2. CARREGA A LISTA DE BARBEIROS
    try {
        const resposta = await fetch(BASE_URL + '/api/barbeiros');
        const dados = await resposta.json();

        if (dados.sucesso) {
            dados.barbeiros.forEach(function(barbeiro) {
                const opcao = document.createElement('option');
                opcao.value = barbeiro.id;
                opcao.textContent = barbeiro.nome;
                selectBarbeiro.appendChild(opcao);
            });
        }
    } catch (erro) {
        console.error("Erro ao carregar barbeiros:", erro);
    }
});

// 3. Quando o cliente escolhe um barbeiro, busca a agenda dele
selectBarbeiro.addEventListener('change', async function() {
    const barbeiroId = this.value;
    
    // Limpa a data escolhida e os horários
    calendario.clear(); 
    document.getElementById('hora-agendamento').innerHTML = '<option value="" disabled selected>Escolha uma data primeiro...</option>';
    document.getElementById('hora-agendamento').disabled = true;

    try {
        const resposta = await fetch(`${BASE_URL}/api/barbeiros/${barbeiroId}/disponibilidade`);
        const dados = await resposta.json();

        if (dados.sucesso) {
            diasTrabalhoBarbeiro = dados.disponibilidade.map(item => Number(item.dia_semana));

            // ==========================================
            // A MAGIA ACONTECE AQUI: Bloqueando os dias no calendário!
            // ==========================================
            calendario.set("disable", [
                function(dataDoCalendario) {
                    const dia = dataDoCalendario.getDay();
                    // Se o dia do calendário NÃO estiver na lista de trabalho, return true (DESATIVA)
                    return !diasTrabalhoBarbeiro.includes(dia);
                }
            ]);
        }
    } catch (erro) {
        console.error("Erro ao obter horários do barbeiro:", erro);
    }
});

// ==========================================
// 4. BUSCA DE HORÁRIOS LIVRES
// ==========================================
const selectHora = document.getElementById('hora-agendamento');

inputData.addEventListener('change', async function() {
    
    // A NOSSA PROTEÇÃO: Se a data estiver vazia (quando mudamos de barbeiro), o código para aqui!
    if (!this.value) {
        return; 
    }

    // Verifica se o barbeiro foi escolhido
    if (!selectBarbeiro.value) {
        alert("Por favor, selecione um profissional primeiro.");
        calendario.clear(); // Limpa o calendário
        return;
    }

    const dataSelecionadaStr = this.value; // Formato: YYYY-MM-DD
    
    // (A validação manual antiga do dia da semana foi apagada daqui. O Flatpickr já faz esse trabalho!)

    // ==========================================
    // BUSCAR AS HORAS LIVRES NO PYTHON
    // ==========================================
    
    // Mostramos ao cliente que o sistema está a pensar
    selectHora.innerHTML = '<option value="" disabled selected>Carregando horários...</option>';
    selectHora.disabled = true;

    try {
        const barbeiroId = selectBarbeiro.value;
        
        // Fazemos o pedido, enviando a data no final do link
        const resposta = await fetch(`${BASE_URL}/api/barbeiros/${barbeiroId}/horarios?data=${dataSelecionadaStr}`);
        const dados = await resposta.json();

        if (dados.sucesso) {
            // Limpa o select para colocar as novas opções
            selectHora.innerHTML = '<option value="" disabled selected>Escolha o horário...</option>';

            if (dados.horarios.length === 0) {
                selectHora.innerHTML = '<option value="" disabled selected>Nenhum horário livre neste dia</option>';
            } else {
                // Para cada horário livre que veio do Python, criamos uma opção!
                dados.horarios.forEach(function(hora) {
                    const opcao = document.createElement('option');
                    opcao.value = hora;
                    opcao.textContent = hora;
                    selectHora.appendChild(opcao);
                });
                
                // Desbloqueia o select para o cliente clicar!
                selectHora.disabled = false; 
            }
        } else {
            alert("Erro ao carregar horários: " + dados.mensagem);
        }
    } catch (erro) {
        console.error("Erro ao buscar horários:", erro);
        selectHora.innerHTML = '<option value="" disabled selected>Erro ao carregar</option>';
    }
});

// ==========================================
// 5. ENVIAR O AGENDAMENTO PARA O BANCO DE DADOS
// ==========================================
const formAgendar = document.getElementById('form-agendar');

if (formAgendar) {
    formAgendar.addEventListener('submit', async function(evento) {
        evento.preventDefault(); // Impede a página de recarregar imediatamente

        // 1. Recolhemos os dados dos campos
        const nome = document.getElementById('nome-cliente').value;
        const data = document.getElementById('data-agendamento').value;
        const hora = document.getElementById('hora-agendamento').value;
        const barbeiroId = document.getElementById('select-barbeiro').value;
        
        // TRUQUE DO TELEFONE: Removemos a máscara (parênteses e espaços) para o banco de dados
        const telefoneComMascara = document.getElementById('telefone-cliente').value;
        const telefoneLimpo = telefoneComMascara.replace(/\D/g, ''); // Mantém apenas os números

        const btnAgendar = document.getElementById('btn-agendar');
        btnAgendar.textContent = 'A agendar...';
        btnAgendar.disabled = true;

        try {
            // 2. Enviamos os dados para a nossa nova rota no Python
            const resposta = await fetch(BASE_URL + '/api/agendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: nome,
                    telefone: telefoneLimpo,
                    barbeiro_id: barbeiroId,
                    data: data,
                    hora: hora
                })
            });

            const dadosResposta = await resposta.json();

            // 3. Tratamos a resposta do Python
            if (dadosResposta.sucesso === true) {
                alert('✅ ' + dadosResposta.mensagem);
                // Sucesso! Recarregamos a página para limpar o formulário para um próximo cliente
                window.location.reload(); 
            } else {
                alert('❌ ' + dadosResposta.mensagem);
                btnAgendar.textContent = 'Confirmar Agendamento';
                btnAgendar.disabled = false;
            }
        } catch (erro) {
            console.error("Erro ao agendar:", erro);
            alert("Erro de conexão com o servidor. Tente novamente.");
            btnAgendar.textContent = 'Confirmar Agendamento';
            btnAgendar.disabled = false;
        }
    });
}