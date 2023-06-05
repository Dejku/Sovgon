import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Post from '../../Data/models/postModel.js';
import { Embed } from '../../Utilities/Utilities.js';

const permissions = 'developer';
const data = new SlashCommandBuilder()
	.setName('post')
	.setDescription('Umożliwia zarządzanie postami.')
	.addSubcommand(subcommand => subcommand
		.setName('open')
		.setDescription('Otwiera post oraz umożliwia pisanie w nim.'))
	.addSubcommand(subcommand => subcommand
		.setName('close')
		.setDescription('Zamyka post oraz uniemożliwia dalsze pisanie w nim.')
		.addStringOption(option => option.setName('status')
			.setDescription('Status postu podczas zamknięcia.')
			.setRequired(true)
			.addChoices(
				{ name: 'Ukończone', value: 'finished' },
				{ name: 'Nie Do Naprawienia', value: 'unfixable' },
				{ name: 'Odrzucone', value: 'rejected' },
			))
		.addStringOption(option => option.setName('powód')
			.setDescription('Powód zablokowania postu.')))
	.addSubcommand(subcommand => subcommand
		.setName('claim')
		.setDescription('Dopisuje użytkownika do listy osób zajmujących się postem.'))
	.addSubcommand(subcommand => subcommand
		.setName('unclaim')
		.setDescription('Wypisuje użytkownika z listy osób zajmujących się postem.'));

async function execute(interaction) {
	if (!interaction.channel.isThread()) {
		const EMBED = Embed.CreateEmbed(Embed.type.error, 'Ten kanał nie jest wątkiem w forum');
		return interaction.reply({ embeds: [EMBED], ephemeral: true });
	}

	const CHANNEL_ID = interaction.channel.id;

	let lockMessage;
	let lockMessageID = await Post.find({ postID: CHANNEL_ID }).then(result => {
		if (result.length != 0)
			return result[0].lockMessageID;
	});

	if (lockMessageID != undefined)
		await interaction.channel.messages.fetch({ around: lockMessageID, limit: 1 }).then(result => lockMessage = result);

	if (interaction.options.getSubcommand() === 'open') {
		if (interaction.channel.locked) {
			await interaction.channel.setLocked(false);
			await lockMessage.first().delete();
			const EMBED = Embed.CreateEmbed(Embed.type.success, 'Post został odblokowany');
			return interaction.reply({ embeds: [EMBED], fetchReply: true }).then(msg => setTimeout(() => msg.delete(), 5000));
		}
		else {
			const EMBED = Embed.CreateEmbed(Embed.type.warning, 'Post jest już odblokowany');
			return interaction.reply({ embeds: [EMBED], content: 'Post jest już odblokowany', ephemeral: true });
		}
	}

	if (interaction.options.getSubcommand() === 'close') {
		if (interaction.channel.locked) {
			const EMBED = Embed.CreateEmbed(Embed.type.warning, 'Post jest już zablokowany');
			return interaction.reply({ embeds: [EMBED], ephemeral: true });
		}
		else {
			const REASON = interaction.options.getString('powód') ?? 'Brak podanego powodu';
			let status = interaction.options.getString('status');
			let color, code;

			if (status === 'finished') {
				status = 'Ukończone';
				color = 'Green';
				code = 0;
			} else if (status === 'unfixable') {
				status = 'Nie Do Naprawienia';
				color = 'Red';
				code = 1;
			} else {
				status = 'Odrzucone';
				color = 'Red';
				code = 2;
			}

			const EMBED = new EmbedBuilder()
				.setColor(color)
				.setTitle(`:lock: Post zamknięty`)
				.setDescription(`Status: **${status}**\nPowód: **${REASON}**`)
				.setFooter({ text: `Aby odblokować użyj "/post open"` });

			await interaction.reply({ embeds: [EMBED], fetchReply: true })
				.then(result => lockMessageID = result.id);
			await interaction.channel.setLocked(true, `Closed by ${interaction.user.username.toString()}`);
			return Post.updateOne({ postID: CHANNEL_ID }, { lockMessageID: lockMessageID, code: code }, { upsert: true });
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
		return user.map(s => `<@${s}>`);
	};

	const EmbedMessage = (description) => {
		return new EmbedBuilder()
			.setColor("Blue")
			.setTitle(`:wrench: Post przejęty przez`)
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