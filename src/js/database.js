import { log } from "./v2/misc.js";

export class database {
    static config = {
        page: "all",
        AC: false,
        ACMode: "NoAC",
        allowAC: false
    }

    static V2_getFilters() {
        const filters = {
            title: "", 
            types: { AC: {}, NoAC: {}},
            genres: { AC: {}, NoAC: {}},
            langs : { AC: {}, NoAC: {}},
            status: { AC: {}, NoAC: {}},
            years : { AC: {}, NoAC: {}}
        };
        for (const anime of this.#data) {
            let type = anime.type.toLowerCase().split(" ")[0] === "hentai" ? "AC" : "NoAC"
            filters.types[type][anime.type] = filters.types[type][anime.type] || false;
            filters.langs[type][anime.lang] = filters.langs[type][anime.lang] || false;
            filters.status[type][anime.status] = filters.status[type][anime.status] || false;
            filters.years[type][new Date(anime.datetime).getFullYear()] = filters.years[type][new Date(anime.datetime).getFullYear()] || false;
            for (let i = 0; i < anime.genres.length; i++) {
                filters.genres[type][anime.genres[i]] = filters.genres[type][anime.genres[i]] || false;
            }
        }
        return filters;

    }
    static loaded = false;
    static #data = [];
    static async load() {
        try {

            this.config.AC = localStorage.getItem("ac") === "true" ? true : false;
            this.config.ACMode = this.config.AC ? "AC" : "NoAC";
            this.config.allowAC = localStorage.getItem("allow-ac") === "true" ? true : false;

            let res = null;
            if (window.location.hostname === "localhost") {
                res = await fetch('/WhereAnime_database/database.json', { cache: "no-store" });
            } else {
                res = await fetch(`https://raw.githubusercontent.com/MoisesJPG/WhereAnime_database/main/database.json?t=${Date.now()}`, { cache: "no-store" });
            }
            this.#data = await res.json();
            this.loaded = true;
            log(`La base de datos se ha cargado`);
        } catch (err) {
            console.error('Error cargando JSON:', err);
        }
    }
    static V2_getAnimes() {
        if (this.config.AC) {
            return this.#data.filter(anime => (
                anime.type.toLowerCase().split(" ")[0] === "hentai"
            ));
        } else {
            return this.#data.filter(anime => (
                anime.type.toLowerCase().split(" ")[0] !== "hentai" ||
                anime.type.toLowerCase().split(" ")[0] === "unknown"
            ));
        }
    }
    static V2_getRecentEpisodes(limit = 20) {
        try {
            let result = this.V2_getAnimes();
            const allEpisodes = result.flatMap(anime => {
                return anime.episodes.map(ep => {
                    const filteredUrls = ep.urls.filter(url => url.page.toLowerCase() === this.config.page || this.config.page === "all");
                    if (filteredUrls.length === 0) return null;
                    return {
                        animeId: anime.id,
                        animeType: anime.type,
                        thumbnail: anime.pages.filter(page => page.page.toLowerCase() === this.config.page || this.config.page === "all")[0].thumbnail,
                        title: anime.titles[0],
                        episode: ep.episode,
                        timestamp: ep.datetime,
                        urls: filteredUrls
                    };
                });
            }).filter(Boolean);
            const sorted = allEpisodes.sort((a, b) => b.timestamp - a.timestamp);
            return sorted.slice(0, limit);
        } catch (err) {
            console.error(err);
            return [];
        }
    }
    static V2_getRecentAnimes(limit = 20) {
        let result = this.V2_getAnimes();
        result = result.filter(anime => anime.pages.some(p => p.page.toLowerCase() === database.config.page || database.config.page === "all"));
        result.sort((a, b) => b.datetime - a.datetime)
        let response = result.slice(0, limit).map(anime => {
            return {
                id: anime.id,
                title: anime.titles[0],
                type: anime.type,
                thumbnail: anime.pages.filter(page => page.page.toLowerCase() === this.config.page || this.config.page === "all")[0].thumbnail,
                timestamp: anime.datetime,
                episodeCount: anime.episodes.length,
                otherTitles: anime.titles.slice(1)
            }
        })
        return response;
    }
    static V2_findAnimeById(id) {
        return this.#data.filter(anime => anime.id === id)[0];
    }
    static V2_findAnimeByMainTitle(title) {
        try {
            let result = this.V2_getAnimes();
            result = result.filter(anime => anime.titles[0] === title)[0];
            return result;
        } catch (error) {
            console.error(error);
            return []
        }
    }
    static V2_findAnimesByTitle(title, sortBy = "title", order = "asc") {
        title = decodeURIComponent(title);
        try {
            let result = this.V2_getAnimes();
            result = result.filter(anime => anime.pages.some(p => p.page.toLowerCase() === database.config.page || database.config.page === "all"));
            result = result.filter(anime => anime.titles.some(t => t.includes(title)))
            if (sortBy === "title" && order === "asc") result.sort((a, b) => a.titles[0].localeCompare(b.titles[0]));
            if (sortBy === "title" && order === "desc") result.sort((a, b) => b.titles[0].localeCompare(a.titles[0]));
            if (sortBy === "datetime" && order === "asc") result.sort((a, b) => a.datetime - b.datetime);
            if (sortBy === "datetime" && order === "desc") result.sort((a, b) => b.datetime - a.datetime);
            const response = result.map(anime => {
                return {
                    id: anime.id,
                    title: anime.titles[0],
                    otherTitles: anime.titles.slice(1),
                    type: anime.type,
                    thumbnail: anime.pages[0].thumbnail,
                    episodeCount: anime.episodes.length,
                    timestamp: anime.datetime
                }
            })
            return response;
        } catch (error) {
            console.error(error);
            return []
        }
    }
}