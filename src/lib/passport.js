const passport = require('passport');
const LocalStrategy = require('passport-local');

const pool= require('../database');

const helpers= require('../lib/helpers');


passport.use('local.signin', new LocalStrategy({
    usernameField :'email',
    passwordField : 'password',
    passReqToCallback: true
},async(req, email, password, done)=>{

    const rows = await pool.query('select * from users where email=?',[email]);
    if(rows.length > 0){
        const user = rows[0];
        const validPassword = await helpers.matchPassword(password, user.password);
        if(validPassword){
            done(null, user, req.flash('success', 'Bienvenido ' + user.email));
        }else{
            done(null, false, req.flash('message', 'Contraseña Incorrecta'));
        }
    } else{
        return done(null, false, req.flash('message', 'El usuario no existe.'));
    }
}));



passport.use('local.signup', new LocalStrategy({
    usernameField: 'nombre',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, nombre, password, done) => {
    const { apellido, dni, email } = req.body;
    // Verificar si el correo electrónico ya existe en la base de datos
    const emailExists = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (emailExists.length > 0) {
        return done(null, false, req.flash('message', 'El correo electrónico ya está registrado.'));
        
    }
    // Verificar si el nombre de usuario ya existe en la base de datos
    const usernameExists = await pool.query('SELECT * FROM users WHERE dni = ?', [dni]);
    if (usernameExists.length > 0) {
        return done(null, false, req.flash('message', 'El dni de usuario ya está en uso.'));
        
    }
    // Si el correo electrónico y el nombre de usuario son únicos, crea el nuevo usuario
    const newUser = {
        nombre,
        apellido,
        dni,
        email,
        password: await helpers.encrypyPassword(password)
    };
    const result = await pool.query('INSERT INTO users SET ?', [newUser]);
    newUser.id = result.insertId;
    return done(null, newUser);
}));






passport.serializeUser((user, done)=>{
    done(null, user.id);
});

passport.deserializeUser(async(id, done)=>{
    const rows = await pool.query('SELECT * FROM users Where id= ?',[id]);
    done(null, rows[0]);
});