// ==========================================
// VERIFICAÇÃO DE SEGURANÇA (O CRACHÁ)
// ==========================================

// 1. Procuramos o crachá 'barbeiro_logado' na memória
const crachaTexto = localStorage.getItem('barbeiro_logado');

// 2. Se não existir, expulsa imediatamente!
if (!crachaTexto) {
    alert("⛔ Acesso negado! Por favor, faça o login primeiro.");
    window.location.href = 'login.html';
}

// 3. Se o código chegou aqui, é porque ele tem o crachá. 
// Transformamos o texto num objeto real do JavaScript.
const barbeiroLogado = JSON.parse(crachaTexto);


// ==========================================
// CONFIGURAÇÕES GERAIS E INTEGRAÇÃO (PYTHON)
// ==========================================
const BASE_URL = 'http://127.0.0.1:5000';

// 4. A MÁGICA: Agora usamos o ID real de quem fez login!
const ID_BARBEIRO = barbeiroLogado.id;


// ==========================================
// FUNÇÃO DE LOGOUT (Sair do sistema)
// ==========================================

function fazerLogout() {
    localStorage.removeItem('barbeiro_logado');
    window.location.href = 'login.html';
}

// ==========================================
// NAVEGAÇÃO DO MENU LATERAL (SISTEMA DE ABAS)
// ==========================================
// 1. Capturamos todos os links do menu e todas as seções (abas) da página
const linksMenu = document.querySelectorAll('#sidebar nav ul li a');
const secoes = document.querySelectorAll('#conteudo-principal section');
const itensLista = document.querySelectorAll('#sidebar nav ul li');

linksMenu.forEach(link => {
    link.addEventListener('click', function(evento) {
        // Se for o botão de sair, não tenta abrir uma aba, deixa o comportamento noraml
        if (this.getAttribute('id') === 'btn-sair') return;

        evento.preventDefault();

        // 1. esconde todas as abas
        secoes.forEach(secao => secao.style.display = 'none');

        // 2. Remove a classe 'ativo' de todos os <li> (Isto reseta a bolinha)
        itensLista.forEach(li => li.classList.remove('ativo'));

        // 3. Adiciona a classe 'ativo' APENAS no <li> pai do link clicado
        this.parentElement.classList.add('ativo');

        // 4. Mostra a aba correta
        const idAlvo = this.getAttribute('href').replace('#', 'secao-'); 
        const secaoAlvo = document.getElementById(idAlvo);
        if (secaoAlvo) {
            secaoAlvo.style.display = 'block';
        }
    });
});

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

const inputFiltroData = document.getElementById('filtro-data');
const inputFiltroStatus = document.getElementById('filtro-status');

// Variável para guardar os dias que o barbeiro trabalha
let diasTrabalhoBarbeiro = [];

// Assim que a página abre... (Agora é async!)
document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. BUSCAR A DISPONIBILIDADE ANTES DE MONTAR O CALENDÁRIO
    try {
        const respostaDisp = await fetch(`${BASE_URL}/api/barbeiros/${ID_BARBEIRO}/disponibilidade`);
        const dadosDisp = await respostaDisp.json();

        if (dadosDisp.sucesso) {
            // Guardamos os dias na nossa lista (ex: [1, 2, 3, 4, 5])
            diasTrabalhoBarbeiro = dadosDisp.disponibilidade.map(item => Number(item.dia_semana));
        }
    } catch (erro) {
        console.error("Erro ao buscar disponibilidade:", erro);
    }

    // ========================================================
    // O QUE MUDOU AQUI: Usamos o nosso componente do outro arquivo!
    // ========================================================
    // 2. INICIALIZA O FILTRO DE DATA
    criarComponenteData('filtro-data', diasTrabalhoBarbeiro);

    // 3. Carrega a agenda pela primeira vez
    carregarMinhaAgenda();

    carregarMeuPerfil();
});

// Se o barbeiro mudar o status no select, recarrega a lista
inputFiltroStatus.addEventListener('change', carregarMinhaAgenda);

