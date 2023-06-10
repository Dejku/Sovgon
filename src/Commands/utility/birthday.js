import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Birthday from '../../Data/models/birthdayModel.js';
import { Embed } from '../../Utilities/Utilities.js';
import months from '../../Data/monthsNames.js';

const data = new SlashCommandBuilder()
	.setName('birthday')
	.setDescription('Umożliwia zarządzanie kalendarzem urodzinowym')
	.addSubcommand(subcommand => subcommand
		.setName('next')
		.setDescription('Wyświetla najbliższe urodziny z kalendarza'))
	.addSubcommand(subcommand => subcommand
		.setName('show')
		.setDescription('Wyświetla urodziny wskazanej osoby/wszystkich na liście')
		.addUserOption(option => option.setName('kto')
			.setDescription('Użytkownik')))
	.addSubcommand(subcommand => subcommand
		.setName('add')
		.setDescription('Dodaje urodziny wskazanej osoby do kalendarza urodzinowego')
		.addUserOption(option => option.setName('kto')
			.setDescription('Użytkownik')
			.setRequired(true))
		.addIntegerOption(option => option.setName('dzień')
			.setDescription('Dzień urodzin')
			.setRequired(true)
			.setMinValue(1)
			.setMaxValue(31))
		.addIntegerOption(option => option.setName('miesiąc')
			.setDescription('Miesiąc urodzin')
			.setRequired(true)
			.addChoices(
				{ name: 'Styczeń', value: 1 },
				{ name: 'Luty', value: 2 },
				{ name: 'Marzec', value: 3 },
				{ name: 'Kwiecień', value: 4 },
				{ name: 'Maj', value: 5 },
				{ name: 'Czerwiec', value: 6 },
				{ name: 'Lipiec', value: 7 },
				{ name: 'Sierpień', value: 8 },
				{ name: 'Wrzesień', value: 9 },
				{ name: 'Pażdziernik', value: 10 },
				{ name: 'Listopad', value: 11 },
				{ name: 'Grudzień', value: 12 },
			)))
	.addSubcommand(subcommand => subcommand
		.setName('remove')
		.setDescription('Usuwa urodziny wskazanej osoby z kalendarza urodzinowego')
		.addUserOption(option => option.setName('kto')
			.setDescription('Użytkownik')
			.setRequired(true)));

