
const request = require('supertest');
const app = require('../index.js');
const cheerio = require('cheerio');
const bcrypt = require('bcryptjs');
const helpers = require('../lib/helpers');
const storage = require('../multer.js');

// Espía la función de console.log para evitar su ejecución durante las pruebas
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

describe('Pruebas de rutas', () => {
    afterAll(() => {
        // Restaura la función original de console.log al final de las pruebas
        consoleLogSpy.mockRestore();
    });


    //prueba unitara  verifica que la ruta /Productos/inicio devuelva una vista html
    it('Debe verificar la existencia de la ruta /Productos/inicio', async () => {
        const response = await request(app).get('/Productos/inicio');
        expect(response.status).toBe(200);
        expect(response.type).toBe('text/html');
    });



    //prueba unitara  verifica que la ruta /Productos/productoview/13 devuelva una vista html
    it('debería verificar si la ruta devuelve HTML', async () => {
        const response = await request(app).get('/Productos/productoview/13');
        expect(response.status).toBe(200); // Verifica que la solicitud se completó con éxito
        expect(response.type).toBe('text/html'); // Verifica que el tipo de contenido sea HTML
    });



    //prueba unitaria de signin verifica que la ruta /signin devuelva una vista html 
    it('Debe verificar la existencia de la ruta /signin', async () => {
        const response = await request(app).get('/signin');
        expect(response.status).toBe(200);
        expect(response.type).toBe('text/html');
    });

    //prueba unitaria de signin verifica que la ruta /signup devuelva una vista html 
    it('Debe verificar la existencia de la ruta /signup', async () => {
        const response = await request(app).get('/signup');
        expect(response.status).toBe(200);
        expect(response.type).toBe('text/html');
    });

});


jest.mock('bcryptjs', () => ({
    genSalt: jest.fn(),
    hash: jest.fn(),
}));


describe('helpers.encryptPassword', () => {
    it('should encrypt the password', async () => {
        // Configurar el comportamiento esperado para genSalt y hash
        bcrypt.genSalt.mockResolvedValue('mocked-salt');
        bcrypt.hash.mockResolvedValue('mocked-hash');
        // Llamar a la función encryptPassword con una contraseña ficticia
        const result = await helpers.encrypyPassword('fake-password');
        // Verificar que genSalt y hash hayan sido llamados correctamente
        expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
        expect(bcrypt.hash).toHaveBeenCalledWith('fake-password', 'mocked-salt');
        // Verificar que el resultado sea el hash esperado
        expect(result).toBe('mocked-hash');
    });
});









