const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('invites')
    .setDescription("Gets a users server invite count.")
    .addUserOption(option => option.setName('user').setDescription('The user you want to check the invites of').setRequired(true)),
    async execute (interaction, message) {
        const user = interaction.options.getUser('user');
        let invites = await interaction.guild.invites.fetch();
        let userInv = invites.filter(u => u.inviter && u.inviter.id === user.id);

        let i = 0;
        userInv.forEach(inv => i += inv.uses);

        const invite = new EmbedBuilder()
        .setColor("Aqua")
        .setDescription(`:white_check_mark: ${user.tag} has ${i} invites`)
        .setTimestamp()

        await interaction.reply({ embeds: [invite]});
    }
}
