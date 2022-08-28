const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const { getSystemErrorMap } = require("util");
const { argv, stdout, exit } = require("process");
const { copyRecursiveSync, execIn, parts } = require('./utils');

if(argv.includes("help")) {
	console.log(`Fosscord build script help:
Arguments:
  clean			Cleans up previous builds
  copyonly		Only copy source files, don't build (useful for updating assets)
  verbose		Enable verbose logging
  logerrors		Log build errors to console
  pretty-errors		Pretty-print build errors
  silent		No output to console or files.`);
	exit(0);
}

let steps = 3, i = 0;
if (argv.includes("clean")) steps++;
if (argv.includes("copyonly")) steps--;

const verbose = argv.includes("verbose") || argv.includes("v");
const logerr = argv.includes("logerrors");
const pretty = argv.includes("pretty-errors");
const silent = argv.includes("silent");

if(silent) console.error = console.log = function(){}

if (argv.includes("clean")) {
	console.log(`[${++i}/${steps}] Cleaning...`);
	parts.forEach((a) => {
		let d = "../" + a + "/dist";
		if (fs.existsSync(d)) {
			fs.rmSync(d, { recursive: true });
			if (verbose) console.log(`Deleted ${d}!`);
		}
	});
}

console.log(`[${++i}/${steps}] Checking if dependencies were installed correctly...`);
//exif-be-gone v1.3.0 doesnt build js, known bug
if(!fs.existsSync(path.join(__dirname, "..", "node_modules", "exif-be-gone", "index.js")))
	execIn("npm run build", path.join(__dirname, "..", "node_modules", "exif-be-gone"));

console.log(`[${++i}/${steps}] Copying src files...`);
copyRecursiveSync(path.join(__dirname, "..", "..", "api", "assets"), path.join(__dirname, "..", "dist", "api", "assets"));
copyRecursiveSync(path.join(__dirname, "..", "..", "api", "client_test"), path.join(__dirname, "..", "dist", "api", "client_test"));
copyRecursiveSync(path.join(__dirname, "..", "..", "api", "locales"), path.join(__dirname, "..", "dist", "api", "locales"));
parts.forEach((a) => {
	copyRecursiveSync("../" + a + "/src", "dist/" + a + "/src");
	if (verbose) console.log(`Copied ${"../" + a + "/dist"} -> ${"dist/" + a + "/src"}!`);
});

if (!argv.includes("copyonly")) {
	console.log(`[${++i}/${steps}] Compiling src files ...`);

	let buildFlags = ''
	if(pretty) buildFlags += '--pretty '

	try {
		execSync(
			'node "' +
				path.join(__dirname, "..", "node_modules", "typescript", "lib", "tsc.js") +
				'" -p "' +
				path.join(__dirname, "..") +
				'" ' + buildFlags,
			{
				cwd: path.join(__dirname, ".."),
				shell: true,
				env: process.env,
				encoding: "utf8"
			}
		)
	} catch (error) {
		if(verbose || logerr) {
			error.stdout.split(/\r?\n/).forEach((line) => {
				let _line = line.replace('dist/','',1);
				if(!pretty && _line.includes('.ts(')) {
					//reformat file path for easy jumping
					_line = _line.replace('(',':',1).replace(',',':',1).replace(')','',1)
				}
				console.error(_line);
			})
		}
		console.error(`Build failed! Please check build.log for info!`);
		if(!silent){
			if(pretty) fs.writeFileSync("build.log.ansi",  error.stdout);
			fs.writeFileSync("build.log",  error.stdout.replaceAll(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, ''));
		}
	}
}