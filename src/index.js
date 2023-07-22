// Import necessary packages
const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, Collection, ActivityType, Events, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType} = require(`discord.js`);
const fs = require('fs');
const { report } = require('process');
require('dotenv/config');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const banschema = require('./Schemas.js/bans');
const welcomeschema = require('./Schemas.js/welcome');
const roleschema = require('./Schemas.js/auto-role')

// Set prefix for commands
const prefix = "_";

// Create a new Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ]
});

// Create an array of statuses for the bot to cycle through
let status = [
    {
        name: "Discord Servers Worldwide",
        type: ActivityType.Watching,
    },
    {
        name: "AutoMod",
        type: ActivityType.Playing
    },
    {
        name: "Best Songs of All Time",
        type: ActivityType.Streaming,
        url: 'https://www.youtube.com/watch?v=JZPggWeQnbs'
    },
    {
        name: "an Assetto Corsa Race",
        type: ActivityType.Competing,
    },
]

const process = require('node:process');

process.on('unhandledRejection', async (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
})

process.on('uncaughtException', (err) => {
    console.log('Uncaught Exception:', err);
});

process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.log('Uncaught Exception Montior:', err, origin);
})

// BANS LOGIC //

setInterval(async () => {
 
    const bans = await banschema.find();
    if(!bans) return;
    else {
        bans.forEach(async ban => {
 
            if (ban.Time > Date.now()) return;
 
            let server = await client.guilds.cache.get(ban.Guild);
            if (!server) {
                console.log('no server')
                return await banschema.deleteMany({
                    Guild: server.id
                });
                
            }

            await server.bans.fetch().then(async bans => {

                if (bans.size === 0) {
                    console.log('bans were 0')

                    return await banschema.deleteMany({
                        Guild: server.id
                    });

                   

                } else {

                    let user = client.users.cache.get(ban.User)
                    if (!user) {
                        console.log('no user found')
                        return await banschema.deleteMany({
                            User: ban.User,
                            Guild: server.id
                        });
                    }

                    await server.bans.remove(ban.User).catch(err => {
                        console.log('couldnt unban')
                        return;
                    })

                    await banschema.deleteMany({
                        User: ban.User,
                        Guild: server.id
                    });

                }
            })
        })
    }

}, 30000);

// // When the bot is ready, log a message and set its activity to a random status from the array
client.on("ready", () => {
    console.log("Bot Online!")

    setInterval(() => {
        let random = Math.floor(Math.random() * status.length);
        client.user.setActivity(status[random]);
    }, 15000);
})

// Leave Message //

client.on(Events.GuildMemberRemove, async (member, err) => {

    const leavedata = await welcomeschema.findOne({ Guild: member.guild.id });

    if (!leavedata) return;
    else {

        const channelID = leavedata.Channel;
        const channelwelcome = member.guild.channels.cache.get(channelID);

        const embedleave = new EmbedBuilder()
        .setColor("DarkBlue")
        .setTitle(`${member.user.username} has left`)
        .setDescription( `> ${member} has left the Server`)
        .setFooter({ text: `👋 Cast your goodbyes`})
        .setTimestamp()
        .setAuthor({ name: `👋 Member Left`})

        const welmsg = await channelwelcome.send({ embeds: [embedleave]}).catch(err);
        welmsg.react('👋');
    }
})

// Welcome Message //

