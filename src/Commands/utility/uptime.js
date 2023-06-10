import { SlashCommandBuilder } from 'discord.js';
import client from '../../Structure/client.js';
import { Embed } from '../../Utilities/Utilities.js';

const data = new SlashCommandBuilder()
	.setName('uptime')
	.setDescription('Wyświetla czas pracy bota');

async function execute(interaction) {
	const UPTIME = client.uptime;

	let uptimeDays = Math.floor(UPTIME / 86400000);
	let uptimeHours = Math.floor(UPTIME / 3600000) % 24;
	let uptimeMinutes = Math.floor(UPTIME / 60000) % 60;
	const uptimeSeconds = Math.floor(UPTIME / 1000) % 60;

	if (uptimeDays == 0)
		uptimeDays = '';
	else
		uptimeDays += 'd';

	if (uptimeHours == 0)
		uptimeHours = '';
	else
		uptimeHours += 'h';

	if (uptimeMinutes == 0)
		uptimeMinutes = '';
	else
		uptimeMinutes += 'm';

	const EMBED = Embed.CreateEmbed(Embed.type.info, `Uptime: ${uptimeDays} ${uptimeHours} ${uptimeMinutes} ${uptimeSeconds}s`);

	return interaction.reply({ embeds: [EMBED] });
}

export { data, execute };