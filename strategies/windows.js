const passport = require('passport')
const LdapStrategy = require('passport-ldapauth');
const jwt = require('jsonwebtoken');

function createRandomSecret() {
    var Secret = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789&";
    for (var i = 0; i < 50; i++)
        Secret += possible.charAt(Math.floor(Math.random() * possible.length));
    return Secret;
}
passport.use(new LdapStrategy({
    server: {
        url: 'ldap://testbalqees.local:389',
        baseDN: 'DC=testbalqees,DC=local',
        bindDN: 'Administrator@testbalqees.local',
        bindCredentials: '@Ibrahim2002tk',
        searchBase: 'CN=Users,DC=testbalqees,DC=local',
        searchFilter: '(uid={{username}})'
    },
}, function (req, user, done) {
    done(null, user);
}));

passport.serializeUser((user, done) => {
    // Store user information in the session
    done(null, user);
});

passport.deserializeUser((user, done) => {
    // Retrieve user information from the session
    done(null, user);
});

module.exports = passport;