client.on(Events.GuildMemberAdd, async (member, err) => {

    const welcomedata = await welcomeschema.findOne({ Guild: member.guild.id });

    if (!welcomedata) return;
    else {

        const channelID = welcomedata.Channel;
        const channelwelcome = member.guild.channels.cache.get(channelID)
        const roledata = await roleschema.findOne({ Guild: member.guild.id });

        if (roledata) {
            const giverole = await member.guild.roles.cache.get(roledata.Role)

            member.roles.add(giverole).catch(err => {
                console.log('Error received trying to give an auto role!');
            })
        }
        
        const embedwelcome = new EmbedBuilder()
         .setColor("DarkBlue")
         .setTitle(`${member.user.username} has arrived\nto the Server!`)
         .setDescription( `> Welcome ${member} to the Server! Please make sure to read the https://discord.com/channels/1123564235570556928/1123904677797445674 and react to access the full server. Enjoy your stay!`)
         .setFooter({ text: `👋 Get cozy and enjoy :)`})
         .setTimestamp()
         .setAuthor({ name: `👋 Welcome to the Server!`})
    
        const embedwelcomedm = new EmbedBuilder()
         .setColor("DarkBlue")
         .setTitle('Welcome Message')
         .setDescription( `> Welcome to ${member.guild.name}!`)
         .setFooter({ text: `👋 Get cozy and enjoy :)`})
         .setTimestamp()
         .setAuthor({ name: `👋 Welcome to the Server!`})
    
        const levmsg = await channelwelcome.send({ embeds: [embedwelcome]});
        levmsg.react('👋');
        member.send({ embeds: [embedwelcomedm]}).catch(err => console.log(`Welcome DM error: ${err}`))
    
    } 
})

//ticket system
const ticketSchema = require("./Schemas.js/ticketSchema");
client.on(Events.InteractionCreate, async interaction => {

    if (interaction.isButton()) return;
    if (interaction.isChatInputCommand()) return;

    const modal = new ModalBuilder()
        .setTitle("Provide us with more information.")
        .setCustomId("modal")

    const email = new TextInputBuilder()
        .setCustomId("email")
        .setRequired(true)
        .setLabel("Provide us with your email.")
        .setPlaceholder("You must enter a valid email")
        .setStyle(TextInputStyle.Short)

    const username = new TextInputBuilder()
        .setCustomId("username")
        .setRequired(true)
        .setLabel("Provide us with your username please.")
        .setPlaceholder("Username")
        .setStyle(TextInputStyle.Short)

    const reason = new TextInputBuilder()
        .setCustomId("reason")
        .setRequired(true)
        .setLabel("The reason for this ticket?")
        .setPlaceholder("Give us a reason for opening this ticket")
        .setStyle(TextInputStyle.Short)

    const firstActionRow = new ActionRowBuilder().addComponents(email)
    const secondActionRow = new ActionRowBuilder().addComponents(username)
    const thirdActionRow = new ActionRowBuilder().addComponents(reason)

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

    let choices;
    if (interaction.isStringSelectMenu()) {

        choices = interaction.values;

        const result = choices.join("");

        ticketSchema.findOne({ Guild: interaction.guild.id }, async (err, data) => {

            const filter = { Guild: interaction.guild.id };
            const update = { Ticket: result };

            ticketSchema.updateOne(filter, update, {
                new: true
            }).then(value => {
                console.log(value)
            })
        })
    }

    if (!interaction.isModalSubmit()) {
        interaction.showModal(modal)
    }
})

