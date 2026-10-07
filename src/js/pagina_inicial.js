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

// 2. Para cada link do menu, adicionamos um "ouvinte" de cliques
linksMenu.forEach(link => {
    link.addEventListener('click', function(evento) {

        // Evita que a página recarregue ou dê um pulo para o topo
        evento.preventDefault();

        // Passo A: Esconde todas as abas da tela
        secoes.forEach(secao => secao.style.display = 'none');

        // Passo B: Remove a cor de destaque de todos os botões do menu
        linksMenu.forEach(l => l.classList.remove('ativo'));

        // Passo C: Coloca a cor de destaque APENAS no botão que acabou de ser clicado
        this.classList.add('ativo');

        // Passo D: Descobre qual aba abrir
        // O this.getAttribute('href') pega o "#perfil" e o replace transforma em "secao-perfil"
        const idAlvo = this.getAttribute('href').replace('#', 'secao-');

        // Passo E:
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

            atualizarTextoDropdown();
            
            // Grita para o sistema que houve mudança para desenhar as caixinhas!
            selectDiasTrabalho.dispatchEvent(new Event('change'));
        });
    });
}

function atualizarTextoDropdown() {
    const selecionados = Array.from(selectDiasTrabalho.selectedOptions);
    if (selecionados.length === 0) {
        dropdownTexto.textContent = "Selecione os dias...";
        dropdownTexto.classList.remove('texto-ativo');
    } else if (selecionados.length === 1) {
        dropdownTexto.textContent = selecionados[0].textContent;
        dropdownTexto.classList.add('texto-ativo');
    } else {
        dropdownTexto.textContent = `${selecionados.length} dias selecionados`;
        dropdownTexto.classList.add('texto-ativo');
    }
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

// 2. FUNÇÃO QUE CARREGA OS DADOS DO BANCO AO ABRIR O PERFIL
async function carregarMeuPerfil() {
    try {
        // Aproveitamos a rota que já criamos para a "Agenda"
        const resposta = await fetch(`${BASE_URL}/api/barbeiros/${ID_BARBEIRO}/disponibilidade`);
        const dados = await resposta.json();

        if (dados.sucesso) {
            const disponibilidadeSalva = dados.disponibilidade;
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
            
            // Atualiza a barra de texto (ex: "5 dias selecionados")
            atualizarTextoDropdown();

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

// Função auxiliar para mudar o texto da barra dependendo de quantos dias escolheu
function atualizarTextoDropdown() {
    const selecionados = Array.from(selectDiasTrabalho.selectedOptions);

    if (selecionados.length === 0) {
        // 1. Cenário Vazio: Texto padrão e removemos o estilo de destaque
        dropdownTexto.textContent = "Selecione os dias...";
        dropdownTexto.classList.remove('texto-ativo');
    } else if (selecionados.length === 1) {
        // 2. Cenário 1 Dia: Mostra o nome do dia e adiciona o estilo de destaque
        dropdownTexto.textContent = selecionados[0].textContent;
        dropdownTexto.classList.add('texto-ativo');
    } else {
        // 3. Cenário Vários Dias: Mostra a contagem e adiciona o estilo de destque
        dropdownTexto.textContent = `${selecionados.length} dias selecionados`;
        dropdownTexto.classList.add('texto-ativo');
    }
}

