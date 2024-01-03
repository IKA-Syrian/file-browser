const ldap = require('ldapjs');


function authenticateDS(username, password) {
    const client = ldap.createClient({
        url: 'ldap://127.0.0.1:389',
    });
    client.bind(username, password, (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Authenticated');
            const opts = {
                filter: '(objectClass=*)',
                scope: 'sub',
                attributes: ['sn', 'cn']
            };
            client.search('ou=People,dc=maxcrc,dc=com', opts, (err, res) => {
                if (err) {
                    console.log(err);
                } else {

                    res.on('searchRequest', (searchRequest) => {
                        console.log('searchRequest: ', searchRequest.messageId);
                    });
                    res.on('searchEntry', (entry) => {
                        console.log('entry: ' + JSON.stringify(entry.attributes));
                    });
                    res.on('searchReference', (referral) => {
                        console.log('referral: ' + referral.uris.join());
                    });
                    res.on('error', (err) => {
                        console.error('error: ' + err.message);
                    });
                    res.on('end', (result) => {
                        console.log('status: ' + result.status);
                    });
                }
            });
        }
    });
}

authenticateDS('cn=manager,dc=maxcrc,dc=com', '123456');