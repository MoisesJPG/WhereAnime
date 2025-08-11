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
            pages: { AC: {}, NoAC: {}},
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
            filters.years[type][new Date(anime.timestamp).getFullYear()] = filters.years[type][new Date(anime.timestamp).getFullYear()] || false;
            for (let i = 0; i < anime.genres.length; i++) {
                filters.genres[type][anime.genres[i]] = filters.genres[type][anime.genres[i]] || false;
            }
            for (let i = 0; i < anime.pages.length; i++) {
                filters.pages[type][anime.pages[i].page] = filters.genres[type][anime.pages[i].page] || false;
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
                res = await fetch('/database/database.json', { cache: "no-store" });
            } else {
                res = await fetch(`https://raw.githubusercontent.com/WhereAnime/database/main/database.json?t=${Date.now()}`, { cache: "no-store" });
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
    static V2_getRandomAnime() {
        const animes = this.V2_getAnimes();
        const randomIndex = Math.floor(Math.random() * animes.length);
        return animes[randomIndex];
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
                        timestamp: ep.timestamp,
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
    static #V2_getAnimesByDay(day) {
        let dayMap = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        let animes = this.V2_getAnimes();
        animes = animes.filter(anime => anime.status === "En Emision" || anime.status === "Desconocido");
        animes = animes.filter(anime => {
            const date = new Date((anime.episodes.length > 0 ? anime.episodes[0].timestamp : 0) + (7 * 24 * 60 * 60 * 1000));
            return date.getDay() === dayMap.indexOf(day)
        });
        animes.sort((animeA, animeB) => animeA.titles[0].localeCompare(animeB.titles[0], undefined, { numeric: true}))
        let response = animes.map(anime => {
            return {
                id: anime.id,
                title: anime.titles[0],
                type: anime.type,
                thumbnail: anime.pages.length > 0 ? anime.pages.filter(page => page.page.toLowerCase() === this.config.page || this.config.page === "all")[0].thumbnail : "",
                timestamp: anime.timestamp,
                episodeCount: anime.episodes.length,
                otherTitles: anime.titles.slice(1)
            }
        });
        return response;
    }
    
    static V2_getMondayAnimes()    { return this.#V2_getAnimesByDay("Monday"   ); }
    static V2_getTuesdayAnimes()   { return this.#V2_getAnimesByDay("Tuesday"  ); }
    static V2_getWednesdayAnimes() { return this.#V2_getAnimesByDay("Wednesday"); }
    static V2_getThursdayAnimes()  { return this.#V2_getAnimesByDay("Thursday" ); }
    static V2_getFridayAnimes()    { return this.#V2_getAnimesByDay("Friday"   ); }
    static V2_getSaturdayAnimes()  { return this.#V2_getAnimesByDay("Saturday" ); }
    static V2_getSundayAnimes()    { return this.#V2_getAnimesByDay("Sunday"   ); }

    
    static V2_getRecentAnimes(limit = 20) {
        let result = this.V2_getAnimes();
        result = result.filter(anime => anime.pages.some(p => p.page.toLowerCase() === database.config.page || database.config.page === "all"));
        result.sort((a, b) => b.timestamp - a.timestamp)
        let response = result.slice(0, limit).map(anime => {
            return {
                id: anime.id,
                title: anime.titles[0],
                type: anime.type,
                thumbnail: anime.pages.filter(page => page.page.toLowerCase() === this.config.page || this.config.page === "all")[0].thumbnail,
                timestamp: anime.timestamp,
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
            if (sortBy === "datetime" && order === "asc") result.sort((a, b) => a.timestamp - b.timestamp);
            if (sortBy === "datetime" && order === "desc") result.sort((a, b) => b.timestamp - a.timestamp);
            const response = result.map(anime => {
                return {
                    id: anime.id,
                    title: anime.titles[0],
                    otherTitles: anime.titles.slice(1),
                    type: anime.type,
                    thumbnail: anime.pages[0].thumbnail,
                    episodeCount: anime.episodes.length,
                    timestamp: anime.timestamp
                }
            })
            return response;
        } catch (error) {
            console.error(error);
            return []
        }
    }
}