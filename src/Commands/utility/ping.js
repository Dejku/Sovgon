import { SlashCommandBuilder } from 'discord.js';
import client from '../../Structure/client.js';
import { Embed } from '../../Utilities/Utilities.js';

const data = new SlashCommandBuilder()
	.setName('ping')
	.setDescription('Wyświetla opóźnienie bota.');

async function execute(interaction) {
	const EMBED = Embed.CreateEmbed(Embed.type.info, `Ping: ${client.ws.ping}ms`);
	return interaction.reply({ embeds: [EMBED] });
}

export { data, execute };