client.on(Events.InteractionCreate, async interaction => {

    if (interaction.isModalSubmit()) {

        if (interaction.customId == "modal") {

            ticketSchema.findOne({ Guild: interaction.guild.id }, async (err, data) => {

                const emailInput = interaction.fields.getTextInputValue("email")
                const usernameInput = interaction.fields.getTextInputValue("username")
                const reasonInput = interaction.fields.getTextInputValue("reason")

                const posChannel = await interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.id}`);
                if (posChannel) return await interaction.reply({ content: `You already have a ticket open - ${posChannel}`, ephemeral: true });

                const category = data.Channel;

                const embed = new EmbedBuilder()
                    .setColor("Blue")
                    .setTitle(`${interaction.user.id}'s Ticket`)
                    .setDescription("Welcome to your ticket! Please wait while the staff team review the details.")
                    .addFields({ name: `Email`, value: `${emailInput}` })
                    .addFields({ name: `Username`, value: `${usernameInput}` })
                    .addFields({ name: `Reason`, value: `${reasonInput}` })
                    .addFields({ name: `Type`, value: `${data.Ticket}` })
                    .setFooter({ text: `${interaction.guild.name}'s tickets.` })

                const button = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("ticket")
                            .setLabel("🗑️ Close Ticket")
                            .setStyle(ButtonStyle.Danger)
                    )

                let channel = await interaction.guild.channels.create({
                    name: `ticket-${interaction.user.id}`,
                    type: ChannelType.GuildText,
                    parent: `${category}`
                })

                let msg = await channel.send({ embeds: [embed], components: [button] });
                await interaction.reply({ content: `Your ticket is now open inside of ${channel}.`, ephemeral: true });

                const collector = msg.createMessageComponentCollector()

                collector.on("collect", async i => {
                    await channel.delete();

                    const dmEmbed = new EmbedBuilder()
                        .setColor("Blue")
                        .setTitle("Your ticket has been closed")
                        .setDescription("Thanks for contacting us! If you need anything else just feel free to open up another ticket!")
                        .setTimestamp()

                    await interaction.member.send({ embeds: [dmEmbed] }).catch(err => {
                        return;
                    })
                })
            })
        }
    }
})





client.snipes = new Map()
client.on('messageDelete', function(message, channel) {
    client.snipes.set(message.channel.id, {
        content: message.content,
        author: message.author,
        image: message.attachments.first() ? message.attachments.first().proxyURL : null
    })
})

// POLL SYSTEM //

const pollschema = require('./Schemas.js/votes');
const pollsetup = require('./Schemas.js/votesetup');

client.on(Events.MessageCreate, async message => {

    if (!message.guild) return;

    const setupdata = await pollsetup.findOne({ Guild: message.guild.id });
    if (!setupdata) return;

    if (message.channel.id !== setupdata.Channel) return;
    if (message.author.bot) return;

    const embed = new EmbedBuilder()
    .setColor("#ecb6d3")
    .setAuthor({ name: `🤚 Poll System`})
    .setFooter({ text: `🤚 Poll Started`})
    .setTimestamp()
    .setTitle('• Poll Began')
    .setDescription(`> ${message.content}`)
    .addFields({ name: `• Upvotes`, value: `> **No votes**`, inline: true})
    .addFields({ name: `• Downvotes`, value: `> **No votes**`, inline: true})
    .addFields({ name: `• Author`, value: `> ${message.author}`})

    try {
        await message.delete();
    } catch (err) {

    }

    const buttons = new ActionRowBuilder()
    .addComponents(

        new ButtonBuilder()
        .setCustomId('up')
        .setLabel(' ')
        .setEmoji('<:tick:1102942811101335593>')
        .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
        .setCustomId('down')
        .setLabel(' ')
        .setEmoji('<:crossmark:1102943024415260673>')
        .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
        .setCustomId('votes')
        .setLabel('• Votes')
        .setStyle(ButtonStyle.Secondary)
    )

    const msg = await message.channel.send({ embeds: [embed], components: [buttons] });
    msg.createMessageComponentCollector();

    await pollschema.create({
        Msg: msg.id,
        Upvote: 0,
        Downvote: 0,
        UpMembers: [],
        DownMembers: [],
        Guild: message.guild.id,
        Owner: message.author.id
    })
})

