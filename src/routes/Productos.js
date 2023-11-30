
const express = require('express');
const router = express.Router();
const multer = require('multer');
const pool = require('../database');
const storage = require('../multer');
const uploader = multer({ storage });
const eliminarImagenesNoUtilizadas = require('../lib/eliminarImagenes');
const path = require('path');
const { isAdmin } = require('../lib/auth');
const { isLogin } = require('../lib/auth');



router.get('/add', isAdmin, (req, res) => {
    res.render('Products/add');
});




router.get('/', isAdmin, async (req, res) => {
    const itemsPerPage = 10;
    let currentPage = parseInt(req.query.page, 10) || 1;
    if (isNaN(currentPage) || currentPage < 1) {
        currentPage = 1;
    }
    const offset = (currentPage - 1) * itemsPerPage;
    const totalProducts = await pool.query('SELECT COUNT(*) as count FROM products where id_categoria =1');
    const totalCount = totalProducts[0].count;
    const products = await pool.query(`SELECT * FROM products WHERE id_categoria = 1 ORDER BY id DESC LIMIT ${itemsPerPage} OFFSET ${offset}`);

    res.render('Products/Productos', {
        productos: products,
        currentPage: currentPage,
        totalPages: Math.ceil(totalCount / itemsPerPage),
    });
});


router.get('/inicio', async (req, res) => {
    const itemsPerPage = 48; // Número de productos por página
    let currentPage = parseInt(req.query.page, 10) || 1; // Página actual, se obtiene de la consulta
    // Asegurarse de que currentPage sea un número válido y esté en un rango adecuado
    if (isNaN(currentPage) || currentPage < 1) {
        currentPage = 1;
    }
    const offset = (currentPage - 1) * itemsPerPage;
    const totalProducts = await pool.query('SELECT COUNT(*) as count FROM products where id_categoria =1');
    const totalCount = totalProducts[0].count;
    const products = await pool.query(`SELECT * FROM products WHERE id_categoria = 1 ORDER BY id DESC LIMIT ${itemsPerPage} OFFSET ${offset}`);
    res.render('Products/inicio', {
        inicio: products,
        currentPage: currentPage,
        totalPages: Math.ceil(totalCount / itemsPerPage),
    });
});



router.post('/add', uploader.single('url'), isAdmin, async (req, res) => {
    const { nombre, stock, descripcion, precio, id_categoria } = req.body;
    const { file } = req;
    let img = ''; // Inicializa la variable de imagen
    // Verifica si se proporcionó un archivo en la solicitud
    if (file && file.filename) {
        img = `/imagenes/${file.filename}`;
    }
    const newProduct = {
        nombre,
        stock,
        descripcion,
        precio,
        img,
        id_categoria
    };
    try {
        // Insertar el producto en la base de datos
        await pool.query('INSERT INTO products SET ?', [newProduct]);
        req.flash('success', 'Producto Agregado correctamente');
        // Obtén las rutas de imágenes de la base de datos
        const results = await pool.query('SELECT img FROM products');
        // Extraer las rutas de imágenes utilizando un bucle for
        const dbImagePaths = results.map(result => result.img);
        // Ruta a la carpeta de imágenes en tu servidor
        const imageFolder = path.join(__dirname, '..', 'public', 'imagenes');
        // Ejecuta la función para eliminar imágenes no utilizadas
        await eliminarImagenesNoUtilizadas(dbImagePaths, imageFolder);
        res.redirect('/Productos');
    } catch (error) {
        console.error('Error al insertar en la base de datos:', error);
        res.status(500).send('Error al insertar en la base de datos');
    }
});





router.get('/delete/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE ID = ?', [id]);
    req.flash('success', 'Producto eliminado correctamente')
    res.redirect('/Productos')
});

router.get('/edit/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const productos = await pool.query('select * from products where id= ?', [id]);
    res.render('Products/edit', { productos: productos[0] });

});


router.post('/edit/:id', uploader.single('url'), isAdmin, async (req, res) => {
    const { id } = req.params;
    const { nombre, stock, descripcion, precio } = req.body;
    const { file } = req;


    if (file && file.filename) {
        const img = `/imagenes/${file.filename}`;
        const Productmodi = {
            nombre,
            stock,
            descripcion,
            precio,
            img
        };
        await pool.query('UPDATE products set ? WHERE id = ?', [Productmodi, id]);
        req.flash('success', 'Producto actualizado Correctamente');
        res.redirect('/Productos');
    } else {

        req.flash('message', 'El producto no se actualizo Debes proporcionar una imagen');
        res.redirect('/Productos');
    }
});


