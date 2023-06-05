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
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command)
			return Logger.warn(`Komenda "${interaction.commandName}" nie została odnaleziona!`);

		if (CheckPermissions(command)) {
			const EMBED = Embed.CreateEmbed(Embed.type.warning, 'Nie posiadasz odpowiednich uprawnień do używania tej komendy!');
			return interaction.reply({ embeds: [EMBED], ephemeral: true });
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			Logger.error(error);

			const EMBED = Embed.CreateEmbed(Embed.type.warning, 'Wystąpił problem podczas wywoływania tej komendy!');
			if (interaction.replied || interaction.deferred)
				return interaction.followUp({ embeds: [EMBED], ephemeral: true });
			else
				return interaction.reply({ embeds: [EMBED], ephemeral: true });
		}
	}
}

export { name, execute };