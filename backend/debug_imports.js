const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            if (file !== 'node_modules') {
                arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
            }
        } else {
            if (file.endsWith('.js')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

const allFiles = getAllFiles(path.join(__dirname, 'src'));

console.log(`Checking ${allFiles.length} files...`);

allFiles.forEach(file => {
    try {
        require(file);
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND' && err.message.includes('../../config/db')) {
            console.log(`❌ FAILED: ${file}`);
            console.log(`   Error: ${err.message}`);
        }
    }
});