router.post('/carrito', isLogin, async (req, res) => {
    const { product_id, cantidad } = req.body;
    const user_Id = req.user.id;
    try {
        const existingCartItem = await pool.query('SELECT * FROM carrito WHERE user_Id = ? AND product_id = ?', [user_Id, product_id]);
        if (existingCartItem.length > 0) {
            await pool.query('UPDATE carrito SET quantity = quantity + ? WHERE user_Id = ? AND product_id = ?', [cantidad, user_Id, product_id]);
        } else {
            await pool.query('INSERT INTO carrito (user_Id, product_id, quantity) VALUES (?, ?, ?)', [user_Id, product_id, cantidad]);
        }
        req.flash('success', 'Producto agregado al carrito');
        res.redirect('/Productos/inicio');
    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        req.flash('message', 'Error al agregar el producto al carrito');
        res.redirect('/Productos/inicio');
    }
});




router.get('/productoview/:id', async (req, res) => {

    const { id } = req.params;
    const productos = await pool.query('select * from products where id= ?', [id]);
    res.render('Products/productview', { productos: productos });
});



router.get('/uscarrito', isLogin, async (req, res) => {
    const user_Id = req.user.id;
    const productos = await pool.query('SELECT products.Nombre, products.img, products.precio, carrito.quantity,carrito.idcarrito,products.id FROM carrito INNER JOIN products ON carrito.product_id = products.id WHERE user_id = ? and idestado=1', user_Id);
    let totalCarrito = 0;


    productos.forEach((producto) => {

        producto.totalProducto = producto.quantity * producto.precio;

        totalCarrito += producto.totalProducto;
    });
    res.render('Products/carrito', { productos: productos, totalCarrito: totalCarrito });
});


// Ruta para actualizar la cantidad
router.post('/actualizarcarrito', isLogin, async (req, res) => {
    const { quantity, id } = req.body;
    try {

        await pool.query('START TRANSACTION');

        const quantities = Array.isArray(quantity) ? quantity : [quantity];
        const ids = Array.isArray(id) ? id : [id];

        for (let i = 0; i < quantities.length; i++) {
            const carritoId = ids[i];
            const nuevaCantidad = quantities[i];
            await pool.query('UPDATE carrito SET quantity = ? WHERE idcarrito = ?', [nuevaCantidad, carritoId]);
        }


        await pool.query('COMMIT');


        res.redirect('/Productos/uscarrito');
    } catch (error) {

        await pool.query('ROLLBACK');
        console.error('Error al actualizar la cantidad:', error);
        req.flash('message', 'Error al actualizar la cantidad del producto');
        res.redirect('/Productos/uscarrito');
    }
});


router.get('/carritodelete/:id', isLogin, async (req, res) => {
    const { id } = req.params;
    console.log(id)
    await pool.query('DELETE FROM carrito WHERE idcarrito = ?', [id]);
    req.flash('success', 'Producto eliminado correctamente')
    res.redirect('/Productos/uscarrito')
});


router.get('/about', async (req, res) => {
    res.render('auth/about');
});

router.get('/contact', async (req, res) => {
    res.render('auth/contact');
});

router.get('/services', isAdmin, async (req, res) => {
    const services = await pool.query('SELECT * FROM products where id_categoria =2');

    res.render('Products/servicios', { services });
});

router.get('/servicess', async (req, res) => {
    const services = await pool.query('SELECT * FROM products where id_categoria =2');

    res.render('Products/servicios2', { services });
});


router.post('/pagos', isLogin, async (req, res) => {
    const user_Id = req.user.id;
    const { idcarrito, subtotal } = req.body;
    try {
        await pool.query('START TRANSACTION');
        const subtotales = Array.isArray(subtotal) ? subtotal : [subtotal];
        const carritoids = Array.isArray(idcarrito) ? idcarrito : [idcarrito];
        for (let i = 0; i < subtotales.length; i++) {
            const carritoidss = carritoids[i];
            const subtotaless = subtotales[i];

            const existingPedido = await pool.query(
                'SELECT * FROM pedido WHERE id_carrito = ? AND id_user = ?',
                [carritoidss, user_Id]
            );
            if (existingPedido.length > 0) {

                await pool.query(
                    'UPDATE pedido SET subtotal = ? WHERE id_carrito = ? AND id_user = ?',
                    [subtotaless, carritoidss, user_Id]
                );
            } else {

                await pool.query(
                    'INSERT INTO pedido (id_carrito, id_user, subtotal) VALUES (?, ?, ?)',
                    [carritoidss, user_Id, subtotaless]
                );
            }
        }
        await pool.query('COMMIT');
        req.flash('success', 'Pago en proceso Espera confirmacion');
        res.redirect('/Productos/uscarrito');

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error al insertar en la base de datos:', error);
        req.flash('message', 'Error al insertar en la base de datos');
        res.redirect('/Productos/uscarrito');
    }
});


