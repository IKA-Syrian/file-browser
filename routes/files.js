const routes = require('express').Router();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const util = require('util');
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const ffmpeg = require('fluent-ffmpeg');
// const metadataFormatter = require('ffmpeg-metadata-formatter');
const metadataFormatter = require('../support/metadata');
const { authMiddleware } = require('../controllers/authMiddleware');
const { PermissionInfo } = require('../support/folderPermission');
ffmpeg.setFfprobePath("C:/ffmpeg/bin/ffprobe.exe");

function getDiskList() {
    return new Promise((resolve, reject) => {
        if (os.platform() === 'win32') {
            exec('wmic logicaldisk get caption', (error, localStdout) => {
                if (error) {
                    reject(error);
                    return;
                }

                const localDrives = localStdout
                    .split('\r\r\n')
                    .map(line => line.trim())
                    .filter(line => /^[A-Za-z]:$/.test(line));

                exec('net use', { shell: 'powershell.exe' }, (error, networkStdout) => {
                    if (error && error.code !== 2) {
                        reject(error);
                        return;
                    }

                    const lines = networkStdout.split('\n').map(line => line.trim());
                    const remoteIndex = lines[1].indexOf('Remote'); // Find the 'Remote' column index

                    const networkDrives = lines.slice(2).map(line => {
                        const drive = line.slice(0, remoteIndex).trim();
                        const path = line.slice(remoteIndex).trim();
                        return `${drive} (${path})`;
                    });
                    let network = []
                    networkDrives.forEach((line, index) => {
                        if (line.split(" ").length > 2) {
                            console.log(networkDrives[index])
                            search = line.split(" ").find(row => /^[A-Za-z]:$/.test(row));
                            if (search != undefined) {
                                let FormatData = {
                                    name: search,
                                    path: line.split(" ").filter(item => item !== '')[2]
                                }
                                network.push(FormatData)
                            }
                        }
                    })

                    resolve([...localDrives]);
                    // resolve({
                    //     local: [...localDrives],
                    //     network: [...network]
                    // });
                });
            });
        } else if (os.platform() === 'linux') {
            exec('lsblk -o NAME -n -p -l', (error, stdout) => {
                if (error) {
                    reject(error);
                } else {
                    // Extract device names (e.g., /dev/sda) from the output

                    const diskList = stdout
                        .split('\n')
                        .map(line => line.trim())
                        .filter(line => line !== '');
                    resolve(diskList);
                }
            });
        } else {
            reject(new Error('Unsupported operating system'));
        }
    });
}

async function getChildren(directoryPath) {
    const children = [];
    try {
        const files = await readdir(directoryPath);
        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            const fileStat = await stat(filePath);
            if (fileStat.isDirectory()) {
                children.push({
                    name: file,
                    path: path.join(directoryPath, file, '/'),
                });
            }
        }
    } catch (err) {
        console.error(err);
    }
    return children;
}

routes.get('/browse', authMiddleware, async (req, res) => {
    if (req.user) {
        const diskList = await getDiskList();
        console.log('List of Disks:', diskList);
        res.status(200).render('main', { title: 'File Browser', disks: diskList });
    } else {
        res.status(401).redirect('/auth/login')

    }
});

