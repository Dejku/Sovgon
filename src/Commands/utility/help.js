import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import client from '../../Structure/client.js';

const data = new SlashCommandBuilder()
	.setName('help')
	.setDescription('Wyświetla okno pomocy');

async function execute(interaction) {
	const EMBED = new EmbedBuilder()
		.setColor(15015197)
		.setTitle('HELP')
		.addFields({ name: 'Komendy - Poradnik Krok Po Kroku', value: `Wpisz w poniższym polu tekstowym znak "/" *(ten koło pytajnika)*.\nOtwarta zostanie lista komend, po jej lewej stronie wybierz bota, którego komendy chcesz sprawdzić. W naszym przypadku jest to **${client.user.username}**. Wyświetlone zostaną wszystkie dostepne komendy wraz z krótkim opisem oraz ewentualnymi polami do uzupełnienia.` })
		.setFooter({ text: 'Made by Dejku' });

	return interaction.reply({ embeds: [EMBED] });
}

export { data, execute };