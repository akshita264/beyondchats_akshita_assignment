const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const db = require('./db');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const scrapeBeyondChats = async () => {
    const URL = "https://beyondchats.com/blogs/";
    try {
        const { data } = await axios.get(URL);
        const $ = cheerio.load(data);
        const articles = [];

       
        $('.post-item').slice(-5).each((i, el) => {
            articles.push({
                title: $(el).find('h2').text().trim(),
                content: $(el).find('.entry-content').text().trim() || $(el).find('p').text().trim(),
                url: $(el).find('a').attr('href')
            });
        });

        for (const art of articles) {
            const queryText = `
                INSERT INTO articles (title, original_content, source_url) 
                VALUES ($1, $2, $3) 
                ON CONFLICT (source_url) DO NOTHING
            `;
            await db.query(queryText, [art.title, art.content, art.url]);
        }
        return articles.length;
    } catch (error) {
        console.error("Scraping Error:", error);
        throw error;
    }
};

// Scrape and store articles
app.post('/api/articles/scrape', async (req, res) => {
    try {
        const count = await scrapeBeyondChats();
        res.status(201).json({ message: `Successfully scraped ${count} articles [cite: 11]` });
    } catch (err) {
        res.status(500).json({ error: "Failed to scrape articles" });
    }
});

// Read all articles
app.get('/api/articles', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM articles ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update article 
app.put('/api/articles/:id', async (req, res) => {
    const { id } = req.params;
    const { updated_content } = req.body;
    try {
        await db.query(
            'UPDATE articles SET updated_content = $1, is_updated = TRUE WHERE id = $2',
            [updated_content, id]
        );
        res.json({ message: "Article updated successfully [cite: 21]" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} `));