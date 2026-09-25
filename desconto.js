// Função para alterar a exibição do formulário de cupom

function toggleDiscount() {
    const discountBody = document.getElementById("apply-discount-body");
    const icon = document.getElementById("toggle-icon");

    // Alternar a visibilidade do formulário de desconto
    if (
        discountBody.style.display === "none" ||
        discountBody.style.display === ""
    ) {
        discountBody.style.display = "block";
        icon.classList.add("bx-chevron-up")
        icon.classList.remove("bx-chevron-down")
    } else {
        discountBody.style.display = "none";
        icon.classList.add("bx-chevron-down");
        icon.classList.remove("bx-chevron-up");
    }
}

const discountCupons = {
    DESCONTO10: 0.1,
    DESCONTO20: 0.2,
    DESCONTO50: 0.5
}

// Função para aplicar desconto

function applyDiscount() {
    const discountCode = document.getElementById("discount-code").value.trim().toUpperCase();
    const discountMessageElement = document.getElementById("discount-message");
    const totalPriceElement = document.getElementById("total-price");

    // Verificar se p cupom de desconto é válido
    if (discountCupons[discountCode]) {
        const discount = discountCupons[discountCode];
        const originalPrice = 1200;
        const discountedPrice = originalPrice * (1 - discount);

        totalPriceElement.innerText = `Preço Total: R$ ${discountedPrice.toFixed(2)}`;

        // Armazenar o cupom no localStorage
        localStorage.setItem("discount", discountCode);

        // Exibir a mensagem de desconto
        discountMessageElement.style.color = "green";
        discountMessageElement.innerText = `Desconto de ${discountCode} aplicado!`;

        // Limpar o campo de input
        document.getElementById("discount-code").value = '';

    } else {
        // Se o desconto não for válido
        // Limpar a mensagem

        discountMessageElement.style.color = "red";
        discountMessageElement.innerText = "Cupom Inválido";

    }
}   

function checkStoredDiscount() {
    const storedDiscount = localStorage.getItem("discount");
    const discountMessageElement = document.getElementById("discount-message");

    // Verificar se há cupom no localStorage

    if(storedDiscount) {
        localStorage.removeItem("discount");
    }

    discountMessageElement.innerText = "";
}

window.onload = checkStoredDiscount;