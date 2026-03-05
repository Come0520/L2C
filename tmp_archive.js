const fs = require('fs');
const archiver = require('archiver');

const output = fs.createWriteStream('next-build.zip');
const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
});

output.on('close', function () {
    console.log(archive.pointer() + ' total bytes');
    console.log('archiver has been finalized and the output file descriptor has closed.');
});

archive.on('error', function (err) {
    throw err;
});

archive.pipe(output);

// append files from a sub-directory, putting its contents at the root of archive
archive.directory('.next/standalone/', '.next/standalone');
archive.directory('.next/static/', '.next/static');
archive.directory('public/', 'public');

archive.finalize();
