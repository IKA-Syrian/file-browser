require('dotenv').config();
const routes = require('express').Router();
const authController = require('../controllers/auth')
const { encrypt } = require('../utils/dyCrypto')
const { LDAPURL, LDAPBASEDN, LDAPUSER, LDAPPASSWORD } = process.env
// const passport = require('../strategies/windows');
var ActiveDirectory = require('activedirectory2');
const jwt = require('jsonwebtoken');
var config = {
    url: LDAPURL,
    baseDN: LDAPBASEDN,
    username: LDAPUSER,
    password: LDAPPASSWORD
}

routes.get('/login', (req, res) => {
    return res.status(200).render('login');
})

routes.post('/login', async (req, res) => {
    // If the request reaches here, it means the user is authenticated
    const { username, password } = req.body;
    const browserId = req.headers['user-agent']; // Get the browser ID from the request headers
    const sessionId = req.sessionID; // Get the session ID from the session
    const userIp = req.ip; // Get the IP address of the user
    // console.log(req.body, browserId, sessionId, userIp)
    var ad = new ActiveDirectory(config);
    const AdController = new authController()
    AdController.set_user(username, encrypt(password), ad)
    const result = await AdController.checkUser()
    // console.log(result)
    if (result.status == 200) {
        // Generate a JWT token with the browser ID, session ID, and user IP as additional claims
        const token = jwt.sign({ username, browserId, sessionId, userIp }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, {
            httpOnly: true, // Makes the cookie inaccessible to the client-side JS
            secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
            maxAge: 60 * 60 * 1000, // Cookie expiration set to 1 hours
            sameSite: 'strict' // Cookie is not sent with cross-origin requests
        });
        // Set the encrypted token in the response header
        res.status(200).json({ status: 200, message: 'You are authorized to see this message.' });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

routes.get('/check', async (req, res) => {
    const { username } = req.body;
    const browserId = req.headers['user-agent']; // Get the browser ID from the request headers
    const sessionId = req.sessionID; // Get the session ID from the session
    const userIp = req.ip; // Get the IP address of the user
    // console.log(req.query, browserId, sessionId, userIp)
    const token = req.headers.cookie.split(' ').find(row => row.startsWith('token=')).split('=')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(token, decoded)
    if (decoded.username == username && decoded.browserId == browserId && decoded.sessionId == sessionId && decoded.userIp == userIp) {
        res.status(200).setHeader('Authorization', 'Bearer ' + token).redirect('/files/browse');
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
})
// routes.post('/login', (req, res, next) => {
//     // Passport middleware will authenticate the request
//     passport.authenticate('ldapauth', { session: false }, (err, user, info) => {
//         if (err) { return next(err); }
//         if (!user) { return res.status(401).json({ message: 'Invalid credentials' }); }

//         // If authentication is successful, you can generate a JWT token or perform other actions
//         const token = generateToken(user);

//         // Respond with the token or any other relevant information
//         res.json({ token });
//     })(req, res, next);
// });
// routes.get('/signup', authController.getSignup);

// routes.post('/signup', authController.postSignup);

// routes.post('/logout', authController.postLogout);

module.exports = routes;