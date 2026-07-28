/*
 * discord/commands/archive.js
 * Execution logic for /archive slash command in Discord.
 */

const cases  = require('../../engine/cases');
const format = require('../formatters');

const PAGE_SIZE = 5;

async function execute(interaction) {
  const allReleased = cases.getAllReleasedCases();
  const totalPages  = Math.max(1, Math.ceil(allReleased.length / PAGE_SIZE));
  const slice       = allReleased.slice(0, PAGE_SIZE);

  const embed      = format.buildArchiveEmbed(slice, 0, totalPages);
  const components = format.buildArchiveComponents(slice, 0, totalPages);

  await interaction.reply({
    content: '**Official Investigation Archives Opened**',
    embeds: [embed],
    components: components,
    ephemeral: false
  });
}

module.exports = { execute };
