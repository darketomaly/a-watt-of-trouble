import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const port = Number(process.env.PORT || 3000);

const contentTypeByExtension = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'application/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.webp': 'image/webp',
	'.ico': 'image/x-icon',
	'.xml': 'application/xml; charset=utf-8',
	'.txt': 'text/plain; charset=utf-8',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.wasm': 'application/wasm',
	'.data': 'application/octet-stream',
};

function respondNotFound(res) {
	res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
	res.end('Not Found');
}

function resolveRequestedPath(requestPath) {
	const decodedPath = decodeURIComponent((requestPath || '/').split('?')[0]);
	const normalizedPath = decodedPath === '/' ? '/index.html' : decodedPath;
	const absolutePath = path.resolve(distDir, `.${normalizedPath}`);
	if (!absolutePath.startsWith(distDir)) return null;
	if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) return absolutePath;

	const withIndex = path.resolve(distDir, `.${normalizedPath}`, 'index.html');
	if (!withIndex.startsWith(distDir)) return null;
	if (fs.existsSync(withIndex) && fs.statSync(withIndex).isFile()) return withIndex;

	return null;
}

function getHeaders(filePath) {
	const headers = {
		'Cache-Control': 'public, max-age=31536000, immutable',
	};
	const fileName = path.basename(filePath);
	const isBrotli = fileName.endsWith('.br');
	const effectivePath = isBrotli ? fileName.slice(0, -3) : fileName;
	const ext = path.extname(effectivePath).toLowerCase();
	headers['Content-Type'] = contentTypeByExtension[ext] || 'application/octet-stream';
	if (isBrotli) headers['Content-Encoding'] = 'br';
	if (path.basename(filePath) === 'index.html') {
		headers['Cache-Control'] = 'no-cache';
	}
	return headers;
}

const server = http.createServer((req, res) => {
	const absolutePath = resolveRequestedPath(req.url || '/');
	if (!absolutePath) {
		respondNotFound(res);
		return;
	}

	const headers = getHeaders(absolutePath);
	res.writeHead(200, headers);
	fs.createReadStream(absolutePath).pipe(res);
});

server.listen(port, () => {
	console.log(`Serving ${distDir} on port ${port}`);
});
