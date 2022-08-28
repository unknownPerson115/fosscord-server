const path = require("path");
const fs = require("fs");
const { env } = require("process");
const { execSync } = require("child_process");
const { argv, stdout, exit } = require("process");

const parts = ["api", "util", "cdn", "gateway", "bundle"];

function copyRecursiveSync(src, dest) {
	//if (verbose) console.log(`cpsync: ${src} -> ${dest}`);
	let exists = fs.existsSync(src);
	if (!exists) {
		console.log(src + " doesn't exist, not copying!");
		return;
	}
	let stats = exists && fs.statSync(src);
	let isDirectory = exists && stats.isDirectory();
	if (isDirectory) {
		fs.mkdirSync(dest, { recursive: true });
		fs.readdirSync(src).forEach(function (childItemName) {
			copyRecursiveSync(
				path.join(src, childItemName),
				path.join(dest, childItemName)
			);
		});
	} else {
		fs.copyFileSync(src, dest);
	}
}

function execIn(cmd, workdir) {
	try {
		return execSync(cmd, {
			cwd: workdir,
			shell: true,
			env: process.env,
			encoding: "utf-8",
		});
	} catch (error) {
		return error.stdout;
	}
}

function getLines(output) {
	return output.split("\n").length;
}

module.exports = { 
	//consts
	parts,
	//functions
	copyRecursiveSync, execIn, getLines
};
