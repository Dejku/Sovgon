import fs from 'node:fs';
import path from 'node:path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { Collection } from 'discord.js';
import client from './client.js';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

client.commands = new Collection();
const FOLDERS_PATH = path.join(__dirname, '../Commands');
const COMMAND_FOLDERS = fs.readdirSync(FOLDERS_PATH);

for (const FOLDER of COMMAND_FOLDERS) {
	const COMMANDS_PATH = path.join(FOLDERS_PATH, FOLDER);
	fs.readdir(COMMANDS_PATH, (error, files) => {
		if (error) throw new Error(error);

		files.forEach(file => {
			if (!file.endsWith('.js')) return;

			import(`../Commands/${FOLDER}/${file}`).then(command => {
				if ('data' in command && 'execute' in command) {
					client.commands.set(command.data.name, command);

					console.log(`Command ${command.data.name} loaded.`);
				} else if (!command.isContextMenuCommand) {
					console.log(`${chalk.yellowBright('WARNING')} The command at ${COMMANDS_PATH}.js is missing a required "data" or "execute" property and isn't a context menu command.`);
				} else {
					console.log(`Context menu command ${command.rawName} loaded.`);
				}
			});
		});
	});
}

export default client;