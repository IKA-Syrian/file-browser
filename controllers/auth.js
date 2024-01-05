const { decrypt } = require('../utils/dyCrypto')

class AuthController {
    constructor() {
        this._user
        this._hashPassword
        this._ad
    }
    set_user(user, password, AD) {
        this._user = user
        this._hashPassword = password
        this._ad = AD
    }

    authenticate() {
        return new Promise((resolve, reject) => {
            this._ad.authenticate(this._user, decrypt(this._hashPassword), (err, auth) => {
                if (err) {
                    console.log('ERROR: ' + JSON.stringify(err));
                    return reject({ status: 500, message: 'Error in authentication.' });
                }
                if (!auth) {
                    return resolve({ status: 401, message: 'Authentication failed!' });
                }
                this._ad.findUser(this._user, (err, user) => {
                    if (err) {
                        console.log('ERROR: ' + err);
                        return reject({ status: 500, message: 'Error finding user.' });
                    }
                    if (!user) {
                        return resolve({ status: 404, message: 'User not found.' });
                    } else {
                        resolve({ status: 200, message: 'User found.' });
                    }
                });
            });
        });
    }

    async checkUser() {
        try {
            const exists = await new Promise((resolve, reject) => {
                this._ad.userExists(this._user, (err, exists) => {
                    if (err) {
                        console.log('ERROR: ' + JSON.stringify(err));
                        return reject({ status: 500, message: 'Error checking user existence.' });
                    } else {
                        return resolve(exists);
                    }
                });
            });

            if (!exists) {
                return { status: 404, message: 'User does not exist.' };
            }

            return await this.authenticate();
        } catch (error) {
            return error;
        }
    }

    getUserHomeDirectory() {
        return new Promise((resolve, reject) => {
            this._ad.findUser(this._user, (err, user) => {
                if (err) {
                    console.log('ERROR:', err);
                    return reject(err);
                }
                if (!user) {
                    console.log('User not found.');
                    return resolve(null);
                }
                console.log('User found: ' + JSON.stringify(user));
                return resolve(user.homeDirectory);
            });
        });
    }
}

module.exports = AuthController;