client.on(Events.InteractionCreate, async i => {

    if (!i.guild) return;
    if (!i.message) return;

    const data = await pollschema.findOne({ Guild: i.guild.id, Msg: i.message.id });
    const msg = await i.channel.messages.fetch(data.Msg)

        if (i.customId === 'up') {

            if (i.user.id === data.Owner) return await i.reply({ content: `❌ You **cannot** upvote your own **poll**!`, ephemeral: true });
            if (data.UpMembers.includes(i.user.id)) return await i.reply({ content: `❌ You have **already** upvoted this **poll**`, ephemeral: true});

            let downvotes = data.Downvote;
            if (data.DownMembers.includes(i.user.id)) {
                downvotes = downvotes - 1;
            }

            const newembed = EmbedBuilder.from(msg.embeds[0]).setFields({ name: `• Upvotes`, value: `> **${data.Upvote + 1}** Votes`, inline: true}, { name: `• Downvotes`, value: `> **${downvotes}** Votes`, inline: true}, { name: `• Author`, value: `> <@${data.Owner}>`});

            const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setCustomId('up')
                .setEmoji('<:tick:1102942811101335593>')
                .setLabel(`${data.Upvote + 1}`)
                .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                .setCustomId('down')
                .setEmoji('<:crossmark:1102943024415260673>')
                .setLabel(`${downvotes}`)
                .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                .setCustomId('votes')
                .setLabel('• Votes')
                .setStyle(ButtonStyle.Secondary)
            )

            await i.update({ embeds: [newembed], components: [buttons] })

            data.Upvote++

            if (data.DownMembers.includes(i.user.id)) {
                data.Downvote = data.Downvote - 1;
            }

            data.UpMembers.push(i.user.id)
            data.DownMembers.pull(i.user.id)
            data.save();
            
        }

        if (i.customId === 'down') {

            if (i.user.id === data.Owner) return await i.reply({ content: `❌ You **cannot** downvote your own **poll**!`, ephemeral: true });
            if (data.DownMembers.includes(i.user.id)) return await i.reply({ content: `❌ You have **already** downvoted this **poll**`, ephemeral: true});

            let upvotes = data.Upvote;
            if (data.UpMembers.includes(i.user.id)) {
                upvotes = upvotes - 1;
            }

            const newembed = EmbedBuilder.from(msg.embeds[0]).setFields({ name: `• Upvotes`, value: `> **${upvotes}** Votes`, inline: true}, { name: `• Downvotes`, value: `> **${data.Downvote + 1}** Votes`, inline: true}, { name: `• Author`, value: `> <@${data.Owner}>`});

            const buttons = new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                .setCustomId('up')
                .setEmoji('<:tick:1102942811101335593>')
                .setLabel(`${upvotes}`)
                .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                .setCustomId('down')
                .setEmoji('<:crossmark:1102943024415260673>')
                .setLabel(`${data.Downvote + 1}`)
                .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                .setCustomId('votes')
                .setLabel('• Votes')
                .setStyle(ButtonStyle.Secondary)
            )

            await i.update({ embeds: [newembed], components: [buttons] })

            data.Downvote++

            if (data.UpMembers.includes(i.user.id)) {
                data.Upvote = data.Upvote - 1;
            }

            data.DownMembers.push(i.user.id);
            data.UpMembers.pull(i.user.id);
            data.save();
            
        }

        if (i.customId === 'votes') {

            let upvoters = [];
            await data.UpMembers.forEach(async member => {
                upvoters.push(`<@${member}>`)
            })

            let downvoters = [];
            await data.DownMembers.forEach(async member => {
                downvoters.push(`<@${member}>`)
            })

            const embed = new EmbedBuilder()
            .setTitle('> Poll Votes')
            .setColor("#ecb6d3")
            .setAuthor({ name: `🤚 Poll System`})
            .setFooter({ text: `🤚 Poll Members`})
            .setTimestamp()
            .addFields({ name: `• Upvoters (${upvoters.length})`, value: `> ${upvoters.join(', ').slice(0, 1020) || 'No upvoters'}`, inline: true})
            .addFields({ name: `• Downvoters (${downvoters.length})`, value: `> ${downvoters.join(', ').slice(0, 1020) || 'No downvoters'}`, inline: true})

            await i.reply({ embeds: [embed], ephemeral: true })
        }
})

const reactions = require('./Schemas.js/reactionrs');
client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if(!reaction.message.guildId) return;
    if(user.bot) return

    let cID = `<:${reaction.emoji.name}:${reaction.id}>`;
    if(!reaction.emoji.id) cID = reaction.emoji.name;

    const data = await reactions.findOne({ Guild: reaction.message.guildId, Message: reaction.message.id, Emoji: cID });

    if(!data) return;

    const guild = await client.guilds.cache.get(reaction.message.guildId);
    const member = await guild.members.cache.get(user.id)

    try {
        await member.roles.add(data.Role);
    } catch (e) {
        return;
    }
});




