// server.js
const fs = require('fs');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Usar CORS para permitir peticiones desde otras URLs (como index.html en local)
app.use(cors());

// Servir archivos estáticos (opcional, para la web)
app.use(express.static(path.join(__dirname, '.')));

// Conectar a la base de datos
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error("Error al conectar a la base de datos:", err.message);
    } else {
        console.log("Conectado a database.db");
    }
});
const json = JSON.parse(fs.readFileSync('../../database/database.json', 'utf8')) || [];
console.log("JSON:", json.length);

function runAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve(this); // `this.lastID` disponible aquí
        });
    });
}
function execAsync(sql) {
    return new Promise((resolve, reject) => {
        db.exec(sql, function (err) {
            if (err) return reject(err);
            resolve(this); // `this.lastID` disponible aquí
        });
    });
}
function queryAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}


async function verifyAnime(anime_id) {
    try {
        // await verifyEpisodes(anime_id);
        // await verifyPages(anime_id);
        return true;
    } catch (err) {
        console.error("Error al verificar episodios:", err.message);
        throw err;
    }
}
async function verifyEpisodes(anime_id) {
    try {
        const episodes = await queryAsync(`SELECT * FROM episodes WHERE anime_id = ?`, [anime_id]);
        if (episodes.length === 0) {
            console.log("No hay episodios para este anime.");
            return false;
        }
        for (const episode of episodes) {
            // await verifyEpisode(episode.id);
        }
        return true;
    } catch (err) {
        console.error("Error al verificar episodios:", err.message);
        throw err;
    }
}
async function verifyEpisode(episode_id) {
    try {
        let datetime = null;
        const episode = await queryAsync(`SELECT * FROM episodes WHERE id = ?`, [episode_id]);
        const links = await queryAsync(`SELECT * FROM links WHERE episode_id = ?`, [episode_id]);
        for (const link of links) {
            if (link.timestamp < episode[0].timestamp) {
                datetime = link.timestamp;
            }
        }
        if (datetime) {
            await runAsync(`UPDATE episodes SET timestamp = datetime(?) WHERE id = ?`, [datetime, episode_id]);
        }
        return true;
    } catch (err) {
        console.error("Error al verificar episodio:", err.message);
        throw err;
    }
}
async function verifyPages(anime_id) {
    try {
        const pages = await queryAsync(`SELECT * FROM page WHERE anime_id = ?`, [anime_id]);
        if (pages.length === 0) {
            console.log("No hay paginas para este anime.");
            return false;
        }
        for (const page of pages) {
            // await verifyPage(page.id);
        }
        return true;
    } catch (err) {
        console.error("Error al verificar episodios:", err.message);
        throw err;
    }
}
async function verifyPage(page_id) {
    try {
        let datetime = null;
        const page = await queryAsync(`SELECT * FROM page WHERE id = ?`, [page_id]);
        console.log("Verificando página:", page[0]);

        const links = await queryAsync(`
            SELECT l.id, l.episode_id, l.page, l.timestamp FROM links l 
            LEFT JOIN episodes e ON e.id = l.episode_id
            LEFT JOIN animes a ON a.id = e.anime_id
            WHERE l.page = ?`, [page[0].page]);
        console.log("Enlaces encontrados:", links);
        for (const link of links) {
            if (link.timestamp < page[0].timestamp) {
                datetime = link.timestamp;
            }
        }
        if (datetime) {
            await runAsync(`UPDATE page SET timestamp = datetime(?) WHERE id = ?`, [datetime, page_id]);
        }
        return true;
    } catch (err) {
        console.error("Error al verificar paginas:", err.message);
        throw err;
    }
}

