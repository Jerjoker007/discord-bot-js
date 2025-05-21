"use strict";
const { Client, Interaction } = require('discord.js');
const { devs } = require('../../../config.json');
/**
 * 
 * @param {Client} ravi 
 * @param {Interaction} interaction 
 */
module.exports = async (ravi, interaction) => {
    if (!interaction.isButton()) return;

    const submitChannel = '1374042127121518785';
    
    const [action, ...params] = interaction.customId.split('|');
    const infos = Object.fromEntries(params.map(p => p.split(':')));

    console.log(action);
    console.log(infos.userId);
};