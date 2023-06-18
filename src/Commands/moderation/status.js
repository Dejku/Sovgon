import { SlashCommandBuilder } from 'discord.js';
import client from '../../Structure/client.js';
import { Embed } from '../../Utilities/Utilities.js';

const permissions = 'cmd';
const data = new SlashCommandBuilder()
	.setName('status')
	.setDescription('Zresetuj status bota');
function execute(interaction) {
	client.user.setPresence({ status: 'online', activities: [{ name: '/help' }] });

	const EMBED = Embed.CreateEmbed(Embed.type.success, 'Status został zresetowany!');
	return interaction.reply({ embeds: [EMBED], ephemeral: true });
}

export { permissions, data, execute };