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
    let allArticles = [];
    let currentPage = 15; 

    try {
        while (allArticles.length < 5 && currentPage > 0) {
            const URL = `https://beyondchats.com/blogs/page/${currentPage}/`;
            const { data } = await axios.get(URL, {
                headers: { 'User-Agent': 'Mozilla/5.0...' }
            });

            const $ = cheerio.load(data);
            const pageArticles = [];

            $('article, .elementor-post').each((i, el) => {
                const title = $(el).find('h2').text().trim();
                const url = $(el).find('a').attr('href');
                const content = $(el).find('.entry-content, p').first().text().trim();
                if (title && url) pageArticles.push({ title, content, url });
            });

            allArticles = [...allArticles, ...pageArticles.reverse()];
            if (allArticles.length < 5) currentPage--;
            else break;
        }

        const finalFive = allArticles.slice(0, 5);
        for (const art of finalFive) {
            const queryText = `
                INSERT INTO articles (title, original_content, source_url) 
                VALUES ($1, $2, $3) 
                ON CONFLICT (source_url) DO NOTHING
            `;
            await db.query(queryText, [art.title, art.content, art.url]);
        }
        return finalFive.length;
    } catch (error) {
        console.error("Scraping Error:", error.message);
        throw error;
    }
};

const processArticlesWithAI = async () => {
    try {
        const { rows: unprocessed } = await db.query('SELECT * FROM articles WHERE is_updated = false');
        if (unprocessed.length === 0) {
            console.log("No new articles to process.");
            return;
        }

        for (const article of unprocessed) {
            console.log(`🤖 AI Processing: ${article.title}`);
            await db.query(
                'UPDATE articles SET updated_content = $1, is_updated = true WHERE id = $2',
                [`AI Transformed version of: ${article.title}`, article.id]
            );
        }
    } catch (error) {
        console.error("AI Error:", error.message);
    }
};

app.get('/api/articles', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM articles ORDER BY created_at ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);

    // This block triggers WITHOUT Postman every time the server starts
    try {
        console.log("[Startup Automation] Starting Scraper...");
        await scrapeBeyondChats();
        
        console.log("[Startup Automation] Starting AI Processor...");
        await processArticlesWithAI();
        
        console.log("[Startup Automation] Finished! Your site is now ready.");
    } catch (err) {
        console.error("Startup Automation failed:", err.message);
    }
});