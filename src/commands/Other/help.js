const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('This is the help command to see all commands'),
    async execute(interaction, client) {
        const help = new EmbedBuilder()
            .setColor("Blue")
            .setTitle("Help Center")
            .setDescription("**Help Command Guide:**")
            .addFields({ name: "Page 1", value: "Community Commands" })
            .addFields({ name: "Page 2", value: "Moderation Commands" })

        const community = new EmbedBuilder()
            .setColor("Blue")
            .setTitle('**Community Commands**')
            .addFields({ name: "/dictionary", value: "Gets the definition and examples of a given word", inline: true })
            .addFields({ name: "/invites", value: "Gets a users server invite count.", inline: true  })
            .addFields({ name: "/userinfo", value: "Gets basic user info.", inline: true  })
            .addFields({ name: "/snipe", value: "Finds the most recent deleted message", inline: true  })
            // as there are more community cmds, manually add them here one line above
            .setFooter({ text: "Community Commands" })

        const moderation = new EmbedBuilder()
            .setColor("Blue")
            .setTitle("**Moderation Commands**")
            .addFields({ name: "/purge", value: "Deletes a specific number of messages from a channel", inline: true })
            .addFields({ name: "/kick", value: "Kicks a server member", inline: true })
            .addFields({ name: "/slowmode", value: "Sets the slowmode of a channel", inline: true })
            .addFields({ name: "/ticket", value: "Creates a ticket so that staff assist you", inline: true })
            .addFields({ name: "/ticket-setup", value: "Sets up a ticket system", inline: true })
            .addFields({ name: "/ticket-disable", value: "Removes your ticket system", inline: true })
            .addFields({ name: "/poll setup", value: "Sets up a poll system", inline: true })
            .addFields({ name: "/poll disable", value: "Removes your poll system", inline: true })
            .addFields({ name: "/ban", value: "Bans a member. For time - 1s for 1 second, 1m for 1 minute, 1h for 1 hour, 1d for 1 day Leave empty for a permenant ban.", inline: true })
            .addFields({ name: "/unban", value: "Unbans a user by their ID", inline: true })
            .addFields({ name: "/reaction-roles add", value: "Add a reaction role to a message", inline: true })
            .addFields({ name: "/reaction-roles remove", value: "Removes reaction role from message", inline: true })
            .addFields({ name: "/auto-role set", value: "Sets auto role for welcome system", inline: true })
            .addFields({ name: "/auto-role remove", value: "Removes auto role for welcome system", inline: true })
            .addFields({ name: "/welcome-channel set", value: "Changes welcome message channel", inline: true })
            .addFields({ name: "/welcome-channel remove", value: "Removes welcome channel", inline: true })
            .addFields({ name: "/welcome-setup", value: "Sets up welcome system", inline: true })
            .addFields({ name: "/welcome-disable", value: "Removes welcome system", inline: true })
            .addFields({ name: "/warn", value: "Warns a member", inline: true })
            .addFields({ name: "/warnings", value: "Gets a users warns", inline: true })
            .addFields({ name: "/clearwarn", value: "Clears a users warns", inline: true })
            // as there are more moderation cmds, manually add them here one line above
            .setFooter({ text: "Moderation Commands" })

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('page1')
                    .setLabel('Page 1')
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId('page2')
                    .setLabel('Page 2')
                    .setStyle(ButtonStyle.Success),
            )

        const message = await interaction.reply({ embeds: [help], components: [button] });
        const collector = await message.createMessageComponentCollector();

        collector.on('collect', async i => {
            if (i.customId === 'page1') {
                if (i.user.id !== interaction.user.id) {
                    return await i.reply({ content: `Only ${interaction.user.tag} can use these buttons!`, ephemeral: true })
                }
                await i.update({ embeds: [community], components: [button] })
            }

            if (i.customId === 'page2') {
                if (i.user.id !== interaction.user.id) {
                    return await i.reply({ content: `Only ${interaction.user.tag} can use these buttons!`, ephemeral: true })
                }
                await i.update({ embeds: [moderation], components: [button] })
            }
        })

    }
}
