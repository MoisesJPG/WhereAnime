import { database } from "./src/js/database.js";
const header = document.querySelector('header');
const main = document.querySelector('main');
const mainContentAnime = document.querySelector('main .content[name="anime"]');
const mainContentEpisode = document.querySelector('main .content[name="episode"]');
const mainContentHome = document.querySelector('main .content[name="home"]');
const mainContentSearch = document.querySelector('main .content[name="search"]');
const searcher = header.querySelector(`#searcher`);

const config = {
    location: localStorage.getItem('WhereAnime.location'),
    route: null,
    databaseLoaded: false,
    reloadDelay: 5 * 60 * 1000
};


async function loadDatabase() {
    await database.load();
    config.databaseLoaded = true;
}
loadDatabase();
const intervals = {}
function search() {
    if (!searcher.classList.contains('hidden')) {
        let title = searcher.querySelector('input').value;
        title.replaceAll("#", "%25")
        if (title.toLowerCase() === "/enable-ac") {
            localStorage.setItem('ac', true);
            database.config.ac = true;
            goTo(config.location);
            return;
        }
        if (title.toLowerCase() === "/switch-ac") {
            database.config.ac = !database.config.ac;
            localStorage.setItem('ac', database.config.ac);
            localStorage.setItem('allow-ac', false);
            goTo(config.location);
            return;
        }
        if (title.toLowerCase() === "/disable-ac") {
            database.config.ac = false;
            localStorage.setItem('ac', false);
            localStorage.setItem('allow-ac', false);
            goTo(config.location);
            return;
        }
        if (title !== "") {
            searcher.querySelector('input').value = "";
            goTo(`/WhereAnime/search/?${database.config.page !== "all" ? `p=${database.config.page}&` : ""}q=${encodeURIComponent(title)}&n=1`);
        }
    }
    searcher.classList.toggle('hidden');
    searcher.querySelector('input').focus();
}
function goTo(url) {
    const base = window.location.origin; // Base actual
    const newUrl = new URL(url, base);   // Construye URL absoluta
    localStorage.setItem('WhereAnime.location', url)
    config.location = url
    let originalTitle = newUrl.pathname;
    let start = 0;
    let intervalLength = originalTitle.length;
    let title = "";
    clearInterval(intervals["pageTitle"])
    intervals["pageTitle"] = setInterval(() => {
        if (originalTitle.length <= intervalLength) {
            document.title = originalTitle; // Nothing to scroll
            return;
        }

        if (start >= originalTitle.length) {
            start = 0;
        }

        let end = start + intervalLength;
        if (end > originalTitle.length) {
            title = originalTitle.substring(start) + "  " + originalTitle.substring(0, end - originalTitle.length);
        } else {
            title = originalTitle.substring(start, end);
        }

        document.title = title;
        start++;
    }, 200); // Faster for smoother animation (optional)

    // history.replaceState(null, '', newUrl.href); // Reemplaza en el historial
    prepareGoTo(newUrl);
}
function generateNavigatorList(min, cur, max) {
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

    const normalize = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const normText = normalize(text);
    const normSearch = normalize(searchTitle);

    let result = '';
    let i = 0;

    while (i < text.length) {
        let found = false;

        for (let j = text.length; j > i; j--) {
            const segment = text.slice(i, j);
            if (normalize(segment).startsWith(normSearch)) {
                result += '<b>' + segment.slice(0, searchTitle.length) + '</b>';
                i += searchTitle.length;
                found = true;
                break;
            }
        }

        if (!found) {
            result += text[i];
            i++;
        }
    }

    return result;
}
let firstTimeHome = true;
function prepareGoTo(newUrl = location) {
    // console.clear();
    let AC = localStorage.getItem('ac') === "true";

    function home() {
        const recentEpisodes = mainContentHome.querySelector('section[name="recentEpisodes"] .content');
        const recentAnimes = mainContentHome.querySelector('section[name="recentAnimes"] .content');
        function refresh() {
            if (!database.loaded) { setTimeout(() => { refresh(); }, 1000); return; }
            const episodes = database.V2_getRecentEpisodes();
            for (let i = 0; i < episodes.length; i++) {
                const episode = episodes[i];
                const card = document.createElement("div");
                card.className = `card ${episode.animeType.toLowerCase()}`
                card.innerHTML = `
                    <div class="image"><img src="${episode.thumbnail}" alt="${episode.title}"></div>
                    <p class="title">${episode.title}</p>
                    <p class="episode">${episode.episode}</p>
                    <div class="hover">
                        <p>Titulo: ${episode.title}</p>
                        <p>Episodio: ${episode.episode}</p>
                        <p>Fecha: ${new Date(episode.timestamp).toLocaleDateString()}</p>
                    </div>
                `;
                let path = `/WhereAnime/episode/${episode.title}/${episode.episode}`;
                card.onclick = () => goTo(path)
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
                card.className = `card ${anime.type.toLowerCase()}`
                card.innerHTML = `
                    <div class="image"><img src="${anime.thumbnail}" alt="${anime.title}"></div>
                    <p class="title">${anime.title}</p>
                    <div class="hover">
                        <p>Titulo: ${anime.title}</p>
                        <p>Episodios: ${anime.episodeCount}</p>
                        <p>Fecha: ${new Date(anime.timestamp).toLocaleDateString()}</p>
                        ${anime.otherTitles.length > 0 ? `<p>Otros titulos:<br> - ${anime.otherTitles.join("<br> - ")}</p>` : ""}
                    </div>
                `;
                let path = `/WhereAnime/anime/${anime.title}`;
                card.onclick = () => goTo(path)
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
        console.log(rem);
        
        intervals["homeRecentFirstRefresh"] = setTimeout(() => {
            refresh();
            intervals["homeRecentLoopRefresh"] = setInterval(() => {
                refresh();
            }, config.reloadDelay);
        }, rem);
        mainContentAnime.style.display = "none";
        mainContentHome.style.display = "";
        mainContentSearch.style.display = "none";
    }
    function anime() {
        if (!config.route[2]) { goTo("/WhereAnime"); return; }
        const page = parseInt(config.route[3]) || 1;
        const animeTitle = decodeURIComponent(config.route[2]);
        const anime = database.V2_findAnimeByMainTitle(animeTitle)
        if (!anime) { goTo("/WhereAnime"); return; }
        const animeData = mainContentAnime.querySelector('section[name="animeData"] .content')
        animeData.className = `content ${anime.type.toLowerCase()}`
        animeData.querySelector('.image img').src = anime.pages[0].thumbnail;
        animeData.querySelector('.title').textContent = anime.titles[0]
        animeData.querySelector('.episodes').textContent = anime.episodes.length
        animeData.querySelector('.lastDate').textContent = new Date(anime.episodes[0].datetime).toLocaleDateString();
        animeData.querySelector('.firstDate').textContent = new Date(anime.datetime).toLocaleDateString();
        if (anime.titles.slice(1).length > 0) {
            animeData.querySelector('.otherTitles').innerHTML = ` - ${anime.titles.slice(1).join("<br> - ")}`;
            animeData.querySelector('.otherTitles').parentElement.style.display = "";
        } else {
            animeData.querySelector('.otherTitles').parentElement.style.display = "none";
        }
        const episodeList = mainContentAnime.querySelector('section[name="episodeList"] .content')
        let itemCount = 8;
        if (page < 1) { goTo(`/WhereAnime/anime/${animeTitle}/1`); return; }
        if (page > Math.ceil(anime.episodes.length / itemCount)) { goTo(`/WhereAnime/anime/${animeTitle}/${Math.ceil(anime.episodes.length / itemCount)}`); return; }
        episodeList.parentElement.querySelector('h2').textContent = `Lista de episodios - Pag. ${page}/${Math.ceil(anime.episodes.length / itemCount)}`;
        let i = 0;
        for (let o = (page - 1) * itemCount; o < Math.min(page * itemCount, anime.episodes.length); o++, i++) {
            const episode = anime.episodes[o];
            const card = document.createElement("div");
            card.className = `card ${anime.type.toLowerCase()}`
            card.innerHTML = `
                <div class="image"><img src="${anime.pages[0].thumbnail}" alt="${anime.titles[0]}"></div>
                <p class="title">${anime.titles[0]}</p>
                <p class="episode">${episode.episode}</p>
                <div class="hover">
                    <p>Titulo: ${anime.titles[0]}</p>
                    <p>Episodio: ${episode.episode}</p>
                    <p>Fecha: ${new Date(anime.datetime).toLocaleDateString()}</p>
                </div>
            `;
            let path = `/WhereAnime/episode/${anime.titles[0]}/${episode.episode}`;
            card.onclick = () => goTo(path)
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
        let min = 1, cur = page, max = Math.ceil(anime.episodes.length / itemCount);
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
                a.onclick = () => { goTo(`/WhereAnime/anime/${anime.titles[0]}/${value}`); };
            } else {
                if (text === cur) {
                    a.className = "current";
                }
            }
            navigator.appendChild(a);
        }
        mainContentAnime.style.display = "";
        mainContentEpisode.style.display = "none";
        mainContentHome.style.display = "none";
        mainContentSearch.style.display = "none";
    }
    function episode() {
        if (!config.route[2]) { goTo("/WhereAnime"); return; }
        const page = parseInt(config.route[4]) || 1;
        const animeTitle = decodeURIComponent(config.route[2]);
        const anime = database.V2_findAnimeByMainTitle(animeTitle)
        if (!anime) { goTo("/WhereAnime"); return; }
        const episode = anime.episodes.filter(e => e.episode === parseFloat(config.route[3]))[0];
        const animeData = mainContentEpisode.querySelector('section[name="animeData"] .content')
        animeData.className = `content ${anime.type.toLowerCase()}`
        animeData.querySelector('.image').onclick = () => goTo(`/WhereAnime/anime/${animeTitle}`);
        animeData.querySelector('.image img').src = anime.pages[0].thumbnail;
        animeData.querySelector('.title').textContent = anime.titles[0]
        animeData.querySelector('.episode').textContent = episode.episode;
        animeData.querySelector('.firstDate').textContent = new Date(episode.datetime).toLocaleDateString();
        if (anime.titles.slice(1).length > 0) {
            animeData.querySelector('.otherTitles').innerHTML = ` - ${anime.titles.slice(1).join("<br> - ")}`;
            animeData.querySelector('.otherTitles').parentElement.style.display = "";
        } else {
            animeData.querySelector('.otherTitles').parentElement.style.display = "none";
        }
        const episodeLinks = mainContentEpisode.querySelector('section[name="episodeLinks"] .content')
        let i = 0;
        let itemCount = 8;
        if (page < 1) { goTo(`/WhereAnime/episode/${animeTitle}/1`); return; }
        if (page > Math.ceil(anime.episodes.length / itemCount)) { goTo(`/WhereAnime/episode/${animeTitle}/${Math.ceil(episode.urls.length / itemCount)}`); return; }
        for (let o = (page - 1) * itemCount; o < Math.min(page * itemCount, episode.urls.length); o++, i++) {
            const url = episode.urls[o];
            const card = document.createElement("div");
            card.className = `card ${anime.type.toLowerCase()}`
            card.innerHTML = `
                <p class="page">${url.page}</p>
                <div class="image"><img src="${anime.pages[0].thumbnail}" alt="${anime.titles[0]}"></div>
                <div class="hover">
                    <p>Titulo: ${anime.titles[0]}</p>
                    <p>Episodio: ${episode.episode}</p>
                    <p>Fecha: ${new Date(anime.datetime).toLocaleDateString()}</p>
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
        let min = 1, cur = page, max = Math.ceil(episode.urls.length / itemCount);
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
                a.onclick = () => { goTo(`/WhereAnime/episode/${anime.titles[0]}/${config.route[3]}/${value}`); };
            } else {
                if (text === cur) {
                    a.className = "current";
                }
            }
            navigator.appendChild(a);
        }
        mainContentAnime.style.display = "none";
        mainContentEpisode.style.display = "";
        mainContentHome.style.display = "none";
        mainContentSearch.style.display = "none";
    }
    function search() {
        console.clear();
        const content = mainContentSearch.querySelector("section .content");
        const page = (config.route.length === 3 ? parseInt(config.route[2]) : parseInt(config.route[3])) || 1
        const queryTitle = (config.route.length === 3 ? "" : config.route[2]) || "";
        const animes = database.V2_findAnimesByTitle(queryTitle)

        let itemCount = 20;
        if (page < 1) { goTo(`/WhereAnime/search/${queryTitle}`); return; }
        if (page > 1 && page > Math.ceil(animes.length / itemCount)) { goTo(`/WhereAnime/search/${queryTitle}/${Math.ceil(animes.length / itemCount)}`); return; }
        let i = 0;
        for (let o = (page - 1) * itemCount; o < Math.min(page * itemCount, animes.length); o++, i++) {
            const anime = animes[o];
            const card = document.createElement("div");
            card.className = `card ${anime.type.toLowerCase()}`
            card.innerHTML = `
                <div class="image"><img src="${anime.thumbnail}" alt="${anime.title}"></div>
                <p class="title">${highlightMatch(anime.title, queryTitle)}</p>
                <div class="hover">
                    <p>Titulo: ${highlightMatch(anime.title, queryTitle)}</p>
                    <p>Episodios: ${anime.episodeCount}</p>
                    <p>Fecha: ${new Date(anime.timestamp).toLocaleDateString()}</p>
                    ${anime.otherTitles.length > 0 ? `<p>Otros titulos:<br> - ${highlightMatch(anime.otherTitles.join("<br> - "), queryTitle)}</p>` : ""}
                </div>
            `;
            let path = `/WhereAnime/anime/${anime.title}`;
            card.onclick = () => goTo(path)
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
        let min = 1, cur = page, max = Math.ceil(animes.length / itemCount);
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
                a.onclick = () => { goTo(`/WhereAnime/search/${queryTitle}/${value}`); };
            } else {
                if (text === cur) {
                    a.className = "current";
                }
            }
            navigator.appendChild(a);
        }

        mainContentAnime.style.display = "none";
        mainContentEpisode.style.display = "none";
        mainContentHome.style.display = "none";
        mainContentSearch.style.display = "";
    }
    let routeSearch = new URLSearchParams(newUrl.search);
    console.log([...routeSearch]);
    config.route = `${newUrl.pathname}/${routeSearch.get("p") || ""}/${routeSearch.get("q") || ""}/${routeSearch.get("n") || ""}`.replaceAll("//", "/");
    while (config.route.includes("//")) { config.route = config.route.replaceAll("//", "/"); }
    while (config.route.endsWith("/")) { config.route = config.route.substring(0, config.route.length - 1); }
    while (config.route.startsWith("/")) { config.route = config.route.substring(1, config.route.length); }
    config.route = config.route.split("/");
    console.log(config.route);

    if (config.route.length > 1) {
        switch (config.route[1]) {
            case "home": home(); break;
            case "search": search(); break;
            case "episode": episode("episode"); break;
            case "anime": anime("anime"); break;
            default: break;
        }
    } else {
        home();
    }
    let i = 0;
    for (i = 0; i < config.route.length; i++) {
        let e = main.querySelectorAll('#route span')[i];
        if (!e) {
            main.querySelector('#route').insertAdjacentHTML('beforeend', '<span></span>')
            e = main.querySelectorAll('#route span')[i];
        }
        e.setAttribute('name', config.route[i]);
        let path = "";
        e.textContent = decodeURIComponent(config.route[i]);

        if (i > 1) {
            if (i >= config.route.length - 1) {
                path = null;
            } else if (config.route[1] === "search") {
                let sub = "";
                if (config.route.length === 5) { sub = `p=${config.route.slice(2, i + 1).join("&=")}`.replace("&=", "&q=").replace("&=", "&n=") }
                if (config.route.length === 4) { sub = `q=${config.route.slice(2, i + 1).join("&=")}`.replace("&=", "&n=") }
                if (i === 2) sub += "&n=1";
                path = `/${config.route.slice(0, 2).join("/")}?${sub}`
            } else if (config.route[1] === "anime") {
                path = `/${config.route.slice(0, i + 1).join("/")}`
                if (i === 3) { e.textContent = `Page ${config.route[i]}` }
            } else if (config.route[1] === "episode") {
                if (i === 2) {
                    path = `/${config.route.slice(0, i + 1).join("/")}`.replaceAll("/episode/", "/anime/")
                } else {
                    path = `/${config.route.slice(0, i + 1).join("/")}`
                }
                if (i === 4) { e.textContent = `Page ${config.route[i]}` }
            } else {
                path = `/${config.route.slice(0, i + 1).join("/")}`
            }
        } else {
            if (i === 1 && config.route[1] === "anime") { path = null; }
            else if (i === 1 && config.route[1] === "episode") { path = null; }
            else { path = `/${config.route.slice(0, i + 1).join("/")}`; }
        }

        console.log(i, config.route, config.route.length - 1, path)
        if (path !== null) {
            e.classList.add('enable')
            e.title = path;
            e.onclick = () => { goTo(path) }
        } else {
            e.classList.remove('enable');
            e.title = null;
            e.onclick = null;
        }
    }
    for (let f = main.querySelectorAll('#route span').length - 1; f >= i; f--) {
        main.querySelectorAll('#route span')[f].remove();
    }

}
setTimeout(() => {
    // loadDatabase();
}, 1000);
document.addEventListener('DOMContentLoaded', async () => {
    // Header
    header.querySelector('.content h1').onclick = () => goTo('/WhereAnime');
    header.querySelector('.content nav a[name="index"]').onclick = () => goTo('/WhereAnime');
    header.querySelector('.content nav a[name="repository"]').onclick = () => goTo('/WhereAnime/search');
    searcher.querySelector('input').onkeydown = (event) => { if (event.key === "Enter") { search(); } }
    searcher.querySelector('button').onclick = () => { search(); }
    for (let index = 0; index < 19; index++) {
        mainContentHome.querySelector('section[name="recentEpisodes"] .content').innerHTML += `
            <div class="card anime">
                <div class="image">
                    <img src="" alt="">
                </div>
            </div>
        `;
        mainContentHome.querySelector('section[name="recentAnimes"] .content').innerHTML += `
            <div class="card anime">
                <div class="image">
                    <img src="" alt="">
                </div>
            </div>
        `;

    }
    await loadDatabase();
    goTo(config.location || `/WhereAnime`)
})