client.on(Events.MessageReactionRemove, async (reaction, user) => {
    if(!reaction.message.guildId) return;
    if(user.bot) return

    let cID = `<:${reaction.emoji.name}:${reaction.id}>`;
    if(!reaction.emoji.id) cID = reaction.emoji.name;

    const data = await reactions.findOne({ Guild: reaction.message.guildId, Message: reaction.message.id, Emoji: cID });

    if(!data) return;

    const guild = await client.guilds.cache.get(reaction.message.guildId);
    const member = await guild.members.cache.get(user.id)

    try {
        await member.roles.remove(data.Role);
    } catch (e) {
        return;
    }
});




// Create a collection to hold the bot's commands
client.commands = new Collection();

// Read all function files from the "functions" directory
const functions = fs.readdirSync("./src/functions/").filter(file => file.endsWith(".js"));

// Read all event files from the "events" directory
const eventFiles = fs.readdirSync("./src/events/").filter(file => file.endsWith(".js"));

// Read all command folders from the "commands" directory
const commandFolders = fs.readdirSync("./src/commands/");

// Require all function files and run the "handleEvents" and "handleCommands" functions to load and handle events and commands
(async () => {
    for (file of functions) {
        require(`./functions/${file}`)(client);
    }
    client.handleEvents(eventFiles, ".src/events/");
    client.handleCommands(commandFolders, "./src/commands/");
})();

