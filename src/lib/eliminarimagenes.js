const fs = require('fs').promises;
const path = require('path');

async function eliminarImagenesNoUtilizadas(dbImagePaths, imageFolder) {
    try {
        const files = await fs.readdir(imageFolder);

        for (const file of files) {
            const filePath = path.join(imageFolder, file);
            const imagePath = `/imagenes/${file}`; // Ruta en el mismo formato que dbImagePaths

            // Compara las rutas de imagen en dbImagePaths con la ruta actual
            if (!dbImagePaths.includes(imagePath)) {
                await fs.unlink(filePath);
                console.log('Imagen eliminada:', filePath);
            }
        }
    } catch (error) {
        console.error('Error al eliminar imágenes:', error);
    }
}
module.exports = eliminarImagenesNoUtilizadas;