async function addAnimeFromJSON(data) {
    try {
        const existingAnime = await queryAsync(`
            SELECT * FROM animes a 
            LEFT JOIN titles t ON a.id = t.anime_id 
            WHERE t.title = ?
        `, [data.titles[0]]);

        let animeId = existingAnime.length === 1 ? existingAnime[0].id : null;

        if (animeId) {
            console.log(`Ya existe el anime '${data.titles[0]}'`);
        } else {
            const isoDate = new Date(data.timestamp).toISOString().slice(0, 19).replace('T', ' ');
            const result = await runAsync(
                `INSERT INTO animes (type, status, lang, timestamp) VALUES (?, ?, ?, ?)`,
                [data.type, data.status, data.lang, isoDate]
            );
            animeId = result.lastID;
            console.log(`Se ha añadido el anime '${data.titles[0]}'`);
        }

        for (const title of data.titles) { await addTitle(animeId, title); }
        for (const page of data.pages) { await addPage(animeId, page.page, page.thumbnail, page.datetime); }
        for (const episode of data.episodes) { await addEpisode(animeId, episode.episode, episode.page, episode.url, timestamp); }
        for (const related of data.related) { await addRelated(animeId, related.title, related.relation); }
        return animeId;
    } catch (err) {
        console.error("Error al insertar anime:", err.message);
        throw err;
    }
}
async function addTitle(anime_id, title) {
    try {
        const existingTitle = await queryAsync(`SELECT * FROM titles WHERE anime_id = ? AND title = ?`, [anime_id, title]);
        if (existingTitle.length > 0) {
            // console.warn(`Ya existe el titulo '${title}'`);
        } else {
            await runAsync(`INSERT INTO titles (anime_id, title) VALUES (?, ?)`, [anime_id, title]);
            // console.log(`Se ha añadido el titulo '${title}'`);
        }
    } catch (err) {
        console.error("Error al insertar título:", err.message);
    }
}
async function addPage(anime_id, page, thumbnail, timestamp) {
    try {
        const existingPage = await queryAsync(`SELECT * FROM page WHERE anime_id = ? AND page = ?`, [anime_id, page]);
        if (existingPage.length < 1) {
            const isoDate = new Date(timestamp).toISOString().slice(0, 19).replace('T', ' ');
            await runAsync(`INSERT INTO page (anime_id, page, thumbnail, timestamp) VALUES (?, ?, ?, ?)`, [anime_id, page, thumbnail, isoDate]);
        }
    } catch (err) {
        console.error("Error al insertar página:", err.message);
    }
}
async function addEpisode(anime_id, episode, page, url, timestamp) {
    try {
        let episode_id = null;
        const existingEpisode = await queryAsync(`SELECT * FROM episodes WHERE anime_id = ? AND episode = ?`, [anime_id, episode]);
        if (existingEpisode.length > 0) {
            // console.log(`Ya existe el episodio ${episode} del anime ${anime_id}`);
            episode_id = existingEpisode[0].id;
        } else {
            const isoDate = new Date(timestamp).toISOString().slice(0, 19).replace('T', ' ');
            const result = await runAsync(`INSERT INTO episodes (anime_id, episode, timestamp) VALUES (?, ?, ?)`, [anime_id, episode, isoDate]);
            episode_id = result.lastID;
            // console.log(`Se ha añadido el episodio ${episode} del anime ${anime_id}`); 
        }
        await addLink(anime_id, episode_id, page, url, timestamp);
        return episode_id;
    } catch (err) {
        console.error("Error al insertar el episodio:", err.message);
        throw err;
    }
}
async function addLink(anime_id, episode_id, page, url, timestamp) {
    try {
        const existingLink = await queryAsync(`SELECT * FROM links WHERE episode_id = ? AND page = ?`, [episode_id, page]);
        if (existingLink.length < 1) {
            const isoDate = new Date(timestamp).toISOString().slice(0, 19).replace('T', ' ');
            await runAsync(`INSERT INTO links (episode_id, page, url, timestamp) VALUES (?, ?, ?, ?)`, [episode_id, page, url, isoDate]);
            await addPage(anime_id, page, url, timestamp);
        }
    } catch (err) {
        console.error("Error al insertar enlace:", err.message);
    }
}
async function addRelated(anime_id, title, relation) {
    try {
        // Buscar si ya existe esa relación
        const existingRelation = await queryAsync(`
            SELECT * FROM related 
            WHERE anime_id = ? 
            AND related_id = (SELECT anime_id FROM titles WHERE title = ? LIMIT 1)
        `, [anime_id, title]);

        if (existingRelation.length < 1) {
            // Obtener el id relacionado desde titles
            const relatedAnime = await queryAsync(
                `SELECT anime_id FROM titles WHERE title = ? LIMIT 1`,
                [title]
            );

            if (relatedAnime.length > 0) {
                const related_id = relatedAnime[0].anime_id;

                await runAsync(
                    `INSERT INTO related (anime_id, related_id, relation) VALUES (?, ?, ?)`,
                    [anime_id, related_id, relation]
                );
            }
        }
    } catch (err) {
        console.error("Error al insertar relación:", err.message);
    }
}
async function init() {
    // Eliminar
    await execAsync(`
        DROP TABLE IF EXISTS related;
        DROP TABLE IF EXISTS links;
        DROP TABLE IF EXISTS episodes;
        DROP TABLE IF EXISTS pages;
        DROP TABLE IF EXISTS titles;
        DROP TABLE IF EXISTS genres;
        DROP TABLE IF EXISTS animes;
        
        DROP TRIGGER IF EXISTS update_episode_timestamp_after_link_insert;
        DROP TRIGGER IF EXISTS update_episode_timestamp_after_link_update;
        DROP TRIGGER IF EXISTS update_anime_timestamp_after_page_insert;
        DROP TRIGGER IF EXISTS update_anime_timestamp_after_page_update;
    
        DROP VIEW IF EXISTS anime_view;
        DROP VIEW IF EXISTS genre_list;
    `);
    // Crear tablas
    await execAsync(`
        CREATE TABLE IF NOT EXISTS animes (
            id INTEGER PRIMARY KEY,
            status TEXT,
            type TEXT,
            lang TEXT,
            timestamp TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS genres (
            id INTEGER PRIMARY KEY,
            anime_id INTEGER,
            genre TEXT,
            FOREIGN KEY (anime_id) REFERENCES animes(id)
        );
        CREATE TABLE IF NOT EXISTS titles (
            id INTEGER PRIMARY KEY,
            anime_id INTEGER,
            title TEXT,
            FOREIGN KEY (anime_id) REFERENCES animes(id)
        );
        CREATE TABLE IF NOT EXISTS pages (
            id INTEGER PRIMARY KEY,
            anime_id INTEGER,
            page TEXT,
            thumbnail TEXT,
            timestamp TIMESTAMP,
            FOREIGN KEY (anime_id) REFERENCES animes(id)
        );
        CREATE TABLE IF NOT EXISTS episodes (
            id INTEGER PRIMARY KEY,
            anime_id INTEGER,
            episode NUMBER,
            timestamp TIMESTAMP,
            FOREIGN KEY (anime_id) REFERENCES animes(id)
        );
        CREATE TABLE IF NOT EXISTS links (
            id INTEGER PRIMARY KEY,
            episode_id INTEGER,
            page TEXT,
            url TEXT,
            timestamp TIMESTAMP,
            FOREIGN KEY (episode_id) REFERENCES episodes(id)
        );
        CREATE TABLE IF NOT EXISTS related (
            id INTEGER PRIMARY KEY,
            anime_id INTEGER,
            related_id INTEGER,
            relation TEXT,
            FOREIGN KEY (anime_id) REFERENCES animes(id),
            FOREIGN KEY (related_id) REFERENCES animes(id)
        );
    `);
    // Crear vista
    await execAsync(`
        CREATE VIEW genre_list AS
        SELECT DISTINCT g.genre
        FROM genres g
        ORDER BY g.genre ASC;

        CREATE VIEW anime_view AS
        SELECT
            a.id,

            -- Títulos agrupados
            (SELECT json_group_array(t.title) FROM titles t WHERE t.anime_id = a.id) AS titles,
            
            -- Tipo
            a.type,

            -- Estado
            a.status,

            -- Idioma
            a.lang,
            
            -- Generos
            (SELECT json_group_array(g.genre) FROM genres g WHERE g.anime_id = a.id) AS genres,

            -- Páginas agrupadas
            (SELECT json_group_array(json_object(
                'page', p.page,
                'thumbnail', p.thumbnail,
                'timestamp', p.timestamp
            )) FROM pages p WHERE p.anime_id = a.id) AS pages,

            -- Episodios con sus links anidados
            (SELECT json_group_array(json_object(
                'episode', e.episode,
                'timestamp', e.timestamp,
                'urls', (
                    SELECT json_group_array(json_object(
                        'page', l.page,
                        'url', l.url,
                        'timestamp', l.timestamp
                    ))
                    FROM links l
                    WHERE l.episode_id = e.id
                )
            )) FROM episodes e WHERE e.anime_id = a.id) AS episodes,
            
            -- Páginas agrupadas
            (SELECT json_group_array(json_object(
                'id', r.related_id,
                'relation', r.relation
            )) FROM related r WHERE r.anime_id = a.id) AS related,

            -- Timestamp
            a.timestamp
        FROM animes a
        ORDER BY a.timestamp DESC;
    `);
    console.log("Tablas creadas");
    return
    console.log("Triggers antiguos eliminados");

    // Crear triggers
    await runAsync(`
        -- Trigger después de insertar un link
        CREATE TRIGGER IF NOT EXISTS update_episode_timestamp_after_link_insert
        AFTER INSERT ON links
        BEGIN
            UPDATE episodes
            SET timestamp = NEW.timestamp
            WHERE id = NEW.episode_id AND (timestamp IS NULL OR NEW.timestamp < timestamp);
            
            UPDATE page
            SET timestamp = NEW.timestamp
            WHERE page.page = NEW.page
                AND page.anime_id = (SELECT anime_id FROM episodes WHERE id = NEW.episode_id)
                AND NEW.timestamp = (
                    SELECT MIN(l.timestamp)
                    FROM links l
                    JOIN episodes e ON e.id = l.episode_id
                    WHERE l.page = NEW.page AND e.anime_id = (SELECT anime_id FROM episodes WHERE id = NEW.episode_id)
                );

        END;

        -- Trigger después de actualizar un link
        CREATE TRIGGER IF NOT EXISTS update_episode_timestamp_after_link_update
        AFTER UPDATE ON links
        BEGIN
            UPDATE episodes
            SET timestamp = NEW.timestamp
            WHERE id = NEW.episode_id AND (timestamp IS NULL OR NEW.timestamp < timestamp);

            UPDATE page
            SET timestamp = NEW.timestamp
            WHERE page.page = NEW.page
                AND page.anime_id = (SELECT anime_id FROM episodes WHERE id = NEW.episode_id)
                AND NEW.timestamp = (
                    SELECT MIN(l.timestamp)
                    FROM links l
                    JOIN episodes e ON e.id = l.episode_id
                    WHERE l.page = NEW.page AND e.anime_id = (SELECT anime_id FROM episodes WHERE id = NEW.episode_id)
                );
        END;
        
        -- Trigger después de insertar una page
        CREATE TRIGGER IF NOT EXISTS update_anime_timestamp_after_page_insert
        AFTER INSERT ON page
        BEGIN
            UPDATE animes
            SET timestamp = (
                SELECT MIN(p.timestamp)
                FROM page p
                WHERE p.anime_id = NEW.anime_id
            )
            WHERE id = NEW.anime_id;
        END;

        -- Trigger después de actualizar una page
        CREATE TRIGGER IF NOT EXISTS update_anime_timestamp_after_page_update
        AFTER UPDATE ON page
        BEGIN
            UPDATE animes
            SET timestamp = (
                SELECT MIN(p.timestamp)
                FROM page p
                WHERE p.anime_id = NEW.anime_id
            )
            WHERE id = NEW.anime_id;
        END;
    `);
}