async function carregarMinhaAgenda() {
    const listaAgendamentos = document.getElementById('lista-agendamentos');
    listaAgendamentos.innerHTML = '<p style="text-align: center; color: #666;">Carregando agenda...</p>';

    const dataFiltrada = inputFiltroData.value;
    const statusFiltrado = inputFiltroStatus.value;

    try {
        let url = `${BASE_URL}/api/barbeiros/${ID_BARBEIRO}/agendamentos?status=${statusFiltrado}`;
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
                        <p class='date'><i class="ph ph-calendar-blank"></i> ${dataBR}</p>
                        <p class='clock'><i class="ph ph-clock"></i> ${horaFormatada}</p>
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        ${ag.status === 'pendente' ? `
                            <button class="btn-concluir-agendamento" onclick="atualizarStatus(${ag.id}, 'concluido')">Concluir</button>
                            <button class="btn-cancelar-agendamento" onclick="abrirModalCancelar(${ag.id})">Cancelar</button>
                            ` : ''}
                
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

// Esta função faz exatamente o que a sua rota pede no botão de concluir e cancelar: envia o ID e o novo status.
async function atualizarStatus(idAgendamento, novoStatus) {
    try {
        const resposta = await fetch(`${BASE_URL}/api/agendamentos/${idAgendamento}/status`, {
            method: 'PUT', // O método que você definiu no Python!
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus }) // Envia 'concluido' ou 'cancelado'
        });
        
        const dados = await resposta.json();
        
        if (dados.sucesso) {
            carregarMinhaAgenda(); // Recarrega a tela para atualizar o visual
        } else {
            alert("Erro: " + dados.mensagem);
        }
    } catch (erro) { 
        console.error("Erro ao comunicar com a API:", erro); 
    }
}

// 1. A nossa memória (variável) para saber qual cliente cancelar
let idParaCancelar = null;

// 2. A função "Guarda-Costas" que o botão vermelho do cartão chama
function abrirModalCancelar(idAgendamento) {
    idParaCancelar = idAgendamento; // Guarda o ID na memória
    document.getElementById('modal-confirmacao').style.display = 'flex'; // Abre a tela preta
}

// 3. Se o barbeiro clicar em "Não, Voltar" no Modal
document.getElementById('btn-voltar-confirmacao').addEventListener('click', function() {
    document.getElementById('modal-confirmacao').style.display = 'none'; // Apenas esconde o modal
    idParaCancelar = null; // Limpa a memória por segurança
});

// 4. Se o barbeiro clicar em "Sim, Cancelar" no Modal
document.getElementById('btn-confirmar-cancelamento').addEventListener('click', function() {
    if (idParaCancelar !== null) {
        // Agora sim! O Modal chama a SUA função original, enviando o ID guardado e a palavra 'cancelado'
        atualizarStatus(idParaCancelar, 'cancelado');
        
        // Esconde o modal e limpa a memória
        document.getElementById('modal-confirmacao').style.display = 'none';
        idParaCancelar = null; 
    }
});

// ==========================================
// LÓGICA DO MODAL DE AGENDAMENTO MANUAL
// ==========================================

const modalAgendamento = document.getElementById('modal-agendamento');
const btnAbrirModal = document.getElementById('btn-abrir-modal-agendamento');
const btnFecharModal = document.getElementById('btn-fechar-modal');
const formAgendamento = document.getElementById('form-agendamento-manual');

