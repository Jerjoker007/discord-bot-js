"use strict";
const path = require('path');
const { EmbedBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { encodeCustomId } = require('../customId');

class BatchReviewer {

    constructor(batchKey, user, currentPage = 0, playersPerPage = 25) {
        this.batchKey= batchKey;
        this.players = [];
        this.user = user;
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
        this.players.filter(player => !userId.includes(player.id));

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
            .setTitle(`Batch Players - Page ${this.currentPage + 1} / ${this.totalPages}`)
            .setDescription(`Currently viewing page ${this.currentPage + 1}.`)
            .setColor(0xfcba03)
            .addFields(fields)
            .setAuthor({ name: `${this.user.username}`, iconURL: `${this.user.avatarURL}` })
            .setTimestamp();
    }

    generateSelectMenu() {
        const options = this.getPlayerForPage(this.currentPage).map(player => ({
            label: player.name,
            value: player.id,
            description: `ID: ${player.id}`,
        }));

        return new StringSelectMenuBuilder()
            .setCustomId(`${encodeCustomId(
                'ravi',
                'remove-player' 
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
                        batch: `${this.batchKey}`,
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
                        batch: `${this.batchKey}`,
                    }
                )}`)
                .setLabel('Confirm')
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId(`${encodeCustomId(
                    'ravi',
                    'next-page',
                    {
                        batch: `${this.batchKey}`,
                    }
                )}`)
                .setLabel('▶')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(this.currentPage === this.totalPages - 1)
        );
    }

    buildComponents() {
        return [
            new ActionRowBuilder().addComponents(this.generateSelectMenu()),
            this.generateButtons()
        ];
    }
}

module.exports = BatchReviewer;