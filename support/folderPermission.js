const folderSecurityInfo = require('./build/Release/folder_security_info');

function PermissionInfo(path, userName) {
    try {
        const info = folderSecurityInfo.getFolderSecurityInfo(path);
        console.log(info, userName)
        const targetUser = info.find((user) => user.accountName == userName || user.accountName == 'Everyone');
        console.log(targetUser);
        if (targetUser) {
            return targetUser;
        } else {
            return null;
        }
    } catch (error) {
        console.error(error);
    }
}

module.exports = { PermissionInfo }