async function newAnimeFromJSON(data) {
    try {
        const exist_anime = await queryAsync(`SELECT * FROM titles WHERE title = ?`, [data.titles[0]]);
        if(exist_anime.length === 1){
            console.log(`Ya existe el anime '${data.titles[0]}'`);
        } else {
            const result = await runAsync(
                `INSERT INTO animes (lang, type, status, timestamp) VALUES (?, ?, ?, ?)`, 
                [data.lang, data.type, data.status, data.timestamp]
            );
            for(const page of data.pages){ await newAnimePageFromJSON(result.lastID, page); }
            for(const title of data.titles){ await newAnimeTitleFromJSON(result.lastID, title); }
            for(const genre of data.genres){ await newAnimeGenreFromJSON(result.lastID, genre); }
            for(const episode of data.episodes){ await newAnimeEpisodeFromJSON(result.lastID, episode); }
        }
    } catch (err) {
        console.error("Error al insertar anime:", err.message);
        throw err;
    }
}
async function newAnimeTitleFromJSON(anime_id, title) {
    try {
        await runAsync(`INSERT INTO titles (anime_id, title) VALUES (?, ?)`, [anime_id, title]);
    } catch (err) {
        console.error("Error al insertar:", err.message);
        throw err;
    }
}
async function newAnimeGenreFromJSON(anime_id, genre) {
    try {
        await runAsync(`INSERT INTO genres (anime_id, genre) VALUES (?, ?)`, [anime_id, genre]);
    } catch (err) {
        console.error("Error al insertar:", err.message);
        throw err;
    }
}
async function newAnimePageFromJSON(anime_id, page) {
    try {
        await runAsync(
            `INSERT INTO pages (anime_id, page, thumbnail, timestamp) VALUES (?, ?, ?, ?)`, 
            [anime_id, page.page, page.thumbnail, page.timestamp]
        );
    } catch (err) {
        console.error("Error al insertar:", err.message);
        throw err;
    }
}
async function newAnimeEpisodeFromJSON(anime_id, req_episode) {
    try {
        const episode = await runAsync(
            `INSERT INTO episodes (anime_id, episode, timestamp) VALUES (?, ?, ?)`, 
            [anime_id, req_episode.episode, req_episode.timestamp]
        );
        for(const url of req_episode.urls){ await newAnimeEpisodeUrlFromJSON(episode.lastID, url); }
    } catch (err) {
        console.error("Error al insertar anime:", err.message);
        throw err;
    }
}
async function newAnimeEpisodeUrlFromJSON(episode_id, url) {
    try {
        await runAsync(
            `INSERT INTO links (episode_id, page, url, timestamp) VALUES (?, ?, ?, ?)`, 
            [episode_id, url.page, url.url, url.timestamp]
        );
    } catch (err) {
        console.error("Error al insertar anime:", err.message);
        throw err;
    }
}
async function newAnimeRelatedFromJSON(anime_title, related_title, relation) {
    try {
        const anime = await queryAsync("SELECT * FROM titles WHERE title = ?", [anime_title])
        if(anime.length < 1) return;
        const related = await queryAsync("SELECT * FROM titles WHERE title = ?", [related_title])
        if(related.length < 1) return;

        await runAsync(
            `INSERT INTO related (anime_id, related_id, relation) VALUES (?, ?, ?)`, 
            [anime[0].anime_id, related[0].anime_id, relation]
        );
    } catch (err) {
        console.error("Error al insertar:", err.message);
        throw err;
    }
}
async function importDatabaseFromJSON() {
    async function importAnimes(start = 0, end = 10) {
        let length = json.length;
        for (let index = Math.min(json.length - 1, start); index < Math.min(json.length - 1, end); index++) {
            console.log(`Importando anime ${index}/${length}`);
            
            const anime = json[index];
            await newAnimeFromJSON({ 
                titles: anime.titles,
                genres: anime.genres,
                type: anime.type,
                lang: anime.lang,
                status: anime.status,
                timestamp: anime.timestamp,
                pages: anime.pages,
                episodes: anime.episodes
            });
        }
    }
    async function importAnimeRelated(start = 0, end = 10){
        let length = json.length;
        for (let index = Math.min(json.length - 1, start); index < Math.min(json.length - 1, end); index++) {
            console.log(`Importando anime.related ${index}/${length}`);
            const anime = json[index];
            for (let j = 0; j < anime.related.length; j++) {
                const related = anime.related[j];
                await newAnimeRelatedFromJSON(anime.titles[0], related.title, related.relation);
            }
        }
    }
    let s = 200;
    let e = 300;
    await importAnimes(s,e);
    await importAnimeRelated(s,e);
    return;
    let max = 100;
    let loops = Math.ceil(json.length / max);

    for (let batchIndex = 0; batchIndex < loops; batchIndex++) {
        console.log(`Procesando lote ${batchIndex + 1}/${loops}`);
        const promises = [];
        let cur = 0;

        const start = batchIndex * max;
        const end = Math.min(start + max, json.length);

        for (let i = start; i < end; i++) {
            const row = json[i];
            if (!row) continue;

            const anime = {
                id: null,
                titles: row.titles,
                type: row.type,
                pages: row.pages,
                episodes: (row.episodes ?? []).flatMap(episode =>
                    (episode.urls ?? []).map(url => ({
                        episode: parseInt(episode.episode),
                        page: url.page,
                        url: url.url,
                        timestamp: url.timestamp  // ← corregido aquí
                    }))
                ),
                timestamp: row.timestamp || 0
            };

            console.log("Procesando anime Nº" + i, ":", anime.titles?.[0]);

            promises.push(
                addAnimeFromJSON(anime.titles, anime.type, anime.pages, anime.episodes, anime.timestamp)
                    .then(id => {
                        console.log(`[${batchIndex}/${loops} ${++cur}/${end - start}] Anime Nº${i}: ${anime.titles?.[0]} ID: ${id}`);
                    })
                    .catch(err => {
                        console.error("❌ Error en anime Nº" + i, ":", err.message);
                    })
            );
        }

        await Promise.all(promises);
    }
    console.log("Todos los animes procesados.");
}
async function main() {
    await init();
    importDatabaseFromJSON();
}
main();

