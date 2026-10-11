// ==========================================
// COMPONENTE GLOBAL: MÁSCARA DE TELEFONE
// ==========================================

// Este evento garante que o script só roda depois que o HTML inteiro foi carregado
document.addEventListener('DOMContentLoaded', function() {
    
    // Procura TODOS os inputs do tipo "tel" na página (seja 1 ou 10 campos!)
    const camposTelefone = document.querySelectorAll('input[type="tel"]');

    // Para cada campo encontrado, aplicamos a regra da máscara
    camposTelefone.forEach(function(inputTelefone) {
        
        inputTelefone.addEventListener('input', function(evento) {
            // 1. Remove tudo o que não é número
            let valor = evento.target.value.replace(/\D/g, '');
            
            // 2. Limita a 11 dígitos máximos (DDD + 9 números)
            if (valor.length > 11) valor = valor.slice(0, 11);
            
            // 3. Aplica a formatação visual (XX) XXXXX-XXXX
            if (valor.length > 2) {
                valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2');
            }
            if (valor.length > 9) {
                valor = valor.replace(/(\d{5})(\d)/, '$1-$2'); // Para telemóveis (9 dígitos)
            } else if (valor.length > 8) {
                valor = valor.replace(/(\d{4})(\d)/, '$1-$2'); // Para telefones fixos (8 dígitos)
            }
            
            evento.target.value = valor;
        });
    });
});