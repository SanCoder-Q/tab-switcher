var fs = require('fs'),
    archiver = require('archiver'),
    manifestPath = `${__dirname}/../manifest.json`,
    buildPath = `${__dirname}/../dist/build`,
    compiledPath = `${__dirname}/../dist/compiled`,
    manifest = JSON.parse(fs.readFileSync(manifestPath));

var isLocalBuild = process.env.TRAVIS_BRANCH === undefined;
var BUILD_VERSION = process.argv[2];

addManifest();
pack();

function addManifest() {
  if (!isLocalBuild) {
    var version = manifest.version.split('.');
    manifest.version = `${version[0]}.${version[1]}.${BUILD_VERSION}`;
    fs.writeFileSync(`${compiledPath}/manifest.json`, JSON.stringify(manifest, null, 4));
  } else {
    fs.writeFileSync(`${compiledPath}/manifest.json`, JSON.stringify(manifest, null, 4));
  }
  console.log('Current Version: ' + manifest.version);
}

function pack() {
  console.log('Zipping ...');
  fs.existsSync(buildPath) || fs.mkdirSync(buildPath);
  var output = fs.createWriteStream(`${buildPath}/tab-switcher.zip`);
  var archive = archiver('zip', { zlib: { level: 9 } });
  output.on('close', function() {
    console.log(`Artifact: build/tab-switcher.zip (${archive.pointer()} bytes)`);
  });
  archive.on('error', function(err) {
    throw err;
  });
  archive.pipe(output);
  archive.glob(`**/*`, { cwd:compiledPath });
  archive.finalize();
}