routes.get('/browse/:disk', authMiddleware, async (req, res) => {
    try {
        const fileSupPath = req.body.path ? req.body.path : '/';
        const disk = req.params.disk.concat(':');
        console.log(path.join(disk, `${fileSupPath}`));
        let template = {
            files: [],
            Directories: []
        };

        const files = fs.readdirSync(path.join(disk, `${fileSupPath}`));
        files.forEach(async (file, index) => {
            const filePath = path.join(disk, `${fileSupPath}`, file);
            try {
                const stats = fs.statSync(filePath);
                if (stats.isDirectory()) {
                    let data = {
                        name: file,
                        path: `${file}/`,
                    }
                    const childrenPath = fs.readdirSync(filePath);
                    let children = [];
                    childrenPath.forEach(async (child, index) => {
                        const childPath = path.join(filePath, child);
                        try {
                            const childStats = fs.statSync(childPath);
                            if (childStats.isDirectory()) {
                                children.push({ name: child, path: `${childPath}` })
                            }
                        } catch (err) {
                            console.log(err);
                        }
                    });
                    if (children.length > 0) {
                        data = { ...data, children }
                    }
                    template.Directories.push(data);
                } else {
                    const type = file.split('.').pop();
                    let data = {
                        name: file,
                        type: '',
                        path: `${file}/`,
                        fa: ''
                    }
                    const ImageType = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'ico'];
                    const VideoType = ['mp4', 'mkv', 'avi', 'mov', 'webm', 'wmv'];
                    const AudioType = ['mp3', 'wav', 'ogg', 'm4a'];
                    const DocumentType = ['doc', 'docx', 'pdf', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'];
                    const CompressedType = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];
                    if (ImageType.includes(type)) {
                        data.type = 'image';
                        data.fa = 'fa-file-image-o';
                    } else if (VideoType.includes(type)) {
                        data.type = 'video';
                        data.fa = 'fa-file-video-o';
                    } else if (AudioType.includes(type)) {
                        data.type = 'audio';
                        data.fa = 'fa-file-audio-o';
                    } else {
                        data.type = 'other';
                        data.fa = 'fa-file-o';
                    }
                    // if(type)
                    console.log(type);
                    template.files.push(data);
                }
            } catch (err) {
                console.log(err);
            }
        });
        console.log('List of Files:', template);
        const treeData = template.Directories;
        console.log('Tree Data:', treeData);
        const filesData = template;
        const detailsData = template;
        res.status(200).render('index', { treeData, filesData, detailsData });
    } catch (err) {
        console.error(err);
        res.status(404).render('404', { title: '404: File Not Found' });
    }
});
routes.post('/:disk', authMiddleware, async (req, res) => {
    try {
        const { username } = req.body
        const fileSupPath = req.body.path ? req.body.path : '/';
        console.log(fileSupPath);
        const disk = req.params.disk.concat(':');
        console.log(path.join(disk, `${fileSupPath}`));
        const folderPath = path.join(disk, `${fileSupPath}`);
        if (PermissionInfo(folderPath, username) != null) {
            let template = {
                files: [],
                Directories: []
            };
            const files = fs.readdirSync(path.join(disk, `${fileSupPath}`));
            files.forEach((file, index) => {
                const filePath = path.join(disk, `${fileSupPath}`, file);
                try {
                    const stats = fs.statSync(filePath);
                    if (stats.isDirectory()) {
                        let data = {
                            name: file,
                            path: `${file}/`,
                        }
                        template.Directories.push(data);
                    } else {
                        const type = file.split('.').pop();
                        let data = {
                            name: file,
                            type: '',
                            path: `${file}/`,
                            fa: ''
                        }
                        const ImageType = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'ico'];
                        const VideoType = ['mp4', 'mkv', 'avi', 'mov', 'webm', 'wmv'];
                        const AudioType = ['mp3', 'wav', 'ogg', 'm4a'];
                        const DocumentType = ['doc', 'docx', 'pdf', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'];
                        const CompressedType = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];
                        if (ImageType.includes(type)) {
                            data.type = 'image';
                            data.fa = 'fa-file-image-o';
                        } else if (VideoType.includes(type)) {
                            data.type = 'video';
                            data.fa = 'fa-file-video-o';
                        } else if (AudioType.includes(type)) {
                            data.type = 'audio';
                            data.fa = 'fa-file-audio-o';
                        } else {
                            data.type = 'other';
                            data.fa = 'fa-file-o';
                        }
                        // if(type)
                        console.log(type);
                        template.files.push(data);
                    }
                } catch (err) {
                    console.log(err);
                }
            });
            console.log('List of Files:', template);
            res.send(template)
        } else {
            return res.status(403).send({ "error": "Permission Denied" })
        }
    } catch (err) {
        console.error(err);
        res.status(404).render('404', { title: '404: File Not Found' });
    }
});

routes.post('/:disk/info', authMiddleware, async (req, res) => {
    try {
        const { filePath } = req.body;
        const disk = req.params.disk.concat(':');
        const filepath = path.join(disk, `\\${filePath}`);
        console.log(filepath);
        ffmpeg.ffprobe(filepath, (error, metadata) => {
            if (error) {
                console.error(error);
            } else {
                console.log('Video Metadata:', metadata.streams[1]);
                res.send(metadataFormatter(metadata));
            }
        });
    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": "Something went wrong" })
    }
})


routes.post("/:disk/dir", authMiddleware, async (req, res) => {
    const { datapath } = req.body
    const disk = req.params.disk.concat(":")
    const folderPath = path.join(disk, `/${datapath}`)

    const folder = fs.readdirSync(folderPath)
    let template = []
    folder.forEach(async (file, index) => {
        const filePath = path.join(disk, `${datapath}`, file);
        try {
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                let data = {
                    name: file,
                    path: `${filePath}`,
                }
                const childrenPath = fs.readdirSync(filePath);
                let children = [];
                childrenPath.forEach(async (child, index) => {
                    const childPath = path.join(filePath, child);
                    try {
                        const childStats = fs.statSync(childPath);
                        if (childStats.isDirectory()) {
                            children.push({ name: child, path: `${childPath}` })
                        }
                    } catch (err) {
                        console.log(err);
                    }
                });
                if (children.length > 0) {
                    data = { ...data, children }
                }
                template.push(data);
            }
        } catch (err) {
            console.log(err);
        }
    });
    return res.send(template)
})

// Assuming you have a '/:disk/dir/info' endpoint
routes.get('/:disk/dir/info', authMiddleware, async (req, res) => {
    const datapath = req.body.datapath ? req.body.datapath : '/';
    const disk = req.params.disk.concat(":")
    const folderPath = path.join(disk, `/${datapath}`)
    const folder = fs.statSync(folderPath)
    console.log(folder)
    res.send(folder)
});


module.exports = routes;