router.get('/admipagos', isAdmin, async (req, res) => {
    try {
        const pedidos = await pool.query(`
        SELECT
        u.id AS idUsuario,
        u.Nombre AS NombreUsuario,
        u.Apellido,
        u.DNI,
        c.idcarrito,
        c.quantity,
        p.subtotal,
        t.id AS idProducto,
        t.Nombre AS NombreProducto,
        t.img,
        t.precio
    FROM
        users u
    LEFT JOIN
        pedido p ON u.id = p.id_user
    LEFT JOIN
        carrito c ON p.id_carrito = c.idcarrito
    LEFT JOIN
        products t ON c.product_id = t.id
    WHERE
        c.idestado = 1
    ORDER BY
        u.id;  
        `);
        const pedidosAgrupados = {};
        pedidos.forEach(pedido => {
            const idUsuario = pedido.idUsuario; // Ajusta esto según la propiedad real del ID de usuario
            if (!pedidosAgrupados[idUsuario]) {
                pedidosAgrupados[idUsuario] = {
                    usuario: pedido.NombreUsuario,
                    pedidos: [],
                    subtotal: 0,
                };
            }
            pedidosAgrupados[idUsuario].pedidos.push(pedido);
            pedidosAgrupados[idUsuario].subtotal += pedido.subtotal;
        });


        const pedidosAgrupadosArray = Object.values(pedidosAgrupados);
        console.log(pedidos);
        res.render('pagos/admipagos', { pedidos: pedidosAgrupadosArray });
    } catch (error) {
        console.error('Error al obtener los datos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


router.post('/ConfirmaciondePago', isAdmin, async (req, res) => {

    const { productid, cantidad, idcarrito } = req.body
    try {

        await pool.query('START TRANSACTION');

        const productids = Array.isArray(productid) ? productid : [productid];
        const cantidads = Array.isArray(cantidad) ? cantidad : [cantidad];
        const idcarritos = Array.isArray(idcarrito) ? idcarrito : [idcarrito];

        for (let i = 0; i < cantidads.length; i++) {
            const productidss = productids[i];
            const cantidadss = cantidads[i];
            const idcarritoss = idcarritos[i];
            await pool.query('UPDATE products set stock = stock - ? WHERE id = ?', [cantidadss, productidss]);
            await pool.query('UPDATE carrito set idestado = ? WHERE idcarrito = ?', [2, idcarritoss]);
        }

        await pool.query('COMMIT');

        res.redirect('/Productos/uscarrito');
        req.flash('success', 'Error al actualizar la cantidad del producto');
    } catch (error) {
        // Revierte la transacción en caso de error
        await pool.query('ROLLBACK');
        console.error('Error al actualizar la cantidad:', error);
        req.flash('message', 'Error al actualizar la cantidad del producto');
        res.redirect('/Productos/uscarrito');
    }
});


router.get('/pagosconf', isAdmin, async (req, res) => {
    try {
        const pedidos = await pool.query(`
            SELECT
                u.id AS idUsuario,
                u.Nombre AS NombreUsuario,
                u.Apellido,
                u.DNI,
                c.idcarrito,
                c.quantity,
                p.subtotal,
                t.id AS idProducto,
                t.Nombre AS NombreProducto,
                t.img,
                t.precio
            FROM
                users u
            LEFT JOIN
                pedido p ON u.id = p.id_user
            LEFT JOIN
                carrito c ON p.id_carrito = c.idcarrito
            LEFT JOIN
                products t ON c.product_id = t.id
            WHERE
                c.idestado = 2
            ORDER BY
                u.id;  
        `);

        const pedidosAgrupados = {};
        pedidos.forEach(pedido => {
            const idUsuario = pedido.idUsuario; // Ajusta esto según la propiedad real del ID de usuario
            if (!pedidosAgrupados[idUsuario]) {
                pedidosAgrupados[idUsuario] = {
                    usuario: pedido.NombreUsuario,
                    pedidos: [],
                    subtotal: 0,
                };
            }
            pedidosAgrupados[idUsuario].pedidos.push(pedido);
            pedidosAgrupados[idUsuario].subtotal += pedido.subtotal;
        });
        // Convierte el objeto agrupado en un array para que Handlebars pueda iterar sobre él
        const pedidosAgrupadosArray = Object.values(pedidosAgrupados);
        res.render('pagos/pedidospagados', { pedidos: pedidosAgrupadosArray });
    } catch (error) {
        console.error('Error al obtener los datos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


module.exports = router;



