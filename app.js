const express = require('express');
const routs = require('./routes');
const passport = require('passport');
const session = require('express-session');


const app = express();
app.use(express.static(__dirname + '/assest'));
app.set('view engine', 'ejs');
app.set('views', 'views');

function createRandomSecret() {
    var Secret = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789&";
    for (var i = 0; i < 50; i++)
        Secret += possible.charAt(Math.floor(Math.random() * possible.length));
    return Secret;
}

app.use(session({ secret: createRandomSecret(), resave: true, saveUninitialized: true }));
// app.use(passport.initialize());
app.use(passport.session());
// app.use(userAgent.express());

// Initialize Passport.js
app.use(passport.initialize());


app.use(express.json())
app.use(express.urlencoded({
    extended: false,
}))
app.use('/', routs);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});