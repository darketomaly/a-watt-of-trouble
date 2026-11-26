import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const buildDir = path.join(rootDir, 'public', 'Game', 'Build');

const unityBinaryExts = new Set([
	'.data',
	'.data.br',
	'.wasm',
	'.wasm.br',
	'.framework.js',
	'.framework.js.br',
	'.bundle',
	'.bundle.br',
	'.symbols.json',
	'.symbols.json.br',
]);

function hasUnityBinaryExtension(fileName) {
	for (const ext of unityBinaryExts) {
		if (fileName.endsWith(ext)) return true;
	}
	return false;
}

function isLikelyLfsPointer(filePath) {
	const preview = fs.readFileSync(filePath, { encoding: 'utf8' }).slice(0, 256);
	return preview.includes('version https://git-lfs.github.com/spec/v1');
}

if (!fs.existsSync(buildDir)) {
	process.exit(0);
}

const files = fs.readdirSync(buildDir).map((name) => path.join(buildDir, name));
const suspectFiles = files.filter((filePath) => {
	if (!fs.statSync(filePath).isFile()) return false;
	return hasUnityBinaryExtension(path.basename(filePath)) && isLikelyLfsPointer(filePath);
});

if (suspectFiles.length > 0) {
	console.error('Unity build files are Git LFS pointers, not real binaries:');
	for (const filePath of suspectFiles) {
		console.error(`- ${path.relative(rootDir, filePath)}`);
	}
	console.error('');
	console.error('Run `git lfs pull` before building/deploying so Railway gets actual Unity assets.');
	process.exit(1);
}
