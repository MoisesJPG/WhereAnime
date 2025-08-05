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
    static setFilter(filter, name, value){
        if(filter === "title"){
            this.filter[filter] = value;
        }else{
            this.filter[filter][database.config.ACMode][name] = value;
        }
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
        localStorage.setItem("WhereAnime.filter", JSON.stringify(this.filter));
    }

    static #nav = document.querySelector('main .content[name="search"] section[name="filter"] nav');

    static prepare() {
        const typesContainer  = this.#nav.querySelector('[name="types"] .content');  typesContainer.innerHTML  = "";
        const genresContainer = this.#nav.querySelector('[name="genres"] .content'); genresContainer.innerHTML = "";
        const langsContainer  = this.#nav.querySelector('[name="langs"] .content');  langsContainer.innerHTML  = "";
        const statusContainer = this.#nav.querySelector('[name="status"] .content'); statusContainer.innerHTML = "";
        const yearsContainer  = this.#nav.querySelector('[name="years"] .content');  yearsContainer.innerHTML = "";


        // Preparando los tipos
        for (const type of Object.keys(this.#getFilter("types")).sort((a, b) => a.localeCompare(b))) {
            const p = document.createElement("p");
            p.innerHTML = `<input type="checkbox" class="type" name="${type}">${type}`;
            const c = p.querySelector('input[type="checkbox"]');
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
            const c = p.querySelector('input[type="checkbox"]');
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
            const c = p.querySelector('input[type="checkbox"]');
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
            const c = p.querySelector('input[type="checkbox"]');
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
            const c = p.querySelector('input[type="checkbox"]');
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

            const hasStatusFilter = Object.values(statusFilter).some(v => v === true);
            const hasTypesFilter = Object.values(typesFilter).some(v => v === true);
            const hasLangsFilter = Object.values(langsFilter).some(v => v === true);
            const hasYearsFilter = Object.values(yearsFilter).some(v => v === true);
            const hasGenresFilter = Object.values(genresFilter).some(v => v === true);

            const animes = database.V2_getAnimes().filter(a => (
                (a.titles.some(t => t.toLowerCase().includes(titleFilter.toLowerCase()))) &&
                (!hasStatusFilter || statusFilter[a.status] === true) &&
                (!hasTypesFilter || typesFilter[a.type] === true) &&
                (!hasLangsFilter || langsFilter[a.lang] === true) &&
                (!hasYearsFilter || yearsFilter[new Date(a.datetime).getFullYear()] === true) &&
                (!hasGenresFilter || a.genres.some(g => genresFilter[g] === true))
            ));

            const response = animes.map(a => {
                return {
                    id: a.id,
                    title: a.titles[0],
                    otherTitles: a.titles.slice(1),
                    type: a.type,
                    thumbnail: a.pages.length > 0 ? a.pages[0].thumbnail : "",
                    episodeCount: a.episodes.length,
                    timestamp: a.datetime
                }
            })
            return response;
        } catch (error) {
            console.error(error);
            return []
        }
    }
}