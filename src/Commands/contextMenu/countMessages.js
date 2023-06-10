import { ContextMenuCommandBuilder, ApplicationCommandType } from 'discord.js';

const rawName = 'countMessages';
const isContextMenuCommand = true;
const data = new ContextMenuCommandBuilder()
	.setName('Policz wiadomości')
	.setType(ApplicationCommandType.Message);

export { rawName, isContextMenuCommand, data };