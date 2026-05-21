const express = require('express');
const { Client } = require('@notionhq/client');

const app = express();
app.use(express.json());

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const NOTION_DB_ID = process.env.NOTION_DB_ID;
const MY_TELEGRAM_ID = '7834118306';

async function saveToNotion(message) {
  const response = await notion.databases.query({
    database_id: NOTION_DB_ID,
    sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    page_size: 1,
  });

  const latestPage = response.results[0];

  if (!latestPage) {
    console.log('❌ No page found in Notion DB');
    return;
  }

  await notion.pages.update({
    page_id: latestPage.id,
    properties: {
      Message: {
        rich_text: [{ text: { content: message } }],
      },
    },
  });

  console.log(`✅ Updated latest page with: "${message}"`);
}

app.post('/webhook', async (req, res) => {
  const message = req.body.message;

  if (!message || !message.text) return res.sendStatus(200);

  const senderId = String(message.from.id);

  if (senderId !== MY_TELEGRAM_ID) return res.sendStatus(200);

  await saveToNotion(message.text);

  res.sendStatus(200);
});

app.get('/', (req, res) => res.send('Bot is running!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🤖 Bot running on port ${PORT}`));