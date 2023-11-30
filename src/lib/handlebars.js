const Handlebars = require('handlebars');

// Registra el ayudante 'eq'
Handlebars.registerHelper('eq', function (a, b, options) {
    return a === b ? options.fn(this) : options.inverse(this);
});


// Agrega esta función en tu código
Handlebars.registerHelper('formatCurrency', function (amount) {
    // Puedes personalizar esta lógica según tu preferencia
    const formattedAmount = parseFloat(amount).toFixed(2);
    return `S/.${formattedAmount}`;
});
