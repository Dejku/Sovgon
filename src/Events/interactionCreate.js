import { Logger, Embed } from "../Utilities/Utilities.js";

const name = 'interactionCreate';
async function execute(interaction) {
	function CheckPermissions(command) {
		if (command.permissions !== undefined && !interaction.member.roles.cache.some(role => role.name.toLowerCase() === command.permissions.toLowerCase()))
			return true;

		if (command.data.default_member_permissions !== undefined && !interaction.memberPermissions.has(command.data.default_member_permissions))
			return true;

		return false;
	}

	if (interaction.isChatInputCommand()) {
		const COMMAND = interaction.client.commands.get(interaction.commandName);

		if (!COMMAND)
			return Logger.error(`Komenda "${interaction.commandName}" nie została odnaleziona!`);

		if (CheckPermissions(COMMAND)) {
			const EMBED = Embed.CreateEmbed(Embed.type.error, 'Nie posiadasz odpowiednich uprawnień do używania tej komendy!');
			return interaction.reply({ embeds: [EMBED], ephemeral: true });
		}

		try {
			await COMMAND.execute(interaction);
		} catch (error) {
			Logger.error(`${error}`);

			const EMBED = Embed.CreateEmbed(Embed.type.error, 'Wystąpił problem podczas wywoływania tej komendy!');
			if (interaction.replied || interaction.deferred)
				return interaction.followUp({ embeds: [EMBED], ephemeral: true });
			else
				return interaction.reply({ embeds: [EMBED], ephemeral: true });
		}
	}

	if (interaction.isMessageContextMenuCommand()) {
		const GUILD_ID = interaction.guildId;
		const CHANNEL_ID = interaction.channelId;
		const MESSAGE_ID = interaction.targetId;
		let messageCount = 0;

		let embed = Embed.CreateEmbed(Embed.type.info, 'Trwa liczenie...');
		await interaction.deferReply({ embeds: [embed], ephemeral: true });

		await interaction.channel.messages.fetch({ limit: 100, cache: false, after: MESSAGE_ID })
			.then(messages => {
				if (messages.size == 100)
					messageCount = '100 lub więcej';
				else
					messageCount = messages.size + 1;
			})
			.catch(console.error);

		embed = Embed.CreateEmbed(Embed.type.info, `Do [wybranej wiadomości](https://discord.com/channels/${GUILD_ID}/${CHANNEL_ID}/${MESSAGE_ID}) naliczono ***${messageCount}*** wiadomości włącznie`);
		return interaction.editReply({ embeds: [embed] });
	}
}

export { name, execute };