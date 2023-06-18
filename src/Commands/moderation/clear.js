import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Logger, Embed } from '../../Utilities/Utilities.js';

const data = new SlashCommandBuilder()
	.setName('clear')
	.setDescription('Usuwa określoną ilość (dostępnych) wiadomości')
	.addIntegerOption(option => option
		.setName('ilość')
		.setDescription('Ile usunąć?')
		.setMaxValue(100)
		.setRequired(true))
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

async function execute(interaction) {
	let embed;

	try {
		const AMOUNT = interaction.options.getInteger('ilość');
		let deletedMessages = 0;

		if (!AMOUNT || isNaN(AMOUNT)) {
			embed = Embed.CreateEmbed(Embed.type.error, `Wprowadź poprawną ilość`);
			return interaction.reply({ embeds: [embed], ephemeral: true });
		}
		if (AMOUNT > 100) {
			embed = Embed.CreateEmbed(Embed.type.error, `Więcej niż 100 nie uciągnę :)`);
			return interaction.reply({ embeds: [embed], ephemeral: true });
		}

		embed = Embed.CreateEmbed(Embed.type.loading, `Trwa usuwanie...`);
		await interaction.reply({ embeds: [embed], ephemeral: true });

		await interaction.channel.bulkDelete(AMOUNT, true).then(result => deletedMessages = result.size);

		embed = Embed.CreateEmbed(Embed.type.info, `Usunięto wiadomości (**${deletedMessages}**)!`);
		await interaction.editReply({ embeds: [embed], ephemeral: true });
	} catch (error) {
		Logger.error(error);

		embed = Embed.CreateEmbed(Embed.type.error, `Usuwanie się nie powiodło!`);
		return interaction.editReply({ embeds: [embed], ephemeral: true });
	}
}

export { data, execute };