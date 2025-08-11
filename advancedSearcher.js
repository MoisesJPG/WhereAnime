import { database } from "./src/js/database.js";

export class AdvancedSearcher {
    static filter = { 
        title: "",
        types : { AC: {}, NoAC: {}},
        genres: { AC: {}, NoAC: {}},
        langs : { AC: {}, NoAC: {}},
        status: { AC: {}, NoAC: {}},
        years : { AC: {}, NoAC: {}}
    };
    static inizialiceFilter() {
        this.filter = database.V2_getFilters();
        this.prepare();
        return;
        const storage = JSON.parse(localStorage.getItem("WhereAnime.filter"));
        this.filter = database.V2_getFilters();
        for(const filter in storage){
            if(filter === "title") continue;
            for (const ac in storage[filter]) {
                for (const name in storage[filter][ac]) {
                    if(name in this.filter[filter][ac]) {
                        this.filter[filter][ac][name] = storage[filter][ac][name]
                    }
                }
            }
            
        }
        localStorage.setItem("WhereAnime.filter", JSON.stringify(this.filter));
        this.prepare();
    }
    static #getFilter(filter) {
        if(filter === "title") return this.filter.title || "";
        return this.filter[filter][database.config.ACMode];
    }
    static getActiveFilter() {
        const activeFilter = {};
        for (const key in this.filter) {
            if (key === 'title') continue;
            const section = this.filter[key];
            for (const subKey of ['AC', 'NoAC']) {
                const subSection = section[subKey];
                for (const itemKey in subSection) {
                    if(subSection[itemKey]) {
                        activeFilter[key] = activeFilter[key] || [];
                        activeFilter[key].push(itemKey);
                    }
                }
            }
        }
        return activeFilter;
    }
    static setFilter(filter, name, value){
        if(filter === "title"){
            this.filter[filter] = value;
        } else {
            for(const n in this.filter[filter][database.config.ACMode]){
                if(n.replaceAll(" ", "-").toLowerCase() === name.replaceAll(" ", "-").toLowerCase()){
                    this.filter[filter][database.config.ACMode][n] = value;
                }
            }
        }
        return;
        localStorage.setItem("WhereAnime.filter", JSON.stringify(this.filter));
    }
    static resetFilter(){
        this.filter.title = "";
        for (const key in this.filter) {
            if (key === 'title') continue;
            const section = this.filter[key];
            for (const subKey of ['AC', 'NoAC']) {
                const subSection = section[subKey];
                for (const itemKey in subSection) {
                    subSection[itemKey] = false;
                }
            }
        }
        return;
        localStorage.setItem("WhereAnime.filter", JSON.stringify(this.filter));
    }

    static #nav = document.querySelector('main .content[name="search"] section[name="filter"] nav');

    static prepare() {
        const typesContainer  = this.#nav.querySelector('[name="types"] .content .list');  typesContainer.innerHTML  = "";
        const genresContainer = this.#nav.querySelector('[name="genres"] .content .list'); genresContainer.innerHTML = "";
        const langsContainer  = this.#nav.querySelector('[name="langs"] .content .list');  langsContainer.innerHTML  = "";
        const statusContainer = this.#nav.querySelector('[name="status"] .content .list'); statusContainer.innerHTML = "";
        const yearsContainer  = this.#nav.querySelector('[name="years"] .content .list');  yearsContainer.innerHTML  = "";
        const pagesContainer  = this.#nav.querySelector('[name="pages"] .content .list');  pagesContainer.innerHTML  = "";


        // Preparando las paginas
        for (const page of Object.keys(this.#getFilter("pages")).sort((a, b) => a.localeCompare(b))) {
            const p = document.createElement("p");
            p.innerHTML = `<input type="checkbox" class="page" name="${page}">${page}`;
            p.classList.add("clickable");
            const c = p.querySelector('input[type="checkbox"]');
            c.classList.add("clickable");
            c.checked = this.#getFilter("pages")[page];
            c.onclick = () => alternate(c); 
            p.onclick = () => alternate(c);
            function alternate(c) {
                c.checked = !c.checked;
                AdvancedSearcher.setFilter("pages", page, c.checked);
            }
            pagesContainer.appendChild(p);
        }


        // Preparando los tipos
        for (const type of Object.keys(this.#getFilter("types")).sort((a, b) => a.localeCompare(b))) {
            const p = document.createElement("p");
            p.innerHTML = `<input type="checkbox" class="type" name="${type}">${type}`;
            p.classList.add("clickable");
            const c = p.querySelector('input[type="checkbox"]');
            c.classList.add("clickable");
            c.checked = this.#getFilter("types")[type];
            c.onclick = () => alternate(c); 
            p.onclick = () => alternate(c);
            function alternate(c) {
                c.checked = !c.checked;
                AdvancedSearcher.setFilter("types", type, c.checked);
            }
            typesContainer.appendChild(p);
        }


        // Preparando los generos
        for (const genre of Object.keys(this.#getFilter("genres")).sort((a, b) => a.localeCompare(b))) {
            const p = document.createElement("p");
            p.innerHTML = `<input type="checkbox" class="genre" name="${genre}">${genre}`;
            p.classList.add("clickable");
            const c = p.querySelector('input[type="checkbox"]');
            c.classList.add("clickable");
            c.checked = this.#getFilter("genres")[genre];
            c.onclick = () => alternate(c); 
            p.onclick = () => alternate(c);
            function alternate(c) {
                c.checked = !c.checked;
                AdvancedSearcher.setFilter("genres", genre, c.checked);
            }
            genresContainer.appendChild(p);
        }


        // Preparando los idiomas
        for (const lang of Object.keys(this.#getFilter("langs")).sort((a, b) => a.localeCompare(b))) {
            const p = document.createElement("p");
            p.innerHTML = `<input type="checkbox" class="lang" name="${lang}">${lang}`;
            p.classList.add("clickable");
            const c = p.querySelector('input[type="checkbox"]');
            c.classList.add("clickable");
            c.checked = this.#getFilter("langs")[lang];
            c.onclick = () => alternate(c); 
            p.onclick = () => alternate(c);            
            function alternate(c) {
                c.checked = !c.checked;
                AdvancedSearcher.setFilter("langs", lang, c.checked);
            }
            langsContainer.appendChild(p);
        }


        // Preparando los estados
        for (const status of Object.keys(this.#getFilter("status")).sort((a, b) => a.localeCompare(b))) {
            const p = document.createElement("p");
            p.innerHTML = `<input type="checkbox" class="status" name="${status}">${status}`;
            p.classList.add("clickable");
            const c = p.querySelector('input[type="checkbox"]');
            c.classList.add("clickable");
            c.checked = this.#getFilter("status")[status];
            c.onclick = () => alternate(c); 
            p.onclick = () => alternate(c);
            function alternate(c) {
                c.checked = !c.checked;
                AdvancedSearcher.setFilter("status", status, c.checked);
            }
            statusContainer.appendChild(p);
        }

        
        // Preparando las fechas
        for (const year of Object.keys(this.#getFilter("years")).sort((a, b) => b - a)) {
            const p = document.createElement("p");
            p.innerHTML = `<input type="checkbox" class="year" name="${year}">${year}`;
            p.classList.add("clickable");
            const c = p.querySelector('input[type="checkbox"]');
            c.classList.add("clickable");
            c.checked = this.#getFilter("years")[year];
            c.onclick = () => alternate(c); 
            p.onclick = () => alternate(c);
            function alternate(c) {
                c.checked = !c.checked;
                AdvancedSearcher.setFilter("years", year, c.checked);
            }
            yearsContainer.appendChild(p);
        }


    }
    static search() {
        
    }
    static getAnimes() {
        try {
            const titleFilter  = this.#getFilter("title");
            const statusFilter = this.#getFilter("status");
            const typesFilter  = this.#getFilter("types");
            const langsFilter  = this.#getFilter("langs");
            const yearsFilter  = this.#getFilter("years");
            const genresFilter = this.#getFilter("genres");
            const pagesFilter  = this.#getFilter("pages");

            const hasStatusFilter = Object.values(statusFilter).some(v => v === true);
            const hasTypesFilter = Object.values(typesFilter).some(v => v === true);
            const hasLangsFilter = Object.values(langsFilter).some(v => v === true);
            const hasYearsFilter = Object.values(yearsFilter).some(v => v === true);
            const hasGenresFilter = Object.values(genresFilter).some(v => v === true);
            const hasPagesFilter = Object.values(pagesFilter).some(v => v === true);

            let animes = database.V2_getAnimes().filter(a => (
                (a.titles.some(t => t.toLowerCase().includes(titleFilter.toLowerCase()))) &&
                (!hasStatusFilter || statusFilter[a.status] === true) &&
                (!hasTypesFilter || typesFilter[a.type] === true) &&
                (!hasLangsFilter || langsFilter[a.lang] === true) &&
                (!hasYearsFilter || yearsFilter[new Date(a.timestamp).getFullYear()] === true) &&
                (!hasGenresFilter || a.genres.some(g => genresFilter[g] === true))
            )).sort((a,b) => b.id - a.id);
            let _animes = animes.filter(a => (!hasPagesFilter || a.pages.some(p => pagesFilter[p.page] === true )))
            const response = _animes.map(a => {
                return {
                    id: a.id,
                    title: a.titles[0],
                    otherTitles: a.titles.slice(1),
                    type: a.type,
                    thumbnail: a.pages.length > 0 ? a.pages[0].thumbnail : "",
                    episodeCount: a.episodes.length,
                    timestamp: a.timestamp
                }
            })
            return response;
        } catch (error) {
            console.error(error);
            return []
        }
    }
}