// When a new message is received, check if it is a command and handle it accordingly
client.on('messageCreate', (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();
    const messageArray = message.content.split(" ");
    const argument = messageArray.slice(1);
    const cmd = messageArray[0];



    // Handle the "_test" command
    if (command === 'test') {
        message.channel.send("Bot works!")
    }

    // Handle the "_ban" command
    if (command === 'ban') {

        // Get the member to be banned
        const member = message.mentions.members.first() || message.guild.members.cache.get(argument[0]) || message.guild.members.cache.find(x => x.user.username.toLowerCase() === argument.slice(0).join(" " || x.user.username === argument[0]));

        // Check if the user has permission to ban members, if the member to be banned is specified, if the member is not the person issuing the command, and if the member is ban-able
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return message.channel.send("You don't have permission to ban people in this server!");
        if (!member) return message.channel.send("You must specify someone to ban in this command!")
        if (message.member === member) return message.channel.send("You cannot ban yourself.");
        if (!member.kickable) return message.channel.send("You cannot ban this person!");

        // Get the reason for the ban
        let reason = argument.slice(1).join(" ") || "no reason given"

        // Create an embed for the ban message
        const ban = new EmbedBuilder()
            .setColor("DarkAqua")
            .setDescription(`:white_check_mark: ${member.user.tag} has been banned for ${reason}`)
            .setTimestamp()

        // Create an embed for the DM to the banned member, and send it
        const dmBan = new EmbedBuilder()
            .setColor("DarkAqua")
            .setTimestamp()
            .setDescription(`:white_check_mark: You were banned from ${message.guild.me} for ${reason}`)
        member.send({ embeds: [dmBan] }).catch(err => {
            console.log(`${member.user.tag} has their DMs off and cannot recieve the ban message.`);
        })

        // Ban the member and send the ban message
        member.ban().catch(err => {
            message.channel.send("There was an error banning this member.");const { SlashCommandBuilder } = require('@discordjs/builders');
        })
        message.channel.send({ embeds: [ban] });
    }

    // _members

    if (command === 'members') {
        const m = message.guild.memberCount;
        const b = message.guild.members.cache.filter(member => member.user.bot).size;

        const count = new EmbedBuilder()
            .setColor("Blurple")
            .setTitle("Member/Bot Count")
            .setTimestamp()
            .setDescription(`**Member Count:** ${m - b} \n \n**Bot Count:** ${b} \n \n**Total Members:** ${m}`)

        message.channel.send({ embeds: [count] })
    }

    //_timeout

    if (command === 'timeout') {
        const timeUser = message.mentions.members.first() || message.guild.members.cache.get(argument[0]) || message.guild.members.cache.find(x => x.user.username.toLowerCase() === argument.slice(0).join(" " || x.user.username === argument[0]));
        const duration = argument[1];

        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return message.channel.send("You don't have permission to time people out in this server!");
        if (!timeUser) return message.channel.send("Please Specify a member to timeout.");
        if (message.member === timeUser) return message.channel.send("You can't timeout yourself")
        if (!duration) return message.channel.send("Please specify a duration in which you want the member to be timed out for.");
        if (duration > 604800) return message.channel.send("Please specify a duration beetween 1 and 604800 (one week) seconds");
        if (!timeUser.kickable) return message.channel.send("You can't timeout this person")

        if (isNaN(duration)) {
            return message.channel.send("Please specify a vaild number in the duration section.")
        }

        let reason = argument.slice(2).join(" ") || 'no reason given.';

        const serverTimeout = new EmbedBuilder()
            .setColor("DarkGreen")
            .setDescription(`:white_check_mark: ${timeUser.user.tag} has been timed out for ${duration} seconds for ${reason}`)
            .setTimestamp()

        const dmTimeout = new EmbedBuilder()
            .setColor("DarkGreen")
            .setDescription(`:white_check_mark: You have been timed out in ${message.guild.name} for ${duration} seconds for ${reason}`)
            .setTimestamp()

        timeUser.timeout(duration * 1000, reason);

        message.channel.send({ embeds: [serverTimeout] });
        timeUser.send({ embeds: [dmTimeout] }).catch(err => {
            return;
        });
    }

    // _untimeout

    if (command === 'untimeout') {
        const timeUser = message.mentions.members.first() || message.guild.members.cache.get(argument[0]) || message.guild.members.cache.find(x => x.user.username.toLowerCase() === argument.slice(0).join(" " || x.user.username === argument[0]));

        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return message.channel.send("You don't have permission to untimeout people in this server");
        if (!timeUser) return message.channel.send("Please Specify a member to untimeout.");
        if (message.member === timeUser) return message.channel.send("You can't untimeout yourself")
        if (!timeUser.kickable) return message.channel.send("You can't untimeout this person")


        const serverUntimeout = new EmbedBuilder()
            .setColor("DarkGreen")
            .setDescription(`:white_check_mark: ${timeUser.user.tag} has been untimed out.`)
            .setTimestamp()

        const dmUntimeout = new EmbedBuilder()
            .setColor("DarkGreen")
            .setDescription(`:white_check_mark: You have been untimed out in ${message.guild.name}.`)
            .setTimestamp()

        timeUser.timeout(null);

        message.channel.send({ embeds: [serverUntimeout] });
        timeUser.send({ embeds: [dmUntimeout] }).catch(err => {
            return;
        });

    }

    // _unban

    if (command === 'unban') {
        const member = args[0];

        let reason = argument.slice(1).join(" ") || 'no reason given';

        const unban = new EmbedBuilder()
            .setColor("DarkAqua")
            .setDescription(`:white_check_mark: <@${member}> has been unbanned for ${reason}`)
            .setTimestamp()

        message.guild.bans.fetch()
            .then(async bans => {
                if (bans.size == 0) return message.channel.send('There is no one banned in this server')

                let bannedID = bans.find(ban => ban.user.id == member);
                if (!bannedID) return await message.channel.send("The ID stated was not banned from the server");

                await message.guild.bans.remove(member, reason).catch(err => {
                    return message.channel.send("There was an error unbanning this member")
                })

                await message.channel.send({ embeds: [unban] })
            })

    }
    


})

// Log the bot in using the token specified in the environment variables
client.login(process.env.TOKEN) //check .env for instructions
