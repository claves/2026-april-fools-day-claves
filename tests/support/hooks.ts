import { Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { createServer, Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CustomWorld } from './world.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const indexPath = path.join(projectRoot, 'index.html');

let server: Server | null = null;

Before(async function (this: CustomWorld) {
  await this.init();
});

After(async function (this: CustomWorld) {
  await this.cleanup();
});

BeforeAll(async function () {
  const html = await readFile(indexPath, 'utf-8');

  server = createServer((_req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
    });
    res.end(html);
  });

  await new Promise<void>((resolve, reject) => {
    server?.once('error', reject);
    server?.listen(3000, '127.0.0.1', () => resolve());
  });
});

AfterAll(async function () {
  if (!server) return;

  await new Promise<void>((resolve, reject) => {
    server?.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  server = null;
});