// Se o botão de abrir existir na tela, configuramos os eventos
if (btnAbrirModal) {
    // 1. ABRIR MODAL
    btnAbrirModal.addEventListener('click', () => {
        modalAgendamento.style.display = 'flex';

        // Reseta o campo de hora sempre que o modal abre
        document.getElementById('manual-data').value = '';
        document.getElementById('manual-hora').innerHTML = '<option value="" disabled selected>Escolha uma data primeiro...</option>';
        document.getElementById('manual-hora').disabled = true;

        // Chamamos o componente de Data...
        // E dizemos a ele: "Quando mudarem a data, busca os horários livres!"
        criarComponenteData('manual-data', diasTrabalhoBarbeiro, function(dataEscolhida) {
            carregarHorariosDisponiveis(ID_BARBEIRO, dataEscolhida, 'manual-hora')
        })
    })

    // 2. FECHAR MODAL
    btnFecharModal.addEventListener('click', () => {
        modalAgendamento.style.display = 'none';
        formAgendamento.reset();
        
    });

    // 3. SALVAR NOVO AGENDAMENTO
    formAgendamento.addEventListener("submit", async function(evento) {
        evento.preventDefault();

        const nome = document.getElementById("manual-nome").value;
        const telefone = document.getElementById("manual-telefone").value;
        const data = document.getElementById("manual-data").value;
        const hora = document.getElementById("manual-hora").value;

        // Limpa a formatação do telefone para enviar só os números ao banco de dados
        const telefoneLimpo = telefone.replace(/\D/g, '');

        try {
            // Reutilizamos a mesma rota que o cliente usa no site público!
            const resposta = await fetch(BASE_URL + '/api/agendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: nome,
                    telefone, telefoneLimpo,
                    barbeiro_id: ID_BARBEIRO,
                    data: data,
                    hora: hora
                })
            });

            const dados = await resposta.json();

            if (dados.sucesso) {
                alert("✅ Agendamento marcado com sucesso!");
                modalAgendamento.style.display = 'none'; // Esconde a janela
                formAgendamento.reset(); // Limpa o formulário
                carregarMinhaAgenda(); // Recarrega os cartões na hora!
            } else {
                alert("❌ Erro: " + dados.mensagem);
            }
        } catch (erro) {
            console.error("Erro ao agendar:", erro);
            alert("Erro ao comunicar com o servidor.");
        }
    });
}

// =========================================================
// LÓGICA DA ABA: MEU PERFIL (DROPDOWN CUSTOMIZADO E HORÁRIOS)
// =========================================================
const selectDiasTrabalho = document.getElementById('select-dias-trabalho');
const containerHorarios = document.getElementById('container-horarios-dinamicos');
const dropdownHeader = document.getElementById('dropdown-dias-header');
const dropdownLista = document.getElementById('dropdown-dias-lista');
const dropdownTexto = document.getElementById('dropdown-dias-texto');
const itensDropdown = document.querySelectorAll('.dropdown-item');

const nomesDosDias = {
    0: 'Domingo', 1: 'Segunda-feira', 2: 'Terça-feira',
    3: 'Quarta-feira', 4: 'Quinta-feira', 5: 'Sexta-feira', 6: 'Sábado'
};

// ---------------------------------------------------------
// 1. INTELIGÊNCIA DA CAPA VISUAL (O DROPDOWN)
// ---------------------------------------------------------
if (dropdownHeader) {
    // Abre/Fecha a lista ao clicar na barra
    dropdownHeader.addEventListener('click', function(evento) {
        evento.stopPropagation();
        const estaAberto = dropdownLista.style.display === 'block';
        dropdownLista.style.display = estaAberto ? 'none' : 'block';
    });

    // Fecha a lista se clicar fora dela
    document.addEventListener('click', function(evento) {
        if (!dropdownHeader.contains(evento.target) && !dropdownLista.contains(evento.target)) {
            dropdownLista.style.display = 'none';
        }
    });

    // Ação ao escolher um dia na lista flutuante
    itensDropdown.forEach(item => {
        item.addEventListener('click', function() {
            const valorDia = this.getAttribute('data-valor');
            this.classList.toggle('selecionado'); // Liga/Desliga a cor visual

            // Comunica a escolha ao <select> escondido
            const opcaoEscondida = Array.from(selectDiasTrabalho.options).find(opt => opt.value === valorDia);
            if (opcaoEscondida) {
                opcaoEscondida.selected = this.classList.contains('selecionado');
            }


            
            // Grita para o sistema que houve mudança para desenhar as caixinhas!
            selectDiasTrabalho.dispatchEvent(new Event('change'));
        });
    });
}



