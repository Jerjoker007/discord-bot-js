"use strict";
module.exports = {

    getDbData: async(db, userId) => {
        const result = await db.query(
            `SELECT d.char_id, c.name 
            FROM discord d
            LEFT JOIN characters c
                ON d.char_id = c.id
            WHERE discord_id = $1`,
            [userId]
        );

        if (!result.rowCount) return null;

        const row = result.rows[0];

        return {
            char_id: row.char_id,
            inGameName: row.name,
        };
    }
};