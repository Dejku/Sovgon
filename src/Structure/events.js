import fs from 'node:fs';
import path from 'node:path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import client from './client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const EVENTS_PATH = path.join(__dirname, '../Events');

fs.readdir(EVENTS_PATH, (err, files) => {
	files.forEach(file => {
		import(`../Events/${file}`).then(event => {
			if (event.once)
				client.once(event.name, (...args) => event.execute(...args));
			else
				client.on(event.name, (...args) => event.execute(...args));

			console.log(`Event ${event.name} loaded.`);
		});
	});
});

export default client;