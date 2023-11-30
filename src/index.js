const express = require('express');
const morgan = require('morgan')
const exphbs = require('express-handlebars');
const session = require('express-session');
const MYSQLStore = require('express-mysql-session')(session);
const { database } = require('./keys');
const path = require('path');
const passport = require('passport');
const flash = require('connect-flash');


//agragados
const helpers = require('./lib/helpers');

const Handlebars = require('handlebars'); // Asegúrate de importar Handlebars



//initializations
const app = express();
require('./lib/passport');
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs.engine({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layoutes'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs',
    helpers: require('./lib/handlebars')
}));//configuracion de las carpetas o vistas
app.set('view engine', '.hbs');



//agragado
for (const key in helpers) {
    if (helpers.hasOwnProperty(key)) {
        Handlebars.registerHelper(key, helpers[key]);
    }
}




//settings

app.set('port', process.env.PORT || 4000);



//middlewares
app.use(session({
    secret: 'tiendamysqlnode',
    resave: false,
    saveUninitialized: false,
    store: new MYSQLStore(database)
}));
app.use(flash());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

//global variables
app.use((req, res, next) => {
    next();
});

app.use((req, res, next) => {
    app.locals.success = req.flash('success');
    app.locals.message = req.flash('message');
    app.locals.user = req.user;
    next();
});



//routes
app.use(require('./routes/index'));
app.use(require('./routes/authentication'));
app.use('/Productos', require('./routes/Productos'));

//public
app.use(express.static(path.join(__dirname, 'public')));
//starting the server

app.listen(app.get('port'), () => {
    console.log('server on port', app.get('port'));
});


/// agregado solo para pruebas 
module.exports = app;