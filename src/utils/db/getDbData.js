"use strict";
module.exports = {

    async getDbData(db, userId) {
        const result = await db.query(
            `SELECT d.char_id, d.bounty, d.gacha, d.title, c.name 
            FROM discord d
            LEFT JOIN character c
                ON d.char_id = c.id
            WHERE discord_id = $1`,
            [userId]
        );

        if (!result.rowCount) return null;

        const row = result.rows[0];
        let bcMultiplier = 1.0;

        if (row.title > 4) bcMultiplier = 1.4;
        else if (row.title < 4 && row.title >= 2) bcMultiplier = 1.2;
        else if (row.title == 1) bcMultiplier = 1.1;

        return {
            char_id: row.char_id,
            inGameName: row.name,
            bounty: row.bounty,
            gacha: row.gacha,
            bcMultiplier: bcMultiplier,
        };
    }
};