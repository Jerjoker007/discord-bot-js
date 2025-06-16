# 🐍 Raviente Event Bot (Rain Discord Server)

A custom Discord bot developed for the **Rain** server to manage **Raviente batch submissions** during our Monster Hunter Frontier Z Zenith events.

This bot simplifies the submission, review, and logging process of player screenshots related to the Raviente event.

---

## ⚙️ Current Features

- 📤 `/ravi-submit`  
  Players can submit their screenshots tied to one of the four defined batches.  
  The bot checks necessary player data in a database before accepting the submission (includes: `char_id`, `title`, `bounty coin`, `gacha ticket`).

- 🧾 `/ravi-batch-review`  
  Admins can review each batch's submissions and reject them if necessary.

- 🛠️ `/ravi-config channel`  
  Sets up the 3 channels used by the bot:
  - **Receptionist Channel** → where players submit their screenshot andin which batch they participated
  - **Review Channel** → where admins evaluate each batche
  - **Error Channel** → for bot execution and database error logs

---

## 🏗️ Project Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Jerjoker007/raviente-bot.git
   cd raviente-bot
2. **Install dependencies**
   ```bash
   npm install
3. **Environment Variables**
   ```env
   DISCORD_BOT_TOKEN=your_discord_bot_token
   DISCORD_APPLICATION_ID=your_discord_application_id
   DISCORD_PUBLIC_KEY=your_public_id
   GUILD_ID=your_guild_id
   CLIENT_ID=your_client_id
   DB_USER=your_postgres_username
   DB_HOST=your_postgres_host
   DB_NAME=your_postgres_database_name
   DB_PASSWORD=your_postgres_password
   DB_PORT=your_postgres_port
4. **Start the bot**
   ```bash
   npm run dev

---

## 📁 Project Structure

```file strucure
guild-data/
├──guildData.json
node_modules/
src/
├── data/
│   ├── review
│   │   ├── activeBatchReview.json
│   │   └── raviRewards.json
│   └── interactionCreate/
│       └──submittedUsers.json
├── events/
│   ├── interactionCreate/
│   │    ├──handleButtons.js
│   │    ├──handleCommands.js
│   │    └──handleSelectMenu.js
│   └── ready/
│        ├──01registerCommands.js
│        └──consoleLog.js
├── handlers/
│   └──eventHandler.js
├── interaction/
│   ├──commands/misc/
│   │   ├── ravi-submit.js
│   │   ├── ravi-batch-review.js
│   │   └── ravi-config.js
│   ├──button/review/
│   │  ├──confirmBatch.js
│   │  ├──nextPage.js
│   │  └──prevPage.js
│   └──selectMenu/review/
│      └──removePlayer.js
├──state/
│  ├──batchManager.js
│  ├──globalState.js
│  ├──ownerInfos.js
│  └──submissionManager.js
├── utils/
│   ├──class/
│   |  ├──BatchReviewer.js
│   |  └──RewardDistributor.js
│   ├──db/
│   |  └──getDbData.js
│   ├── areCommandsDifferent.js
│   ├──commandAccess.js
│   ├──customId.js
│   ├──dbConnection.js
│   ├── getAllFiles.js
│   ├── getApplicationCommands.js
│   ├──getLocalButtons.js
│   ├── getLocalCommands.js
│   ├──getLocalSelectMenu.js
│   └──guildConfig.js
index.js
.env
config.json
package-lock.json
package.json
```

---

## 🔒 Permissions
The bot requires the following permissions:
- `Read Messages`
- `Send Messages`
- `Attach Files`
- `Use Application Commands`
- `Manage Channels` (optional, if dynamic creation is planned)

---

🧊 Future Plans
- None for now (until my "boss" ask for more feature)

---

*Developed with care for the Rain community.*
### -Artemis (from the Rain Staff)
