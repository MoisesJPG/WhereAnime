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
app.use(express.static(path.join(__dirname, 'public')));

// Conectar a la base de datos
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error("Error al conectar a la base de datos:", err.message);
    } else {
        console.log("Conectado a database.db");
    }
});
const json = JSON.parse(fs.readFileSync('../src/db/database.json', 'utf8')) || [];
console.log("JSON:", json.length);

function runAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
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
        await verifyEpisodes(anime_id);
        await verifyPages(anime_id);
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
            await verifyEpisode(episode.id);
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
            await verifyPage(page.id);
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

async function addAnime(titles, type, pages, episodes, timestamp) {
    try {
        // Verificar si el anime ya existe
        const existingAnime = await queryAsync(`SELECT * FROM animes a LEFT JOIN titles t ON a.id = t.anime_id WHERE t.title LIKE ?`, [`%${titles[0]}%`]);
        let animeId = existingAnime[0] ? existingAnime[0].id : null;
        if (existingAnime.length > 0) {
            // console.log(`Ya existe el anime '${titles[0]}'`);
        } else {
            const isoDate = new Date(timestamp).toISOString().slice(0, 19).replace('T', ' ');
            const result = await runAsync(`INSERT INTO animes (type, timestamp) VALUES (?, ?)`, [type, isoDate]);
            animeId = result.lastID;
            // console.log(`Se ha añadido el anime '${titles[0]}'`);
        }

        for (const title of titles) { await addTitle(animeId, title); }
        for (const page of pages) { await addPage(animeId, page.page, page.thumbnail, page.datetime); }
        for (const episode of episodes) { await addEpisode(animeId, episode.episode, episode.page, episode.url, timestamp); }
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
async function init() {
    // Eliminar tablas si existen
    // await runAsync(`DROP TABLE IF EXISTS links`);
    // await runAsync(`DROP TABLE IF EXISTS episodes`);
    // await runAsync(`DROP TABLE IF EXISTS titles`);
    // await runAsync(`DROP TABLE IF EXISTS page`);
    // await runAsync(`DROP TABLE IF EXISTS animes`);

    // Crear tablas si no existen
    await runAsync(`
        CREATE TABLE IF NOT EXISTS animes (
            id INTEGER PRIMARY KEY,
            type TEXT,
            timestamp TIMESTAMP
        )
    `);
    await runAsync(`
        CREATE TABLE IF NOT EXISTS titles (
            id INTEGER PRIMARY KEY,
            anime_id INTEGER,
            title TEXT,
            FOREIGN KEY (anime_id) REFERENCES animes(id)
        )
    `);
    await runAsync(`
        CREATE TABLE IF NOT EXISTS episodes (
            id INTEGER PRIMARY KEY,
            anime_id INTEGER,
            episode NUMBER,
            timestamp TIMESTAMP,
            FOREIGN KEY (anime_id) REFERENCES animes(id)
        )
    `);
    await runAsync(`
        CREATE TABLE IF NOT EXISTS links (
            id INTEGER PRIMARY KEY,
            episode_id INTEGER,
            page TEXT,
            url TEXT,
            timestamp TIMESTAMP,
            FOREIGN KEY (episode_id) REFERENCES episodes(id)
        )
    `);
    await runAsync(`
        CREATE TABLE IF NOT EXISTS page (
            id INTEGER PRIMARY KEY,
            anime_id INTEGER,
            page TEXT,
            thumbnail TEXT,
            timestamp TIMESTAMP,
            FOREIGN KEY (anime_id) REFERENCES animes(id)
        )
    `);
    await runAsync(`
        DROP TRIGGER IF EXISTS update_episode_timestamp_after_link_insert;
        DROP TRIGGER IF EXISTS update_episode_timestamp_after_link_update;
        DROP TRIGGER IF EXISTS update_anime_timestamp_after_page_insert;
        DROP TRIGGER IF EXISTS update_anime_timestamp_after_page_update;
    `);
    await runAsync(`DROP VIEW IF EXISTS anime_view;`);
    await runAsync(`
        CREATE VIEW anime_view AS
        SELECT
            a.id,
            a.type,
            -- Títulos agrupados
            (SELECT json_group_array(t.title) FROM titles t WHERE t.anime_id = a.id) AS titles,
            -- Páginas agrupadas
            (SELECT json_group_array(json_object(
                'page', p.page,
                'thumbnail', p.thumbnail,
                'timestamp', p.timestamp
            )) FROM page p WHERE p.anime_id = a.id) AS pages,
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
            a.timestamp
        FROM animes a;
    `);
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
    `);
    await runAsync(`
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
    console.log("Tablas creadas");
}
async function main() {
    await init();
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
                addAnime(anime.titles, anime.type, anime.pages, anime.episodes, anime.timestamp)
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