async function execute(interaction) {
	const DATE = new Date();
	const DAY = DATE.getUTCDate();
	const MONTH = DATE.getUTCMonth() + 1;
	const TODAY = new Date(`${MONTH} ${DAY}, ${DATE.getFullYear()} 13:00:00`);

	function DateIsValid(date) {
		return date instanceof Date && !isNaN(date);
	}

	function AuthUser(member) {
		if (member.roles.cache.some(role => role.name === 'cmd'))
			return true;

		return false;
	}

	function GetDifference(month, day) {
		return new Date(`${month} ${day}, ${DATE.getFullYear()} 13:00:00`) - TODAY;
	}

	if (interaction.options.getSubcommand() === 'next') {
		let birthdays = [];
		await Birthday.find()
			.then(results => {
				birthdays = results.map(result => {
					return {
						person: result.person,
						relativeDate: `<t:${Math.floor(new Date(`${result.month} ${result.day}, ${DATE.getFullYear()} 13:00:00`) / 1000)}:R>`,
						difference: GetDifference(result.month, result.day),
					};
				});
			})
			.catch(error => console.error(error));

		const LOWEST_DIFF = birthdays
			.filter(birthday => birthday.difference > 0)
			.reduce((prev, curr) => {
				return prev.difference < curr.difference ? prev : curr;
			});

		const NEXT_BIRTHDAY = birthdays.filter(birthday => birthday.difference === LOWEST_DIFF.difference);

		const EMBED = new EmbedBuilder()
			.setTitle(':birthday:  Najbliższe urodziny  :birthday:')
			.setColor(16770457)
			.setFooter({ text: "PS. Najedź myszką na opis aby zobaczyć dokładną datę" });

		NEXT_BIRTHDAY.forEach(birthday => {
			EMBED.addFields({ name: `${birthday.person}`, value: `${birthday.relativeDate}`, inline: true });
		});

		return interaction.reply({ embeds: [EMBED] });
	}

	if (interaction.options.getSubcommand() === 'show') {
		let birthdays;

		if (interaction.options.getUser('kto') !== null) {
			const USER = interaction.options.getUser('kto');

			await Birthday.find({ personID: USER.id })
				.then(result => birthdays = result)
				.catch(error => console.error(error));
		}
		else await Birthday.find()
			.then(result => birthdays = result)
			.catch(error => console.error(error));

		const EMBED = new EmbedBuilder()
			.setTitle(':birthday:  Kalendarz Urodzinowy  :birthday:')
			.setDescription(`O to lista wszystkich osób zapisanych w kalendarzu.\nJeśli też chcesz się zapisać, **daj znać!**\n_ _`)
			.setColor(16770457)
			.setFooter({ text: "PS. Najedź myszką na opis aby zobaczyć dokładną datę" });

		await birthdays.forEach(birthday => {
			let year = DATE.getFullYear();

			const DIFFERENCE = GetDifference(birthday.month, birthday.day);
			if (DIFFERENCE < 0) year++;

			const RELATIVE_DATE = `<t:${Math.floor(new Date(`${birthday.month} ${birthday.day}, ${year} 13:00:00`) / 1000)}:R>`;
			EMBED.addFields({ name: `${(birthday.person)}`, value: `${RELATIVE_DATE}`, inline: true });
		});

		return interaction.reply({ embeds: [EMBED] });
	}

	if (!AuthUser(interaction.member)) {
		const EMBED = Embed.CreateEmbed(Embed.type.warning, 'Nie posiadasz odpowiednich uprawnień do używania tej komendy!');
		return interaction.reply({ embeds: [EMBED], ephemeral: true });
	}

	if (interaction.options.getSubcommand() === 'add') {
		const BIRTHDAY_USER = interaction.options.getUser('kto');
		const BIRTHDAY_DAY = interaction.options.getInteger('dzień');
		const BIRTHDAY_MONTH = interaction.options.getInteger('miesiąc');

		const BIRTHDAY_DATE = new Date(`${months[BIRTHDAY_MONTH - 1].eng} ${BIRTHDAY_DAY}, ${DATE.getFullYear()} 13:00:00`); // Format: eg. "July 1, 1978 02:30:00"
		const BIRTHDAY_EPOCH = Math.floor(BIRTHDAY_DATE.getTime() / 1000);

		if (!DateIsValid(new Date(BIRTHDAY_EPOCH))) {
			const EMBED = Embed.CreateEmbed(Embed.type.error, 'Niepoprawna data!');
			return interaction.reply({ embeds: [EMBED], ephemeral: true });
		}

		let isCopy = false;
		await Birthday.findOne({ personID: BIRTHDAY_USER.id })
			.then(result => {
				if (result)
					isCopy = true;
			})
			.catch(error => console.error(error));

		if (isCopy) {
			const EMBED = Embed.CreateEmbed(Embed.type.warning, 'Ta osoba jest już zapisana');
			return interaction.reply({ embeds: [EMBED], ephemeral: true });
		} else {
			await Birthday.create({
				person: BIRTHDAY_USER.username,
				personID: BIRTHDAY_USER.id,
				day: BIRTHDAY_DAY,
				month: BIRTHDAY_MONTH,
			})
				.then(async () => {
					const EMBED = Embed.CreateEmbed(Embed.type.success, `Urodziny <@${BIRTHDAY_USER.id}> zostały dodane!`);
					return interaction.reply({ embeds: [EMBED] });
				})
				.catch(error => console.error(error));
		}
	}

	if (interaction.options.getSubcommand() === 'remove') {
		const USER = interaction.options.getUser('kto');

		await Birthday.deleteOne({ personID: USER.id })
			.then(result => {
				let embed;
				if (result.deletedCount === 0)
					embed = Embed.CreateEmbed(Embed.type.warning, 'Podana osoba nie została odnaleziona! Możliwe, że nie była wpisana do kalendarza');
				else
					embed = Embed.CreateEmbed(Embed.type.success, `Usunięto <@${USER.id}> z kalendzarza urodzinowego`);

				return interaction.reply({ embeds: [embed], ephemeral: true });
			})
			.catch(error => console.error(error));
	}
}

export { data, execute };