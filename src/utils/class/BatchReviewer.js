"use strict";
const path = require('path');
const { EmbedBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { encodeCustomId } = require('../customId');

class BatchReviewer {

    constructor(batchKey, interactionUser, currentPage = 0, playersPerPage = 25) {
        this.batchKey= batchKey;
        this.players = [];
        this.interactionUser = interactionUser;
        this.playersPerPage = playersPerPage;
        this.currentPage = currentPage;
    }

    async loadFile() {
        try {
            const { submissionManager } = require('../../state/globalState');
            const batchData = await submissionManager.fetchBatch(this.batchKey);

            this.players = Object.entries(batchData).map(([userId, data]) => ({
                id: userId,
                name: data.inGameName,
            }));
        
        } catch (err) {
            throw new Error('Error loading JSON files (BatchReview): ' + err.message);
        }
    }

    get totalPages() {
        return Math.ceil(this.players.length / this.playersPerPage);
    }

    getAllPlayers() {
        return this.players;
    }

    getPlayerForPage(page) {
        const start = page * this.playersPerPage;
        return this.players.slice(start, start + this.playersPerPage);
    }

    nextPage() {
        if (this.currentPage < this.totalPages -1) this.currentPage++;
    }

    prevPage() {
        if (this.currentPage > 0) this.currentPage--;
    }

    removePlayerById(userId) {
        this.players = this.players.filter(player => !userId.includes(player.id));

        if (this.currentPage >= this.totalPages) {
            this.currentPage = Math.max(0, this.totalPages - 1);
        }
    }

    generateEmbed() {
        const fields = [];

        for (let page = 0; page < this.totalPages; page++) {
            const pagePlayers = this.getPlayerForPage(page);
            const playerList = pagePlayers
                .map((p, i) => `\`${page * this.playersPerPage + i + 1}.\` ${p.name}`)
                .join('\n') || '*No players*';
            
            fields.push({
                name: `Page ${page + 1}`,
                value: playerList,
                inline: true
            });
        }

        return new EmbedBuilder()
            .setTitle(`Batch ${this.batchKey.split('-')[1]} Players - Page ${this.currentPage + 1} / ${this.totalPages}`)
            .setDescription(`Currently viewing page ${this.currentPage + 1}.`)
            .setColor(0x94fc03)
            .addFields(fields)
            .setAuthor({ name: this.interactionUser.username, iconURL: this.interactionUser.avatarURL })
            .setTimestamp();
    }

    generateSelectMenu() {
        const players = this.getPlayerForPage(this.currentPage);

        if (!players.length) return null;

        const options = players.map(player => ({
            label: player.name,
            value: player.id,
            description: `ID: ${player.id}`,
        }));

        return new StringSelectMenuBuilder()
            .setCustomId(`${encodeCustomId(
                'ravi',
                'remove-player',
                {
                    batchKey: `${this.batchKey}`,
                    interactionUserId: `${this.interactionUser.id}`,
                }
            )}`)
            .setPlaceholder('Select player(s) to remove')
            .addOptions(options);
    }

    generateButtons() {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`${encodeCustomId(
                    'ravi',
                    'prev-page',
                    {
                        batchKey: `${this.batchKey}`,
                    }
                )}`)
                .setLabel('◀')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(this.currentPage === 0),

            new ButtonBuilder()
                .setCustomId(`${encodeCustomId(
                    'ravi',
                    'batch-confirm',
                    {
                        batchKey: `${this.batchKey}`,
                        interactionUserId: `${this.interactionUser.id}`,
                    }
                )}`)
                .setLabel('Confirm')
                .setStyle(ButtonStyle.Success),
            
            new ButtonBuilder()
                .setCustomId(`${encodeCustomId(
                    'ravi',
                    'batch-delay',
                    {
                        batchKey: `${this.batchKey}`,
                        interactionUserId: `${this.interactionUser.id}`,
                    }
                )}`)
                .setLabel('Delay')
                .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()
                .setCustomId(`${encodeCustomId(
                    'ravi',
                    'next-page',
                    {
                        batchKey: `${this.batchKey}`,
                    }
                )}`)
                .setLabel('▶')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(this.currentPage === this.totalPages - 1)
        );
    }

    buildComponents() {
        const components = [];

        const selectMenu = this.generateSelectMenu();
        if (selectMenu) components.push(new ActionRowBuilder().addComponents(selectMenu));

        components.push(this.generateButtons());
        return components;
    }
}

module.exports = BatchReviewer;