// ---------------------------------------------------------
// 2. GERAÇÃO DINÂMICA DAS CAIXAS DE HORA (COM FLATPICKR)
// ---------------------------------------------------------
if (selectDiasTrabalho) {
    selectDiasTrabalho.addEventListener('change', function() {
        const opcoesSelecionadas = Array.from(this.selectedOptions).map(opcao => opcao.value);

        for (let i = 0; i <= 6; i++) {
            const diaId = String(i);
            const linhaExiste = document.getElementById(`linha-dia-${diaId}`);

            // SE O DIA ESTÁ SELECIONADO...
            if (opcoesSelecionadas.includes(diaId)) {
                if (!linhaExiste) {
                    // Cria a caixinha do zero
                    const linhaHorario = document.createElement('div');
                    linhaHorario.classList.add('linha-horario-dinamico'); 
                    linhaHorario.id = `linha-dia-${diaId}`;
                    
                    // AMBOS os inputs agora são type="text" para o Flatpickr funcionar perfeitamente
                    linhaHorario.innerHTML = `
                        <span class="nome-dia-dinamico">${nomesDosDias[diaId]}</span>
                        <div class="controles-hora-dinamico">
                            <input type="text" id="inicio-dia-${diaId}" placeholder="00:00" required>
                            <span>às</span>
                            <input type="text" id="fim-dia-${diaId}" placeholder="00:00" required>
                        </div>
                    `;
                    containerHorarios.appendChild(linhaHorario);

                    // Ativa o Flatpickr nos novos inputs
                    const configFlatpickr = {
                        enableTime: true,
                        noCalendar: true,
                        dateFormat: "H:i",
                        time_24hr: true,
                        disableMobile: "true"
                    };

                    flatpickr(`#inicio-dia-${diaId}`, configFlatpickr);
                    flatpickr(`#fim-dia-${diaId}`, configFlatpickr);
                    
                } else {
                    // A linha já existia, apenas volta a aparecer
                    linhaExiste.style.display = 'flex';
                }
            } 
            // SE O DIA FOI DESMARCADO...
            else {
                if (linhaExiste) {
                    linhaExiste.style.display = 'none';
                }
            }
        }
    });
}

// ==========================================
// FUNÇÃO AJUDANTE: PREENCHER OS DIAS NO NOVO MENU (VERSÃO ROTA 7)
// ==========================================
function preencherDiasNoMenuCustomizado(disponibilidadeDoBanco) {
    // 1. Encontra os nossos elementos na tela
    const selectOriginal = document.getElementById('select-dias-trabalho');
    if (!selectOriginal) return; // Sai em segurança se não achar o HTML

    const container = selectOriginal.parentElement;
    const header = container.querySelector('.select-falso-header');
    const lis = container.querySelectorAll('.select-falso-lista li');

    // 2. Limpeza Geral: Começamos com uma "folha em branco"
    Array.from(selectOriginal.options).forEach(opt => opt.selected = false);
    if (lis) lis.forEach(li => li.classList.remove('item-selecionado'));

    // 3. Se não houver dados, ajusta o texto e sai
    if (!disponibilidadeDoBanco || disponibilidadeDoBanco.length === 0) {
        if (header) header.textContent = "Selecione os dias...";
        return;
    }

    // 4. O EXTRATOR (A Mágica para a sua Rota 7):
    // Transforma [{dia_semana: 1, ...}, {dia_semana: 2, ...}] numa lista simples ["1", "2"]
    let arrayDias = [];
    if (Array.isArray(disponibilidadeDoBanco)) {
        // O .map() percorre cada item da lista e extrai apenas a propriedade 'dia_semana'
        arrayDias = disponibilidadeDoBanco.map(item => String(item.dia_semana));
    }

    // 5. O Pintor: Lê a nossa lista limpa e pinta o Menu
    let quantidadeSelecionada = 0;

    Array.from(selectOriginal.options).forEach((opt, index) => {
        // Verifica se o valor da opção (ex: "1") está dentro da nossa lista extraída
        if (arrayDias.includes(String(opt.value))) {
            
            opt.selected = true; // Marca no Cérebro (Select Original)
            
            // Pinta de azul o item na tela
            if (lis[index]) {
                lis[index].classList.add('item-selecionado');
            }
            quantidadeSelecionada++; // Aumenta a contagem
        }
    });

    // 6. Atualiza o texto da nossa caixa (Header) com o total
    if (quantidadeSelecionada === 0) {
        if (header) header.textContent = "Selecione os dias...";
    } else if (quantidadeSelecionada === 1) {
        if (header) header.textContent = "1 dia selecionado";
    } else {
        if (header) header.textContent = `${quantidadeSelecionada} dias selecionados`;
    }
}

