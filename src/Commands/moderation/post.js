import {
	SlashCommandBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
} from 'discord.js';
import Post from '../../Data/models/postModel.js';
import { Embed } from '../../Utilities/Utilities.js';

const permissions = 'developer';
const data = new SlashCommandBuilder()
	.setName('post')
	.setDescription('Umożliwia zarządzanie postami')
	.addSubcommand(subcommand => subcommand
		.setName('open')
		.setDescription('Otwiera post oraz umożliwia pisanie w nim'))
	.addSubcommand(subcommand => subcommand
		.setName('close')
		.setDescription('Zamyka post oraz uniemożliwia dalsze pisanie w nim'));

async function execute(interaction) {
	if (!interaction.channel.isThread()) {
		const EMBED = Embed.CreateEmbed(Embed.type.error, 'Ten kanał nie jest wątkiem w forum');
		return interaction.reply({ embeds: [EMBED], ephemeral: true });
	}

	const CHANNEL_ID = interaction.channel.id;

	let lockMessage;
	const LOCK_MESSAGE_ID = await Post.find({ postID: CHANNEL_ID }).then(result => {
		if (result.length != 0)
			return result[0].lockMessageID;
	});

	if (LOCK_MESSAGE_ID != undefined)
		await interaction.channel.messages.fetch({ around: LOCK_MESSAGE_ID, limit: 1 }).then(result => lockMessage = result);

	if (interaction.options.getSubcommand() === 'open') {
		if (interaction.channel.locked) {
			await interaction.channel.setLocked(false);
			await lockMessage.first().delete();

			const EMBED = Embed.CreateEmbed(Embed.type.success, 'Post został otwarty');
			return interaction.reply({ embeds: [EMBED], fetchReply: true }).then(msg => setTimeout(() => msg.delete(), 5000));
		}
		else {
			const EMBED = Embed.CreateEmbed(Embed.type.info, 'Post był już otwarty');
			return interaction.reply({ embeds: [EMBED], ephemeral: true });
		}
	}

	if (interaction.options.getSubcommand() === 'close') {
		if (interaction.channel.locked) {
			const EMBED = Embed.CreateEmbed(Embed.type.info, 'Post był już zamknięty');
			return interaction.reply({ embeds: [EMBED], ephemeral: true });
		}
		else {
			const MODAL = new ModalBuilder()
				.setCustomId('closingPost')
				.setTitle('Formularz zamknięcia postu');

			const STATUS_INPUT = new TextInputBuilder()
				.setCustomId('closingstatus')
				.setLabel("Jaki jest status postu?")
				.setStyle(TextInputStyle.Short)
				.setPlaceholder('Ukończony/Nie Do Naprawienia/Odrzucony/Inny')
				.setRequired(true);

			const REASON_INPUT = new TextInputBuilder()
				.setCustomId('closingReason')
				.setLabel("Jaki jest powód zamknięcia (jeśli istnieje)?")
				.setValue('Brak podanego powodu')
				.setPlaceholder('Brak podanego powodu')
				.setStyle(TextInputStyle.Paragraph)
				.setRequired(false);

			const STATUS_ACTION_ROW = new ActionRowBuilder().addComponents(STATUS_INPUT);
			const REASON_ACTION_ROW = new ActionRowBuilder().addComponents(REASON_INPUT);

			MODAL.addComponents(STATUS_ACTION_ROW, REASON_ACTION_ROW);

			return interaction.showModal(MODAL);
		}
	}
}

export { permissions, data, execute };