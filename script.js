import { AdvancedSearcher } from "./advancedSearcher.js";
import { database } from "./src/js/database.js";

const header = document.querySelector('header');
const headerSwitchNav = header.querySelector('nav .switch-nav');
const main = document.querySelector('main');
const mainContentHome    = main.querySelector('.content[name="home"]');
const mainContentSearch  = main.querySelector('.content[name="search"]');
const mainContentHorary  = main.querySelector('.content[name="horary"]');
const mainContentAnime   = main.querySelector('.content[name="anime"]');
const mainContentEpisode = main.querySelector('.content[name="episode"]');
const searcher = header.querySelector(`#searcher`);
const advancedSearcher = document.querySelector(`#advancedSearcher`);

const config = {
    location: location.href.substring(location.origin.length+8, location.href.length),
    route: null,
    reloadDelay: 5 * 60 * 1000
};
const dayMap = {
    1: {en: "monday", es: "Lunes"},
    2: {en: "tuesday", es: "Martes"},
    3: {en: "wednesday", es: "Miercoles"},
    4: {en: "thursday", es: "Jueves"},
    5: {en: "friday", es: "Viernes"},
    6: {en: "saturday", es: "Sabado"},
    0: {en: "sunday", es: "Domingo"},
};

const blobs = {
    "unknown" : "https://i.makeagif.com/media/4-15-2024/IoMMB_.gif"
}
const permOrigings = [
    "whereanime.github.io",
]
async function blobImage(imageUrl) {
    try {
        if(blobs[imageUrl]) return blobs[imageUrl];
        if(permOrigings.includes(location.host)){
            const response = await fetch(imageUrl);
            if (response.ok) { 
                blobs[imageUrl] = URL.createObjectURL(await response.blob());
                return blobs[imageUrl];
            }
        }else{
            return imageUrl
        }
    } catch (error) { 
        return blobs.unknown;
    }
}
async function thumbnailAnimeImage(animeId, thumbnail) {
    if(true) return await blobImage(thumbnail);
    if(location.host === "localhost") return await blobImage(`/images/thumbnail/${animeId}.webp`);
    return await blobImage(`https://raw.githubusercontent.com/WhereAnime/images/refs/heads/main/thumbnail/${animeId}.webp`);
}
async function coverAnimeImage(animeId, thumbnail) {
    if(true) return await blobImage(thumbnail);
    if(location.host === "localhost") return await blobImage(`/images/cover/${animeId}.webp`);
    return await blobImage(`https://raw.githubusercontent.com/WhereAnime/images/refs/heads/main/cover/${animeId}.webp`);
}
async function loadDatabase() {
    await database.load();
    AdvancedSearcher.inizialiceFilter();
}
const intervals = {}
function goTo(url) {
    console.log(url);
    for(const blobUrl in blobs) { if(blobUrl !== "unknown") { URL.revokeObjectURL(blobs[blobUrl]); } }
    scrollTo(0, 0);
    const base = window.location.origin; // Base actual
    const newUrl = new URL(url, base);   // Construye URL absoluta
    
    config.location = url
    history.replaceState(null, '', `${newUrl.origin}?route=${newUrl.href.substring(newUrl.origin.length, newUrl.href.length)}`); // Reemplaza en el historial
    preparegoTo(newUrl);
}
function generateNavigatorList(min, cur, max) {
    max = Math.max(1, max)
    const pre = [{ text: "<<", value: min }, { text: "<", value: cur - 1 < min ? min : cur - 1 }]
    const sub = [{ text: ">", value: cur + 1 > max ? max : cur + 1 }, { text: ">>", value: max }]
    const total = max - min + 1;
    const lista = [];
    if (total <= 11) {
        for (let i = 0; i < total; i++) {
            lista.push({ text: min + i, value: min + i })
        }
        return pre.concat(lista).concat(sub);
    }
    // Siempre mostrar el primero
    lista.push({ text: min, value: min });
    // Cur cerca del principio
    if (cur <= min + 5) {
        for (let i = min + 1; i <= min + 8; i++) { lista.push({ text: i, value: i }); }
        lista.push({ text: "…", value: "…" });
        lista.push({ text: max, value: max });
        return pre.concat(lista).concat(sub);
    }
    // Cur cerca del final
    if (cur >= max - 5) {
        lista.push({ text: "…", value: "…" });
        for (let i = max - 8; i < max; i++) { lista.push({ text: i, value: i }); }
        lista.push({ text: max, value: max });
        return pre.concat(lista).concat(sub);
    }
    // Cur en el medio
    lista.push({ text: "…", value: "…" });
    for (let i = cur - 3; i <= cur + 3; i++) {
        lista.push({ text: i, value: i });
    }
    lista.push({ text: "…", value: "…" });
    lista.push({ text: max, value: max });
    return pre.concat(lista).concat(sub);
}
function highlightMatch(text, searchTitle) {
    if (!searchTitle) return text;

    const normSearch = searchTitle;

    let result = '';
    let i = 0;
    
    while (i < text.length) {
        let found = false;

        for (let j = text.length; j > i; j--) {
            const segment = text.slice(i, j);
            if (segment.toLowerCase().startsWith(normSearch.toLowerCase())) {
                result += '<b>' + segment.slice(0, searchTitle.length) + '</b>';
                i += searchTitle.length;
                found = true;
                break;
            }
        }

        if (!found) { result += text[i]; i++; }
    }

    return result;
}
let firstTimeHome = true;
function preparegoTo(newUrl = location) {
    function home() {
        console.log("||||| HOME PAGE |||||");
        document.title = `WhereAnime`;
        const banner = mainContentHome.querySelector('section[name="banner"] .content');
        const remainingRecentEpisodes = mainContentHome.querySelector('section[name="remainingRecentEpisodes"] .content');
        const recentEpisodes = mainContentHome.querySelector('section[name="recentEpisodes"] .content');
        const recentAnimes = mainContentHome.querySelector('section[name="recentAnimes"] .content');
        async function refresh() {
            loadDatabase();
            const bannerAnime = database.V2_getRandomAnime();
            document.querySelector('#background img').src = await coverAnimeImage(bannerAnime.id, bannerAnime.pages[0].thumbnail);
            banner.querySelector(`.title`).textContent = bannerAnime.titles[0]
            banner.querySelector(`.genres`).innerHTML = "";
            for(const genre of bannerAnime.genres){
                const span = document.createElement("span");
                span.textContent = genre;
                span.onclick = () => {
                    AdvancedSearcher.resetFilter();
                    AdvancedSearcher.setFilter("genres", genre, true)
                    goTo("/search/1")
                }
                banner.querySelector(`.genres`).appendChild(span);
            }
            banner.querySelector(`.see`).onclick = () => goTo(`/anime/${encodeURIComponent(bannerAnime.titles[0])}/1`);

            const remainingEpisodes = database.V2_getRemainingRecentEpisodes();
            let i = 0;
            for (let o = 0; o < remainingEpisodes.length; o++, i++) {
                const episode = remainingEpisodes[o];
                const card = document.createElement("div");
                card.className = `card ${episode.animeType.toLowerCase().split(" ")[0]}`
                card.innerHTML = `
                    <div class="image"><img src="${await thumbnailAnimeImage(episode.animeId, episode.thumbnail)}" alt="${episode.title}"></div>
                    <p class="title">${episode.title}</p>
                    <p class="episode">${episode.episode}</p>
                    <div class="hover">
                        <p>Titulo: ${episode.title}</p>
                        <p>Episodio: ${episode.episode}</p>
                        <p>Fecha: ${new Date(episode.timestamp).toLocaleDateString()}</p>
                    </div>
                `;
                if (remainingRecentEpisodes.children[o]) {
                    remainingRecentEpisodes.replaceChild(card, remainingRecentEpisodes.children[o]);
                } else {
                    remainingRecentEpisodes.appendChild(card);
                }
            }
            for (let f = remainingRecentEpisodes.childElementCount - 1; f >= i; f--) {
                remainingRecentEpisodes.children[f].remove();
                
            }

            const episodes = database.V2_getRecentEpisodes();
            for (let i = 0; i < episodes.length; i++) {
                const episode = episodes[i];
                const card = document.createElement("div");
                card.className = `card ${episode.animeType.toLowerCase().split(" ")[0]}`
                card.innerHTML = `
                    <div class="image"><img src="${await thumbnailAnimeImage(episode.animeId, episode.thumbnail)}" alt="${episode.title}"></div>
                    <p class="title">${episode.title}</p>
                    <p class="episode">${episode.episode}</p>
                    <div class="hover">
                        <p>Titulo: ${episode.title}</p>
                        <p>Episodio: ${episode.episode}</p>
                        <p>Fecha: ${new Date(episode.timestamp).toLocaleDateString()}</p>
                    </div>
                `;
                card.onclick = () => goTo(`/episode/${encodeURIComponent(episode.title)}/${episode.episode}`)
                if (recentEpisodes.children[i]) {
                    recentEpisodes.replaceChild(card, recentEpisodes.children[i]);
                } else {
                    recentEpisodes.appendChild(card);
                }
            }

            const animes = database.V2_getRecentAnimes();
            for (let i = 0; i < animes.length; i++) {
                const anime = animes[i];
                const card = document.createElement("div");
                card.className = `card ${anime.type.toLowerCase().split(" ")[0]}`
                card.innerHTML = `
                    <div class="image"><img src="${await thumbnailAnimeImage(anime.id, anime.thumbnail)}" alt="${anime.title}"></div>
                    <p class="title">${anime.title}</p>
                    <div class="hover">
                        <p>Titulo: ${anime.title}</p>
                        <p>Episodios: ${anime.episodeCount}</p>
                        <p>Fecha: ${new Date(anime.timestamp).toLocaleDateString()}</p>
                        ${anime.otherTitles.length > 0 ? `<p>Otros titulos:<br> - ${anime.otherTitles.join("<br> - ")}</p>` : ""}
                    </div>
                `;
                card.onclick = () => goTo(`/anime/${encodeURIComponent(anime.title)}`)
                if (recentAnimes.children[i]) {
                    recentAnimes.replaceChild(card, recentAnimes.children[i]);
                } else {
                    recentAnimes.appendChild(card);
                }
            }

        }
        intervals["timeToRefresh"] = setInterval(() => {
            document.querySelectorAll('.timeToRefresh').forEach(el => {
                let time = Date.now() - 2 * 60 * 1000 - 1000;   // Tiempo actual en milisegundos
                let rem = config.reloadDelay - (time % config.reloadDelay);           // Tiempo restante hasta el próximo múltiplo de delay
                let totalSeconds = Math.floor(rem / 1000);  // Segundos totales restantes
                let s = totalSeconds % 60;                  // Segundos restantes (parte del minuto)
                let m = Math.floor(totalSeconds / 60);      // Minutos restantes
                el.innerHTML = `Proxima act.: ${m > 0 ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`}`;
            });
        }, 100);
        refresh();
        if (firstTimeHome) {
            firstTimeHome = false;
        }
        
        const delay = 5 * 60 * 1000;
        const now = Date.now() - 2 * 60 * 1000 - 1000;
        const rem = delay - (now % delay);       
        intervals["homeRecentFirstRefresh"] = setTimeout(() => { refresh();
            intervals["homeRecentLoopRefresh"] = setInterval(() => { refresh(); }, config.reloadDelay);
        }, rem);
        mainContentHome.style.display = "";
        mainContentSearch.style.display = "none";
        mainContentHorary.style.display = "none";
        mainContentAnime.style.display = "none";
        mainContentEpisode.style.display = "none";
    }
    async function search() {
        console.log("||||| SEARCH PAGE |||||");
        document.title = `Repositorio - WhereAnime`;
        document.querySelector('#background img').src = ``;
        const params = new URLSearchParams(newUrl.search);
        console.log(`Search: ${newUrl.search}`);
        
        const content = mainContentSearch.querySelector(`section[name="results"] .content`);
        const reqPageNumber = parseInt(params.get("n")) || 1;
        const reqQueryTitle = params.get("q") || "";
        const reqFilters = {
            types: params.getAll("type") || [],
            genres: params.getAll("genre") || [],
            langs: params.getAll("lang") || [],
            pages: params.getAll("page") || [],
            status: params.getAll("status") || [],
            years: params.getAll("year") || [],
        }
        
        AdvancedSearcher.filter.title = decodeURIComponent(reqQueryTitle);
        if(reqFilters.types.length  > 0) reqFilters.types.map (t => AdvancedSearcher.setFilter("types" , t, true) );
        if(reqFilters.genres.length > 0) reqFilters.genres.map(g => AdvancedSearcher.setFilter("genres", g, true) );
        if(reqFilters.langs.length  > 0) reqFilters.langs.map (l => AdvancedSearcher.setFilter("langs" , l, true) );
        if(reqFilters.pages.length  > 0) reqFilters.pages.map (p => AdvancedSearcher.setFilter("pages", p, true) );
        if(reqFilters.status.length > 0) reqFilters.status.map(s => AdvancedSearcher.setFilter("status", s, true) );
        if(reqFilters.years.length  > 0) reqFilters.years.map (y => AdvancedSearcher.setFilter("years" , y, true) );
        
        console.log(reqFilters);
        
        mainContentSearch.querySelector('section[name="filter"] nav [name="title"] input').value = decodeURIComponent(reqQueryTitle);
        AdvancedSearcher.prepare();

        const animes = AdvancedSearcher.getAnimes();
        let itemCount = 20;
        if (reqPageNumber < 1) { 
            const params = new URLSearchParams(newUrl.search);
            params.set("n", 1)
            goTo(`/search/?${params.toString()}`); 
            return;
        }
        if (reqPageNumber > 1 && reqPageNumber > Math.ceil(animes.length / itemCount)) { 
            const params = new URLSearchParams(newUrl.search);
            params.set("n", Math.ceil(animes.length / itemCount))
            goTo(`/search/?${params.toString()}`); 
            return; 
        }
        let i = 0;
        for (let o = (reqPageNumber - 1) * itemCount; o < Math.min(reqPageNumber * itemCount, animes.length); o++, i++) {
            const anime = animes[o];
            const card = document.createElement("div");
            card.className = `card ${anime.type.toLowerCase().split(" ")[0]}`
            card.innerHTML = `
                <div class="image"><img src="${await thumbnailAnimeImage(anime.id,anime.thumbnail)}" alt="${anime.title}"></div>
                <p class="title">${highlightMatch(anime.title, decodeURIComponent(reqQueryTitle))}</p>
                <div class="hover">
                    <p>Titulo: ${highlightMatch(anime.title, decodeURIComponent(reqQueryTitle))}</p>
                    <p>Episodios: ${anime.episodeCount}</p>
                    <p>Fecha: ${new Date(anime.timestamp).toLocaleDateString()}</p>
                    ${anime.otherTitles.length > 0 ? `<p>Otros titulos:<br> - ${highlightMatch(anime.otherTitles.join("<br> - "), decodeURIComponent(reqQueryTitle))}</p>` : ""}
                </div>
            `;
            card.onclick = () => goTo(`/anime/${encodeURIComponent(anime.title)}`)
            if (content.children[i]) {
                content.replaceChild(card, content.children[i]);
            } else {
                content.appendChild(card);
            }
        }
        for(let f = content.childElementCount - 1; f >= i; f--){
            content.children[f].remove();
        }

        const navigator = mainContentSearch.parentElement.querySelector(".navigator .content");
        navigator.innerHTML = "";
        let min = 1, cur = reqPageNumber, max = Math.ceil(animes.length / itemCount);
        const navigatorIndex = generateNavigatorList(min, cur, max);
        for (const number of navigatorIndex) {
            let text = number["text"], value = number["value"];
            let title = `Ir a la pagina ${value}`;
            if (text === "<<") title = `Ir a la primera pagina`;
            if (text === "<") title = `Ir a la pagina anterior`;
            if (text === ">") title = `Ir a la pagina siguiente`;
            if (text === ">>") title = `Ir a la ultima pagina`;
            const a = document.createElement("a");
            a.title = title;
            a.innerHTML = text;
            if (value !== cur && value > 0 && value <= max) {
                a.className = "button";
                a.onclick = () => {
                    const params = new URLSearchParams(newUrl.search);
                    params.set("n", value);
                    goTo(`/search/?${params.toString()}`);
                };
            } else {
                if (text === cur) {
                    a.className = "current";
                }
            }
            navigator.appendChild(a);
        }

        mainContentHome.style.display = "none";
        mainContentSearch.style.display = "";
        mainContentHorary.style.display = "none";
        mainContentAnime.style.display = "none";
        mainContentEpisode.style.display = "none";
    }
    async function horary(){
        console.log("||||| HORARY PAGE |||||");
        const reqDay = config.route[1] || dayMap[new Date(Date.now()).getDay()]["en"];
        
        
        const reqPageNumber = parseInt(config.route[2]) || 1;
        let animes = [];
        switch (reqDay.toLowerCase()) {
            case "monday"   : animes = database.V2_getMondayAnimes();    break;
            case "tuesday"  : animes = database.V2_getTuesdayAnimes();   break;
            case "wednesday": animes = database.V2_getWednesdayAnimes(); break;
            case "thursday" : animes = database.V2_getThursdayAnimes();  break;
            case "friday"   : animes = database.V2_getFridayAnimes();    break;
            case "saturday" : animes = database.V2_getSaturdayAnimes();  break;
            case "sunday"   : animes = database.V2_getSundayAnimes();    break;
            default: goTo("/"); return;
        }
        console.log(reqDay);

        const dayNavigator = mainContentHorary.querySelector(`section[name="dayNavigator"] .content`);
        dayNavigator.querySelectorAll(`a`).forEach(el => {el.classList.remove("current"); el.classList.add("button");});
        dayNavigator.querySelector(`a[name="${reqDay}"]`).classList.add("current");
        dayNavigator.querySelector(`a[name="${reqDay}"]`).classList.remove("button");
        if(reqDay === "thursday"){
            dayNavigator.parentElement.querySelector('.message').textContent = "Puede que aparezcan animes de mas mientras organizo la base de datos";
            dayNavigator.parentElement.querySelector('.message').style.display = "";
        }else{
            dayNavigator.parentElement.querySelector('.message').textContent = "";
            dayNavigator.parentElement.querySelector('.message').style.display = "none";
        }

        const animeList = mainContentHorary.querySelector(`section[name="animeList"] .content`);
        
        let itemCount = 20;
        if (reqPageNumber < 1) { goTo(`/horary/${reqDay}/1`); return; }
        if (reqPageNumber > 1 && reqPageNumber > Math.ceil(animes.length / itemCount)) { goTo(`/horary/${reqDay}/${Math.ceil(animes.length / itemCount)}`); return; }
        let i = 0
        for (let o = (reqPageNumber - 1) * itemCount; o < Math.min(reqPageNumber * itemCount, animes.length); o++, i++) {
            const anime = animes[o];
            const card = document.createElement("div");
            card.className = `card ${anime.type.toLowerCase().split(" ")[0]}`
            console.log(anime.title, await thumbnailAnimeImage(anime.id, anime.thumbnail));
            
            card.innerHTML = `
                <div class="image"><img src="${await thumbnailAnimeImage(anime.id, anime.thumbnail)}" alt="${anime.title}"></div>
                <p class="title">${anime.title}</p>
                <div class="hover">
                    <p>Titulo: ${anime.title}</p>
                    <p>Episodios: ${anime.episodeCount}</p>
                    <p>Fecha: ${new Date(anime.timestamp).toLocaleDateString()}</p>
                    ${anime.otherTitles.length > 0 ? `<p>Otros titulos:<br> - ${anime.otherTitles.join("<br> - ")}</p>` : ""}
                </div>
            `;
            card.onclick = () => goTo(`/anime/${encodeURIComponent(anime.title)}`)
            if (animeList.children[i]) {
                animeList.replaceChild(card, animeList.children[i]);
            } else {
                animeList.appendChild(card);
            }
        }
        for (let o = animeList.childElementCount - 1; o >= i; o--) {
            animeList.children[o].remove();
        }

        const navigator = mainContentHorary.querySelector(".navigator .content");
        navigator.innerHTML = "";
        let min = 1, cur = reqPageNumber, max = Math.ceil(animes.length / itemCount);
        const navigatorIndex = generateNavigatorList(min, cur, max);
        for (const number of navigatorIndex) {
            let text = number["text"], value = number["value"];
            let title = `Ir a la pagina ${value}`;
            if (text === "<<") title = `Ir a la primera pagina`;
            if (text === "<") title = `Ir a la pagina anterior`;
            if (text === ">") title = `Ir a la pagina siguiente`;
            if (text === ">>") title = `Ir a la ultima pagina`;
            const a = document.createElement("a");
            a.title = title;
            a.innerHTML = text;
            if (value !== cur && value > 0 && value <= max) {
                a.className = "button";
                a.onclick = () => { goTo(`/horary/${reqDay}/${value}`); };
            } else {
                if (text === cur) {
                    a.className = "current";
                }
            }
            navigator.appendChild(a);
        }
        mainContentHome.style.display = "none";
        mainContentSearch.style.display = "none";
        mainContentHorary.style.display = "";
        mainContentAnime.style.display = "none";
        mainContentEpisode.style.display = "none";
    }
    async function anime() {
        if (!config.route[1]) { goTo("/"); return; }
        const reqAnimeTitle = decodeURIComponent(config.route[1]);
        const reqPageNumber = parseInt(config.route[2]) || 1;
        const anime = database.V2_findAnimeByMainTitle(reqAnimeTitle)
        if (!anime) { goTo("/"); return; }
        document.title = `${anime.titles[0]} - WhereAnime`;

        const animeData = mainContentAnime.querySelector('section[name="animeData"] .content')
        animeData.className = `content ${anime.type.toLowerCase()}`
        document.querySelector('#background img').src = await coverAnimeImage(anime.id, anime.pages.length > 0 ? anime.pages[0].thumbnail : "");
        animeData.querySelector('.image img').src = await coverAnimeImage(anime.id, anime.pages.length > 0 ? anime.pages[0].thumbnail : "");
        animeData.querySelector('.title').textContent = anime.titles[0]
        switch (anime.status.toLowerCase()) {
            case "en emision": animeData.querySelector('.status').className = `status onair`; break;
            case "finalizado": animeData.querySelector('.status').className = `status ended`; break;
            default: animeData.querySelector('.status').className = `status unknown`; break;
        }
        
        animeData.querySelector('.status').textContent = anime.status
        animeData.querySelector('.status').onclick = () => {
            AdvancedSearcher.resetFilter();
            goTo(`/search/?status=${anime.status}`)
        }
        animeData.querySelector('.type').textContent = anime.type;
        animeData.querySelector('.type').onclick = () => {
            AdvancedSearcher.resetFilter();
            goTo(`/search/?type=${anime.type}`)
        }
        animeData.querySelector('.pages').innerHTML = "";
        for(const page of anime.pages){
            const span = document.createElement("span");
            span.classList.add("clickable");
            span.textContent = page.page;
            span.onclick = () => {
                AdvancedSearcher.resetFilter();
                console.log(`/search/?page=${page.page.replaceAll(" ", "-").toLowerCase()}`)
                goTo(`/search/?page=${page.page.replaceAll(" ", "-").toLowerCase()}`)
            }
            animeData.querySelector('.pages').appendChild(span);
            if(anime.pages.indexOf(page) < anime.pages.length - 1){
                animeData.querySelector('.pages').insertAdjacentHTML('beforeend', "<span>, </span>");
            }
        }
        animeData.querySelector('.lang').textContent = anime.lang;
        animeData.querySelector('.lang').onclick = () => {
            AdvancedSearcher.resetFilter();
            goTo(`/search/?lang=${anime.lang}`)
        }
        animeData.querySelector('.genres').innerHTML = "";
        for(const genre of anime.genres){
            const span = document.createElement("span");
            span.classList.add("clickable");
            span.textContent = genre;
            span.onclick = () => {
                AdvancedSearcher.resetFilter();
                goTo(`/search/?genre=${genre.replaceAll(" ", "-").toLowerCase()}`)
            }
            animeData.querySelector('.genres').appendChild(span);
        }
        animeData.querySelector('.episodes').textContent = anime.episodes.length;
        if(anime.status === "En Emision"){
            let date = new Date((anime.episodes.length > 0 ? anime.episodes[0].timestamp : 0) + (7 * 24 * 60 * 60 * 1000));
            animeData.querySelector('.nextDate').textContent = `${dayMap[date.getDay()]["es"]} (${date.toLocaleDateString()})`;
            animeData.querySelector('.nextDate').onclick = () => {
                goTo(`/horary/${dayMap[date.getDay()]["en"]}/1`)
            };
            animeData.querySelector('.nextDate').parentElement.style.display = "";
        }else{
            animeData.querySelector('.nextDate').parentElement.style.display = "none";
            animeData.querySelector('.nextDate').textContent = "";

        }
        animeData.querySelector('.lastDate').textContent = new Date(anime.episodes.length > 0 ? anime.episodes[0].timestamp : 0).toLocaleDateString();
        animeData.querySelector('.firstDate').textContent = new Date(anime.timestamp).toLocaleDateString();
        if (anime.titles.slice(1).length > 0) {
            animeData.querySelector('.otherTitles').innerHTML = ` - ${anime.titles.slice(1).join("<br> - ")}`;
            animeData.querySelector('.otherTitles').parentElement.style.display = "";
        } else {
            animeData.querySelector('.otherTitles').parentElement.style.display = "none";
        }
        const episodeList = mainContentAnime.querySelector('section[name="episodeList"] .content')
        let itemCount = 8;
        if (reqPageNumber < 1) { goTo(`/anime/${encodeURIComponent(reqAnimeTitle)}/1`); return; }
        if (reqPageNumber > 1 && reqPageNumber > Math.ceil(anime.episodes.length / itemCount)) { goTo(`/anime/${encodeURIComponent(reqAnimeTitle)}/${Math.ceil(anime.episodes.length / itemCount)}`); return; }
        episodeList.parentElement.querySelector('h2').textContent = `Lista de episodios - Pag. ${reqPageNumber}/${Math.ceil(anime.episodes.length / itemCount)}`;
        let i = 0;
        for (let o = (reqPageNumber - 1) * itemCount; o < Math.min(reqPageNumber * itemCount, anime.episodes.length); o++, i++) {
            const episode = anime.episodes[o];
            const card = document.createElement("div");
            card.className = `card ${anime.type.toLowerCase().split(" ")[0]}`
            card.innerHTML = `
                <div class="image"><img src="${await thumbnailAnimeImage(anime.id,anime.pages[0].thumbnail)}" alt="${anime.titles[0]}"></div>
                <p class="title">${anime.titles[0]}</p>
                <p class="episode">${episode.episode}</p>
                <div class="hover">
                    <p>Titulo: ${anime.titles[0]}</p>
                    <p>Episodio: ${episode.episode}</p>
                    <p>Fecha: ${new Date(episode.timestamp).toLocaleDateString()}</p>
                </div>
            `;
            card.onclick = () => goTo(`/episode/${encodeURIComponent(anime.titles[0])}/${episode.episode}`)
            if (episodeList.children[i]) {
                episodeList.replaceChild(card, episodeList.children[i]);
            } else {
                episodeList.appendChild(card);
            }

        }
        for (let f = episodeList.childElementCount - 1; f >= i; f--) {
            episodeList.children[f].remove();
        }
        const navigator = episodeList.parentElement.querySelector(".navigator .content");
        navigator.innerHTML = "";
        let min = 1, cur = reqPageNumber, max = Math.ceil(anime.episodes.length / itemCount);
        const navigatorIndex = generateNavigatorList(min, cur, max);
        for (const number of navigatorIndex) {
            let text = number["text"], value = number["value"];
            let title = `Ir a la pagina ${value}`;
            if (text === "<<") title = `Ir a la primera pagina`;
            if (text === "<") title = `Ir a la pagina anterior`;
            if (text === ">") title = `Ir a la pagina siguiente`;
            if (text === ">>") title = `Ir a la ultima pagina`;
            const a = document.createElement("a");
            a.title = title;
            a.innerHTML = text;
            if (value !== cur && value > 0 && value <= max) {
                a.className = "button";
                a.onclick = () => { goTo(`/anime/${anime.titles[0]}/${value}`); };
            } else {
                if (text === cur) {
                    a.className = "current";
                }
            }
            navigator.appendChild(a);
        }

        mainContentHome.style.display = "none";
        mainContentSearch.style.display = "none";
        mainContentHorary.style.display = "none";
        mainContentAnime.style.display = "";
        mainContentEpisode.style.display = "none";
    }
    async function episode() {
        if (!config.route[1]) { goTo("/"); return; }
        const reqAnimeTitle = decodeURIComponent(config.route[1]);
        const reqEpisode = parseFloat(config.route[2]);
        const reqPageNumber = parseInt(config.route[3]) || 1;
        const anime = database.V2_findAnimeByMainTitle(reqAnimeTitle)
        if (!anime) { goTo("/"); return; }
        const episode = anime.episodes.filter(e => e.episode === reqEpisode)[0];
        if (!episode) { goTo(`/anime/${encodeURIComponent(reqAnimeTitle)}`); return; }
        document.title = `${anime.titles[0]} - WhereAnime`;

        const animeData = mainContentEpisode.querySelector('section[name="animeData"] .content')
        animeData.className = `content ${anime.type.toLowerCase()}`
        animeData.querySelector('.image').onclick = () => goTo(`/anime/${encodeURIComponent(reqAnimeTitle)}`);
        document.querySelector('#background img').src = await coverAnimeImage(anime.id, anime.pages[0].thumbnail);
        animeData.querySelector('.image img').src = await coverAnimeImage(anime.id, anime.pages[0].thumbnail);
        switch (anime.status.toLowerCase()) {
            case "en emision": animeData.querySelector('.status').className = `status onair`; break;
            case "finalizado": animeData.querySelector('.status').className = `status ended`; break;
            default: animeData.querySelector('.status').className = `status unknown`; break;
        }
        animeData.querySelector('.status').textContent = anime.status
        animeData.querySelector('.status').onclick = () => {
            AdvancedSearcher.resetFilter();
            AdvancedSearcher.setFilter("status", anime.status, true)
            goTo("/search/1")
        }
        animeData.querySelector('.title').textContent = anime.titles[0]
        animeData.querySelector('.type').textContent = anime.type;
        animeData.querySelector('.episode').textContent = episode.episode;
        animeData.querySelector('.lang').textContent = anime.lang;
        animeData.querySelector('.firstDate').textContent = new Date(episode.timestamp).toLocaleDateString();
        if (anime.titles.slice(1).length > 0) {
            animeData.querySelector('.otherTitles').innerHTML = ` - ${anime.titles.slice(1).join("<br> - ")}`;
            animeData.querySelector('.otherTitles').parentElement.style.display = "";
        } else {
            animeData.querySelector('.otherTitles').parentElement.style.display = "none";
        }
        const episodeLinks = mainContentEpisode.querySelector('section[name="episodeLinks"] .content')
        let i = 0;
        let itemCount = 8;
        if (reqPageNumber < 1) { goTo(`/episode/${encodeURIComponent(reqAnimeTitle)}/1`); return; }
        if (reqPageNumber > Math.ceil(anime.episodes.length / itemCount)) { goTo(`/episode/${encodeURIComponent(reqAnimeTitle)}/${Math.ceil(episode.urls.length / itemCount)}`); return; }
        for (let o = (reqPageNumber - 1) * itemCount; o < Math.min(reqPageNumber * itemCount, episode.urls.length); o++, i++) {
            const url = episode.urls[o];
            const card = document.createElement("div");
            card.className = `card ${anime.type.toLowerCase().split(" ")[0]}`
            card.innerHTML = `
                <p class="page">${url.page}</p>
                <div class="image"><img src="${await thumbnailAnimeImage(anime.id, anime.pages[0].thumbnail)}" alt="${anime.titles[0]}"></div>
                <div class="hover">
                    <p>Titulo: ${anime.titles[0]}</p>
                    <p>Episodio: ${episode.episode}</p>
                    <p>Fecha: ${new Date(anime.timestamp).toLocaleDateString()}</p>
                </div>
            `;
            card.onclick = () => {
                if (confirm("")) {
                    window.open(url.url, '_blank')
                }
            };
            if (episodeLinks.children[i]) {
                episodeLinks.replaceChild(card, episodeLinks.children[i]);
            } else {
                episodeLinks.appendChild(card);
            }
        }
        for (let f = episodeLinks.childElementCount - 1; f >= i; f--) {
            episodeLinks.children[f].remove();
        }
        const navigator = episodeLinks.parentElement.querySelector(".navigator .content");
        navigator.innerHTML = "";
        let min = 1, cur = reqPageNumber, max = Math.ceil(episode.urls.length / itemCount);
        const navigatorIndex = generateNavigatorList(min, cur, max);
        for (const number of navigatorIndex) {
            let text = number["text"], value = number["value"];
            let title = `Ir a la pagina ${value}`;
            if (text === "<<") title = `Ir a la primera pagina`;
            if (text === "<") title = `Ir a la pagina anterior`;
            if (text === ">") title = `Ir a la pagina siguiente`;
            if (text === ">>") title = `Ir a la ultima pagina`;
            const a = document.createElement("a");
            a.title = title;
            a.innerHTML = text;
            if (value !== cur && value > 0 && value <= max) {
                a.className = "button";
                a.onclick = () => { goTo(`/episode/${anime.titles[0]}/${config.route[3]}/${value}`); };
            } else {
                if (text === cur) {
                    a.className = "current";
                }
            }
            navigator.appendChild(a);
        }
        mainContentHome.style.display = "none";
        mainContentSearch.style.display = "none";
        mainContentHorary.style.display = "none";
        mainContentAnime.style.display = "none";
        mainContentEpisode.style.display = "";
    }

    let routeSearch = new URLSearchParams(newUrl.search);
    let routePath = newUrl.href;
    routePath = routePath.substring(newUrl.origin.length, routePath.length)
    if(routePath.includes("?")){
        if(routePath.indexOf("?") === routePath.lastIndexOf("?")){
            routePath = routePath.substring(0, routePath.lastIndexOf("?"))
        }
    }
    
    config.route = `${routePath}/${routeSearch.get("p") || ""}/${encodeURIComponent(routeSearch.get("q") || "")}/${routeSearch.get("n") || ""}`;
    
    while (config.route.includes("//")) { config.route = config.route.replaceAll("//", "/"); }
    while (config.route.endsWith("/")) { config.route = config.route.substring(0, config.route.length - 1); }
    while (config.route.startsWith("/")) { config.route = config.route.substring(1, config.route.length); }
    config.route = config.route.split("/");
    console.log(config.route[0]);
        
    switch (config.route[0]) {
        case "": home(); break;
        case "search": search(); break;
        case "horary": horary(); break;
        case "episode": episode("episode"); break;
        case "anime": anime("anime"); break;
        default: goTo("/"); return;
    }

}
document.addEventListener('DOMContentLoaded', async () => {
    // Header
    header.querySelector('.content h1').onclick = () => goTo('/');
    header.querySelector('.content nav a[name="index"]').onclick = () => { goTo('/'); };
    header.querySelector('.content nav a[name="horary"]').onclick = () => { goTo('/horary'); };
    header.querySelector('.content nav a[name="repository"]').onclick = () => { AdvancedSearcher.resetFilter(); goTo('/search'); };
    searcher.querySelector('input').onkeydown = (event) => { if (event.key === "Enter") { headerSearcher(); } }
    headerSwitchNav.onclick = () => { document.querySelector("header > .content nav > .content").classList.toggle("open"); }
    searcher.querySelector('button').onclick = () => { headerSearcher(); }
    async function headerSearcher() {
        if (!searcher.classList.contains('hidden')) {
            let title = searcher.querySelector('input').value;
            title.replaceAll("#", "%25")
            title.replaceAll("?", "%3F")
            if (title.toLowerCase() === "/enable-ac") {
                localStorage.setItem('ac', true);
                database.config.AC = true;
                await loadDatabase();
                // goTo(config.location);
                return;
            }
            if (title.toLowerCase() === "/switch-ac") {
                database.config.AC = !database.config.AC;
                localStorage.setItem('ac', database.config.AC);
                localStorage.setItem('allow-ac', false);
                await loadDatabase()
                goTo(config.location);
                return;
            }
            if (title.toLowerCase() === "/disable-ac") {
                database.config.AC = false;
                localStorage.setItem('ac', false);
                localStorage.setItem('allow-ac', false);
                await loadDatabase()
                goTo(config.location);
                return;
            }
            if (title !== "") {
                AdvancedSearcher.resetFilter();
                searcher.querySelector('input').value = "";
                goTo(`/search/?${database.config.page !== "all" ? `p=${database.config.page}&` : ""}q=${encodeURIComponent(title)}&n=1`);
            }
        }
        searcher.classList.toggle('hidden');
        searcher.querySelector('input').focus();
    }
    advancedSearcher.querySelector('[name="title"] input').onkeydown = (e) => { if (e.key === "Enter") { advancedSearch(); } }
    advancedSearcher.querySelector('[name="title"] button').onclick = () => { advancedSearch(); }
    function advancedSearch() {
        let title = advancedSearcher.querySelector('[name="title"] input').value;
        const activeFilters = AdvancedSearcher.getActiveFilter();

        let filter = ``;
        if(activeFilters["types"])  { filter += `&type=${activeFilters["types"].join("&type=").replaceAll(" ", "-").toLowerCase()}`; }
        if(activeFilters["genres"]) { filter += `&genre=${activeFilters["genres"].join("&genre=").replaceAll(" ", "-").toLowerCase()}`; }
        if(activeFilters["langs"])  { filter += `&lang=${activeFilters["langs"].join("&lang=").replaceAll(" ", "-").toLowerCase()}`; }
        if(activeFilters["status"]) { filter += `&status=${activeFilters["status"].join("&status=").replaceAll(" ", "-").toLowerCase()}`; }
        if(activeFilters["years"])  { filter += `&year=${activeFilters["years"].join("&year=").replaceAll(" ", "-").toLowerCase()}`; }
        if(activeFilters["pages"])  { filter += `&page=${activeFilters["pages"].join("&page=").replaceAll(" ", "-").toLowerCase()}`; }
        console.log(activeFilters, filter);
        
        if(title !== ""){
            goTo(`/search/?q=${encodeURIComponent(title)}${filter}&n=1`);
        }else if(filter !== ""){
            goTo(`/search/?${filter.substring(1, filter.length)}&n=1`);
        } else {
            goTo(`/search/?n=1`);

        }
    }
    // Home page
    for (let index = 0; index < 19; index++) {
        mainContentHome.querySelector('section[name="recentEpisodes"] .content').innerHTML += `<div class="card anime"><div class="image"><img src="" alt=""></div></div>`;
        mainContentHome.querySelector('section[name="recentAnimes"] .content').innerHTML += `<div class="card anime"><div class="image"><img src="" alt=""></div></div>`;
    }
    
    // Horary Page
    const dayNavigator = mainContentHorary.querySelector(`section[name="dayNavigator"] .content`);
    dayNavigator.querySelector(`a[name="monday"]`).onclick = () => { goTo("/horary/monday"); };
    dayNavigator.querySelector(`a[name="tuesday"]`).onclick = () => { goTo("/horary/tuesday"); };
    dayNavigator.querySelector(`a[name="wednesday"]`).onclick = () => { goTo("/horary/wednesday"); };
    dayNavigator.querySelector(`a[name="thursday"]`).onclick = () => { goTo("/horary/thursday"); };
    dayNavigator.querySelector(`a[name="friday"]`).onclick = () => { goTo("/horary/friday"); };
    dayNavigator.querySelector(`a[name="saturday"]`).onclick = () => { goTo("/horary/saturday"); };
    dayNavigator.querySelector(`a[name="sunday"]`).onclick = () => { goTo("/horary/sunday"); };
    
    // Last step
    await loadDatabase();
    goTo(config.location || `/`)
})