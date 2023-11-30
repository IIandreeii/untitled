document.addEventListener('DOMContentLoaded', function () {
    const editProductForm = document.getElementById('editProductForm');

    // Verificar si editProductForm es null antes de agregar el evento
    if (editProductForm) {
        editProductForm.addEventListener('submit', function (event) {
            const stockInput = editProductForm.querySelector('input[name="stock"]');
            const precioInput = editProductForm.querySelector('input[name="precio"]');

            if (!/^[1-9]\d*$/.test(stockInput.value)) {
                alert("La cantidad del producto en Stock debe ser un número positivo.");
                event.preventDefault(); // Evitar que se envíe el formulario
            }
            if (!/^[1-9]\d*$/.test(precioInput.value)) {
                alert("El precio del producto debe ser un número positivo.");
                event.preventDefault(); // Evitar que se envíe el formulario
            }
        });
    } else {
        console.error("No se encontró el elemento con el ID 'editProductForm'. La función no se iniciará.");
    }
});




