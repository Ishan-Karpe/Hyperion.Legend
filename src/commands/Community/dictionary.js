const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dictionary')
        .setDescription("This gets the definition and examples of a given word")
        .addStringOption(option => option.setName('word').setDescription('This is the word you want to look up').setRequired(true)),
    async execute(interaction) {
        const word = interaction.options.getString('word');

        let data = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)

        if (data.statusText == 'Not Found') {
            return interaction.reply({ content: 'That word does not exist', ephemeral: true });

        }

        let info = await data.json();
        let result = info[0];

        let embedInfo = await result.meanings.map((data, index) => {

            let definition = data.definitions[0].definition || 'No Definition Found';
            let example = data.definitions[0].example || 'No Example Found';

            return {
                name: data.partOfSpeech.toUpperCase(),
                value: `\`\`\` Definition: ${definition} \n Example: ${example} \`\`\``,
            };

        });

        const dict = new EmbedBuilder()
            .setColor("Blurple")
            .setTitle(`Definiton of **${result.word}**`)
            .addFields(embedInfo)
            .setTimestamp()

        await interaction.reply({ embeds: [dict] });
    }
}