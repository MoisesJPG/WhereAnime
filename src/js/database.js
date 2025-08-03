import { log } from "./v2/misc.js";

export class database {
    static config = {
        page: "all",
        ac: false,
        allow_ac: false
    }
    static #data = [];
    static async load() {
        try {
            let res = null;
            if(window.location.host === "localhost") {
                res = await fetch('/WhereAnime_database/database.json', { cache: "no-store" });
            } else {
                res = await fetch(`https://raw.githubusercontent.com/MoisesJPG/WhereAnime_database/main/database.json?t=${Date.now()}`, { cache: "no-store" });
            }
            const data = await res.json();
            this.#data = data;
            log(`La base de datos se ha cargado`);
        } catch (err) {
            console.error('Error cargando JSON:', err);
        }
    }
    static #getAnimesAC(){
        return this.#data.filter(anime => anime.type.toLowerCase() === "hentai");
    }
    static #getAnimesNoAC(){
        return this.#data.filter(anime => (anime.type.toLowerCase() === "anime" || anime.type.toLowerCase() === "unknown"));
    }
    static findAnimeById(id) {
        return this.#data.find(anime => anime.id === id);
    }
    static findAnimesByTitle(title, sortBy = "title", order = "asc") {
        function normalizeText(text) {
            return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        }
        title = normalizeText(title);
        try {
            let result = [];
            if(this.config.ac) {
                result = this.#getAnimesAC();
            }else{
                result = this.#getAnimesNoAC();
            }
            result = result.filter(anime => anime.pages.some(p => p.page.toLowerCase() === database.config.page || database.config.page === "all"));
            result = result.filter(anime => anime.titles.some(t => normalizeText(t).includes(title)))
            if (sortBy === "title" && order === "asc") result.sort((a,b) => a.titles[0].localeCompare(b.titles[0]));
            if (sortBy === "title" && order === "desc") result.sort((a,b) => b.titles[0].localeCompare(a.titles[0]));
            if (sortBy === "datetime" && order === "asc") result.sort((a,b) => a.datetime - b.datetime);
            if (sortBy === "datetime" && order === "desc") result.sort((a,b) => b.datetime - a.datetime);
            return result;
        } catch (error) {
            console.error(error);
            return []
        }
    }
    static getLastAnimes(limit = 20) {
        let result = [];
        if(this.config.ac) {
            result = this.#getAnimesAC();
        }else{
            result = this.#getAnimesNoAC();
        }
        result = result.filter(anime => anime.pages.some(p => p.page.toLowerCase() === database.config.page || database.config.page === "all"));
        result.sort((a, b) => b.datetime - a.datetime).slice(0, limit);
        return result.slice(0, limit);
    }
    static getLastEpisodes(limit = 20) {
        try {
            const allEpisodes = this.#data.flatMap(anime => {                
                if (this.config.ac && (anime.type === "unknown" || anime.type === "anime")) return [];
                if (!this.config.ac && (anime.type === "hentai")) return [];
                return anime.episodes.map(ep => {
                    const filteredUrls = ep.urls.filter(url => url.page.toLowerCase() === this.config.page || this.config.page === "all");
                    if (filteredUrls.length === 0) return null;
                    return {
                        animeId: anime.id,
                        title: anime.titles[0],
                        episode: ep.episode,
                        datetime: ep.datetime,
                        urls: filteredUrls
                    };
                });
            }).filter(Boolean);
            const sorted = allEpisodes.sort((a, b) => b.datetime - a.datetime);
            return sorted.slice(0, limit);
        } catch (err) {
            console.error(err);
            return [];
        }
    }
}