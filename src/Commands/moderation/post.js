import { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
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
		.setDescription('Zamyka post oraz uniemożliwia dalsze pisanie w nim'))
	.addSubcommand(subcommand => subcommand
		.setName('claim')
		.setDescription('Dopisuje użytkownika do listy osób zajmujących się postem'))
	.addSubcommand(subcommand => subcommand
		.setName('unclaim')
		.setDescription('Wypisuje użytkownika z listy osób zajmujących się postem'));

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
			const EMBED = Embed.CreateEmbed(Embed.type.warning, 'Post jest już otwarty');
			return interaction.reply({ embeds: [EMBED], ephemeral: true });
		}
	}

	if (interaction.options.getSubcommand() === 'close') {
		if (interaction.channel.locked) {
			const EMBED = Embed.CreateEmbed(Embed.type.warning, 'Post jest już zamknięty');
			return interaction.reply({ embeds: [EMBED], ephemeral: true });
		}
		else {
			const MODEL = new ModalBuilder()
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

			MODEL.addComponents(STATUS_ACTION_ROW, REASON_ACTION_ROW);

			return interaction.showModal(MODEL);
		}
	}

	let claimMessage;
	let claimMessageID = await Post.find({ postID: CHANNEL_ID }).then(result => {
		if (result.length != 0)
			return result[0].claimMessageID;
	});
	if (claimMessageID != undefined)
		await interaction.channel.messages.fetch({ around: claimMessageID, limit: 1 }).then(result => claimMessage = result);

	let claimedBy = [];

	await Post.find({ postID: CHANNEL_ID }, { _id: 0, claimedBy: 1 }).then(result => {
		if (result.length != 0)
			claimedBy = result[0].claimedBy;
	});

	const FormatUsers = (user) => {
		return user.map(u => `<@${u}>`);
	};

	const EmbedMessage = (description) => {
		return new EmbedBuilder()
			.setColor("Blue")
			.setTitle(`:wrench: Uczestnicy prac:`)
			.setDescription(`**${description}**`)
			.setFooter({ text: `Aby się wypisać użyj "/post unclaim"` });
	};

	const USER = interaction.user.id;

	if (interaction.options.getSubcommand() === 'claim') {
		if (claimedBy.includes(USER)) {
			const EMBED = Embed.CreateEmbed(Embed.type.warning, 'Jesteś już na liście');
			return interaction.reply({ embeds: [EMBED], ephemeral: true });
		}
		claimedBy.push(USER);

		if (claimMessageID == undefined) {
			let EMBED = Embed.CreateEmbed(Embed.type.info, 'Tworzenie wiadomości...');
			await interaction.deferReply({ embeds: [EMBED], fetchReply: true })
				.then(result => claimMessageID = result.id);

			Post.updateOne({ postID: CHANNEL_ID }, { claimedBy: claimedBy, claimMessageID: claimMessageID }, { upsert: true })
				.then(async () => {
					claimedBy = await FormatUsers(claimedBy);
					EMBED = EmbedMessage(claimedBy);

					return interaction.editReply({ embeds: [EMBED] }).then(msg => msg.pin());
				})
				.catch(error => console.error(error));
		} else {
			Post.updateOne({ postID: CHANNEL_ID }, { claimedBy: claimedBy }, { upsert: true })
				.then(async () => {
					claimedBy = await FormatUsers(claimedBy);
					let EMBED = EmbedMessage(claimedBy);

					await claimMessage.first().edit({ embeds: [EMBED] });
					EMBED = Embed.CreateEmbed(Embed.type.success, 'Dopisano Cię do listy');
					return interaction.reply({ embeds: [EMBED], ephemeral: true });
				})
				.catch(error => console.error(error));
		}
	}

	if (interaction.options.getSubcommand() === 'unclaim') {
		if (!claimedBy.includes(USER)) {
			const EMBED = Embed.CreateEmbed(Embed.type.warning, 'Spoko, nie było Cię na liście');
			return interaction.reply({ embeds: [EMBED], ephemeral: true });
		}
		claimedBy = claimedBy.filter(user => user !== USER);

		if (claimedBy.length == 0) {
			Post.deleteOne({ postID: CHANNEL_ID })
				.then(async () => {
					await claimMessage.first().delete();

					const EMBED = Embed.CreateEmbed(Embed.type.success, 'Usunięto Cię z listy. Nie pozostał na niej nikt, więc została usunięta');
					return interaction.reply({ embeds: [EMBED], ephemeral: true });
				})
				.catch(error => console.error(error));
		} else {
			Post.updateOne({ postID: CHANNEL_ID }, { claimedBy: claimedBy })
				.then(async () => {
					claimedBy = await FormatUsers(claimedBy);
					let EMBED = EmbedMessage(claimedBy);

					await claimMessage.first().edit({ embeds: [EMBED] });
					EMBED = Embed.CreateEmbed(Embed.type.success, 'Usunięto Cię z listy');
					return interaction.reply({ embeds: [EMBED], ephemeral: true });
				})
				.catch(error => console.error(error));
		}
	}
}

export { permissions, data, execute };