// 2. FUNÇÃO QUE CARREGA OS DADOS DO BANCO AO ABRIR O PERFIL
async function carregarMeuPerfil() {
    try {
        // Aproveitamos a rota que já criamos para a "Agenda"
        const resposta = await fetch(`${BASE_URL}/api/barbeiros/${ID_BARBEIRO}/disponibilidade`);
        const dados = await resposta.json();

        if (dados.sucesso) {
            const disponibilidadeSalva = dados.disponibilidade;
            preencherDiasNoMenuCustomizado(disponibilidadeSalva);
            // Passo A: extrair apenas os números dos dias que vieram do banco
            const diasParaSelecionar = disponibilidadeSalva.map(item => String(item.dia_semana));

            // Passo B: Percorrer as opções do <select> e marcar como "selected" as que vieram do banco
            // Seleciona as opções corretas no Menu Escondido e Pinta a Capa Visual
            Array.from(selectDiasTrabalho.options).forEach(opcao => {
                const itemVisual = document.querySelector(`.dropdown-item[data-valor="${opcao.value}"]`);
                if (diasParaSelecionar.includes(opcao.value)) {
                    opcao.selected = true;
                    if (itemVisual) itemVisual.classList.add('selecionado');
                } else {
                    opcao.selected = false;
                    if (itemVisual) itemVisual.classList.remove('selecionado');
                }
            });
            


            // Passo C: Disparar manualmente o evento 'change' para que o JavaScript desenhe as caixas de hora na tela
            selectDiasTrabalho.dispatchEvent(new Event('change'));

            // Passo D: Agora que as caixas foram desenhadas, preenchemos os valores lá dentro!
            disponibilidadeSalva.forEach(item => {
                const diaId = String(item.dia_semana);
                const inputInicio = document.getElementById(`inicio-dia-${diaId}`);
                const inputFim = document.getElementById(`fim-dia-${diaId}`);

                if (inputInicio && inputFim) {
                    // O slice(0, 5) corta os segundos do banco de dados ("09:00:00" e vira "09:00")
                    inputInicio.value = item.hora_inicio.slice(0, 5)
                    inputFim.value = item.hora_fim.slice(0, 5)
                }
            });
        }
    } catch (erro) {
        console.error("Erro ao carregar os dados do perfil:", erro)
    }
};


// ==========================================
// SALVAR APENAS A DISPONIBILIDADE (HORÁRIOS)
// ==========================================
const btnSalvarPerfil = document.getElementById('btn-salvar-perfil');

if (btnSalvarPerfil) {
    btnSalvarPerfil.addEventListener('click', async function() {
        
        // 1. Coletamos APENAS os dias que estão selecionados no <select>
        const opcoesSelecionadas = Array.from(selectDiasTrabalho.selectedOptions).map(opcao => opcao.value);
        const novaDisponibilidade = [];

        // 2. Verificamos os horários de cada dia selecionado
        for (let dia of opcoesSelecionadas) {
            const inicio = document.getElementById(`inicio-dia-${dia}`).value;
            const fim = document.getElementById(`fim-dia-${dia}`).value;

            // Validação: Se marcou o dia, é obrigatório colocar a hora
            if (!inicio || !fim) {
                const nomeDoDia = nomesDosDias[dia];
                alert(`⚠️ Atenção: Preencha o horário de início e fim para ${nomeDoDia}, ou desmarque este dia.`);
                return; // O 'return' cancela a gravação e para o código aqui
            }

            // Guardamos os dados validados na nossa lista
            novaDisponibilidade.push({
                dia_semana: dia,
                hora_inicio: inicio,
                hora_fim: fim
            });
        }

        // 3. Mudamos o botão para dar feedback visual
        const textoOriginal = btnSalvarPerfil.textContent;
        btnSalvarPerfil.textContent = 'A guardar os horários...';
        btnSalvarPerfil.disabled = true;

        try {
            // 4. Enviamos o pacote APENAS com a lista de disponibilidade para o Python
            const resposta = await fetch(`${BASE_URL}/api/barbeiros/${ID_BARBEIRO}/perfil`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    disponibilidade: novaDisponibilidade
                })
            });

            const dados = await resposta.json();

            if (dados.sucesso) {
                alert("✅ Horários atualizados com sucesso!");
            } else {
                alert("❌ Erro ao guardar: " + dados.mensagem);
            }
        } catch (erro) {
            console.error("Erro ao salvar horários:", erro);
            alert("Erro de comunicação com o servidor.");
        } finally {
            // Restaura o botão ao normal, independentemente de dar erro ou sucesso
            btnSalvarPerfil.textContent = textoOriginal;
            btnSalvarPerfil.disabled = false;
        }
    });
}