// Ruta de ejemplo: obtener todos los productos
app.get('/api/full', (req, res) => {
    db.all(`
        SELECT
        a.id,
        a.timestamp,
        a.type,
        -- Subconsulta para titles
        (
            SELECT json_group_array(t.title)
            FROM titles t
            WHERE t.anime_id = a.id
        ) AS titles,

        -- Subconsulta para pages
        (
            SELECT json_group_array(json_object(
                'page', p.page,
                'thumbnail', p.thumbnail,
                'timestamp', p.timestamp
            ))
            FROM page p
            WHERE p.anime_id = a.id
        ) AS pages,

        -- Agregación principal para episodes con links
        json_group_array(json_object(
            'episode', e.episode,
            'timestamp', e.timestamp,
            'urls', (
                SELECT json_group_array(json_object(
                    'page', l.page,
                    'url', l.url,
                    'timestamp', l.timestamp
                )) 
                FROM links l
                WHERE l.episode_id = e.id
            )
        )) AS episodes

        FROM animes a
        LEFT JOIN ( SELECT * FROM episodes ORDER BY timestamp ASC ) e ON a.id = e.anime_id
        GROUP BY a.id, a.timestamp, a.type

    `, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            const result = rows.map(row => ({
                id: row.id,
                titles: JSON.parse(row.titles || "[]"), // Convertir de string JSON a array real
                type: row.type,
                pages: JSON.parse(row.pages || "[]"),
                episodes: JSON.parse(row.episodes || "[]"), // Convertir de string JSON a array real
                timestamp: row.timestamp
            }));
            res.json(result);
        }
    });
});
app.get('/api/animes', (req, res) => {
    db.all(`
        SELECT * FROM animes a
    `, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});
app.get('/api/episodes', (req, res) => {
    db.all(`
        SELECT * FROM episodes e
    `, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});
app.get('/api/titles', (req, res) => {
    db.all(`
        SELECT * FROM titles t
    `, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});
app.get('/api/pages', (req, res) => {
    db.all(`
        SELECT * FROM page p
    `, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
