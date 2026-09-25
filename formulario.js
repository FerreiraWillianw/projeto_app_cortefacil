const formulario = document.getElementById('formulario');

// Função para verificar se o valor contém apenas letras e espaços (Validação para campo Nome)

function isValidName(string) {
    for(let index = 0; index < string.length; index++) {
        let char = string[index];

        if (
            !(
                
                (char >= "A" && char <= "Z") || 
                (char >= "a" && char <= "z") || 
                char === " "
              )
            ) {
            return false;
        }
    }

    return true;
}


// Função para validar CPF (11 dígitos numéricos)

function isValidCPF(cpf) {
    return cpf.length === 11 && !isNaN(cpf);
}

// Função para validar o telefone (11 dígitos numéricos)

function isValidPhone(phone) {
    return phone.length === 11 && !isNaN(phone);
}


// Função para validar CEP
function isValidCEP(cep) {
    return cep.length === 8 && !isNaN(cep);
}

// Função pra validar estado
function isValidState(state) {
    return (
        state.length === 2 && state[0] >= "A" && state[0] <= "Z" && state[1] >= "A" && state[1] <= "Z"
    );
}

// Função para realizar validações

function validarEGuardarFormulario(evento) {
    evento.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const cpf = document.getElementById("cpf").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const cep = document.getElementById("cep").value.trim();
    const rua = document.getElementById("rua").value.trim();
    const numero = document.getElementById("numero").value.trim();
    const complemento = document.getElementById("complemento").value.trim();
    const bairro = document.getElementById("bairro").value.trim();
    const cidade = document.getElementById("cidade").value.trim();
    const estado = document.getElementById("estado").value.trim();

    // Verificação se todos os campos estão preenchidos
    if (!nome || !cpf || !telefone || !cep || !rua|| !numero || !complemento || !bairro || !cidade || !estado) {
        alert("Por favor, preencha todos os campos");
        return;
    }

    if (!isValidName(nome)) {
        alert("O nome deve conter apenas letras e espaços.");
        return;
    }

    if(!isValidCPF(cpf)) {
        alert("O CPF deve conter 11 dígitos numéricos.");
        return;
    }

    if(!isValidPhone(telefone)) {
        alert("O Telefone deve conter 11 dígitos numéricos.");
        return;
    }

    if(!isValidCEP(cep)) {
        alert("O CEP deve conter 8 dígitos numéricos.");
        return;
    }

    if(!isValidState(estado)) {
        alert("O estado deve ser uma sigla de letras maiúsculas. ");
        return;
    }

    // Se tudo estiver correto, salvar os dados no locaStorage
    const dadosFormulario = {
        nome,
        cpf,
        telefone,
        cep,
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        estado
    };

    localStorage.setItem("dadosFormulario", JSON.stringify(dadosFormulario));
    formulario.reset();
    alert("Dados salvos com sucesso!");
    
}



formulario.addEventListener('submit', validarEGuardarFormulario)