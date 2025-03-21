// authMiddleware.js
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    try {
        const token = req.headers.cookie.split(' ').find(row => row.startsWith('token=')).split('=')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).redirect('/auth/login'); // Or pass an error to an error handler
    }
}
function loginMiddleware(req, res, next) {
    try {
        const token = req.headers.cookie.split(' ').find(row => row.startsWith('token=')).split('=')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        res.status(200).redirect('/files/browse');
    } catch (error) {
        next();
    }
}
module.exports = { authMiddleware, loginMiddleware };
