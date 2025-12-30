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
    let currentPage = 15; // Starting point 

    try {
        while (allArticles.length < 5 && currentPage > 0) {
            const URL = `https://beyondchats.com/blogs/page/${currentPage}/`;
            console.log(`--- Requesting Page ${currentPage} ---`);

            const { data } = await axios.get(URL, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            const $ = cheerio.load(data);
            const pageArticles = [];

            $('article, .elementor-post').each((i, el) => {
                const title = $(el).find('h2').text().trim();
                const url = $(el).find('a').attr('href');
                const content = $(el).find('.entry-content, p').first().text().trim();

                if (title && url) {
                    pageArticles.push({ title, content, url });
                }
            });

            console.log(`Found ${pageArticles.length} articles on Page ${currentPage}`);

            allArticles = [...allArticles, ...pageArticles.reverse()];

            console.log(`Total collected so far: ${allArticles.length}`);


            if (allArticles.length < 5) {
                currentPage--;
            } else {
                console.log("Requirement met (5 articles found). Stopping loop.");
                break; 
            }
        }

        const finalFive = allArticles.slice(0, 5);
        console.log(`Finalizing: Saving ${finalFive.length} articles to DB `);

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
        console.error("Scraping Loop Error:", error.message);
        throw error; 
    }
};

// POST: Trigger manual scrape 
app.post('/api/articles/scrape', async (req, res) => {
    try {
        const count = await scrapeBeyondChats();
        res.status(201).json({ message: `Successfully scraped ${count} articles` });
    } catch (err) {
        res.status(500).json({ error: "Failed to scrape articles", details: err.message });
    }
});

// GET: Fetch articles 
app.get('/api/articles', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM articles ORDER BY created_at ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT: Update article with LLM version 
app.put('/api/articles/:id', async (req, res) => {
    const { id } = req.params;
    const { updated_content, reference_links } = req.body; 

    try {
        // We use JSON.stringify to ensure the array is stored correctly as JSONB
        const queryText = `
            UPDATE articles 
            SET updated_content = $1, 
                reference_links = $2, 
                is_updated = TRUE 
            WHERE id = $3
        `;
        
        await db.query(queryText, [
            updated_content, 
            JSON.stringify(reference_links), 
            id
        ]);

        res.json({ message: "Article updated successfully" });
    } catch (err) {
        console.error("Database Update Error:", err.message);
        res.status(500).json({ error: "Database update failed", details: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));