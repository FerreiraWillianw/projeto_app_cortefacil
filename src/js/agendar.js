const BASE_URL = 'http://127.0.0.1:5000';
const selectBarbeiro = document.getElementById('select-barbeiro');
const inputData = document.getElementById('data-agendamento');

// Variável que guarda a regra do barbeiro atualmente selecionado
let diasTrabalhoBarbeiro = [];

// 1. Bloqueia datas passadas no calendário
const dataHoje = new Date().toISOString().split('T')[0];
inputData.setAttribute('min', dataHoje);

// 2. Carrega lista de barbeiros ao abrir
document.addEventListener('DOMContentLoaded', async function() {
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
    inputData.value = ''; // Limpa a data escolhida anteriormente

    try {
        const resposta = await fetch(`${BASE_URL}/api/barbeiros/${barbeiroId}/disponibilidade`);
        const dados = await resposta.json();

        // 🕵️ MODO DETETIVE: Vamos imprimir no Console o que o Python devolveu!
        console.log(`Resposta do Python para o Barbeiro ID ${barbeiroId}:`, dados);

        if (dados.sucesso) {
            
            // Se o array vier vazio, avisamos logo o utilizador que este barbeiro não tem agenda!
            if (dados.disponibilidade.length === 0) {
                alert("Atenção: Este profissional ainda não tem dias de trabalho configurados no sistema.");
            }

            // Extrai apenas os dias da semana e usa Number() para garantir que são números e não texto!
            diasTrabalhoBarbeiro = dados.disponibilidade.map(function(item) {
                return Number(item.dia_semana); 
            });
            
            // 🕵️ MODO DETETIVE: Ver a lista final que o JS vai usar para validar
            console.log("Dias de trabalho guardados no JS:", diasTrabalhoBarbeiro);
        }
    } catch (erro) {
        console.error("Erro ao obter horários do barbeiro:", erro);
    }
});

// 4. Validação inteligente da data escolhida
inputData.addEventListener('change', function() {
    if (!selectBarbeiro.value) {
        alert("Por favor, selecione um profissional primeiro.");
        this.value = '';
        return;
    }

    // Adiciona T00:00:00 para neutralizar interferências de timezone no navegador
    const dataSelecionada = new Date(this.value + "T00:00:00");
    const diaDaSemana = dataSelecionada.getDay(); // 0=Dom, 1=Seg, ..., 6=Sáb

    // Se o dia da semana não estiver na lista de dias de trabalho do barbeiro
    if (!diasTrabalhoBarbeiro.includes(diaDaSemana)) {
        const nomesDias = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
        alert(`O profissional selecionado não atende em dias de ${nomesDias[diaDaSemana]}. Por favor, selecione outra data.`);
        this.value = ''; // Reseta o campo de data
    }
});