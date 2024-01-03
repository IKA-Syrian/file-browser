const folderSecurityInfo = require('./build/Release/folder_security_info');


module.exports = { folderSecurityInfo }

// try {
//     const info = folderSecurityInfo.getFolderSecurityInfo('C:\\Users\\test2');
//     const targetUser = info.find((user) => user.accountName === 'test2');
//     console.log(targetUser);
// } catch (error) {
//     console.error(error);
// }