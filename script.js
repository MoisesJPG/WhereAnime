import { database } from "./src/js/database.js";
const header = document.querySelector('header');
const main = document.querySelector('main');
const mainContentAnime = document.querySelector('main .content[name="anime"]');
const mainContentHome = document.querySelector('main .content[name="home"]');
const mainContentSearch = document.querySelector('main .content[name="search"]');
const searcher = header.querySelector(`#searcher`);

const config = {
    location: localStorage.getItem('location'),
    route: null,
    databaseLoaded: false,
    reloadDelay: 5 * 60 * 1000,
    ac: false
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
        let search = true;
        // if (title.toLowerCase() === "/enable-ac")  { search = false; localStorage.setItem('ac', true); window.location.reload(); }
        // if (title.toLowerCase() === "/switch-ac")  { search = false; localStorage.setItem('ac', enableAC ? false : true); localStorage.setItem('allow-ac', enableAC); window.location.reload(); }
        // if (title.toLowerCase() === "/disable-ac") { search = false; localStorage.setItem('ac', false); localStorage.setItem('allow-ac', false); window.location.reload(); }
        if (search && title !== "") { goTo(`/WhereAnime/search/?${database.config.page !== "all" ? `p=${database.config.page}&` : ""}q=${encodeURIComponent(title)}&n=1`); }
    }
    searcher.classList.toggle('hidden');
    searcher.querySelector('input').focus();
}
function goTo(url) {
    const base = window.location.origin; // Base actual
    const newUrl = new URL(url, base);   // Construye URL absoluta
    localStorage.setItem("location", url)
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
let firstTimeHome = true;
function prepareGoTo(newUrl = location) {
    console.clear();
    let AC = localStorage.getItem("ac") === "true";

    function anime(mode) {
        if(!config.route[2]) goTo("/WhereAnime")
        const animeTitle = decodeURIComponent(config.route[2]);
        const anime = database.V2_findAnimeByMainTitle(animeTitle)
        const episode = anime.episodes.filter(e => e.episode === parseFloat(config.route[3]))[0];
        console.log(animeTitle, anime, episode)
        const animeData = mainContentAnime.querySelector('section[name="animeData"] .content')
        animeData.querySelector('.image img').src = anime.pages[0].thumbnail;
        animeData.querySelector('.title').textContent = anime.titles[0]
        animeData.querySelector('.episodes').textContent = anime.episodes.length
        animeData.querySelector('.lastDate').textContent = new Date(anime.episodes[0].datetime).toLocaleDateString();
        animeData.querySelector('.firstDate').textContent = new Date(anime.datetime).toLocaleDateString();
        animeData.querySelector('.otherTitles').textContent = ` - ${anime.titles.join("<br> - ")}`;
        const episodeLinks = mainContentAnime.querySelector('section[name="episodeLinks"] .content')
        episodeLinks.parentElement.style.display = mode === "episode" ? "": "none";
        if(mode === "episode"){
            let i = 0;
            for(i = 0; i < episode.urls.length; i++){
                const url = episode.urls[i];
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
                let path = `/WhereAnime/episode/${anime.titles[0]}/${episode.episode}`;
                card.onclick = () => goTo(path)
                if (episodeLinks.children[i]) {
                    episodeLinks.replaceChild(card, episodeLinks.children[i]);
                } else {
                    episodeLinks.appendChild(card);
                }
    
            }
    
        }
        const episodeList = mainContentAnime.querySelector('section[name="episodeList"] .content')
        let i = 0;
        for(i = 0; i < anime.episodes.length; i++){
            const episode = anime.episodes[i];
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
        mainContentAnime.style.display = "";
        mainContentHome.style.display = "none";
        mainContentSearch.style.display = "none";
    }
    function home() {
        const recentEpisodes = mainContentHome.querySelector('section[name="recentEpisodes"] .content');
        const recentAnimes = mainContentHome.querySelector('section[name="recentAnimes"] .content');
        function getNextAlignedTime() {
            const now = new Date();
            const minutes = now.getMinutes();
            const next = new Date(now);
            const offset = (5 - ((minutes + 4) % 5)); // (ej. si estás en :00 → offset = 1)
            next.setMinutes(minutes + offset);
            next.setSeconds(0);
            next.setMilliseconds(0);
            return next.getTime() - now.getTime(); // tiempo restante en ms
        }
        function refresh() {
            if (!database.loaded) {
                setTimeout(() => {
                    refresh();
                }, 1000);
                return;
            }
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
                        ${anime.otherTitles.length > 0 ? `<p>Otros titulos:<br> - ${anime.otherTitles.join("<br> - ")}</p>`: ""}
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
                let time = Date.now() - 60 * 1000 - 1000;   // Tiempo actual en milisegundos
                let rem = config.reloadDelay - (time % config.reloadDelay);           // Tiempo restante hasta el próximo múltiplo de delay
                let totalSeconds = Math.floor(rem / 1000);  // Segundos totales restantes
                let s = totalSeconds % 60;                  // Segundos restantes (parte del minuto)
                let m = Math.floor(totalSeconds / 60);      // Minutos restantes
                el.innerHTML = `Proxima act.: ${m > 0 ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`}`;
            });
        }, 100);
        if(firstTimeHome){
            refresh(); firstTimeHome = false;
        }
        intervals["homeRecentFirstRefresh"] = setTimeout(() => {
            refresh();
            intervals["homeRecentLoopRefresh"] = setInterval(() => {
                refresh();
            }, config.reloadDelay);
        }, getNextAlignedTime());
        mainContentAnime.style.display = "none";
        mainContentHome.style.display = "";
        mainContentSearch.style.display = "none";
    }
    function search() {
        clearInterval(intervals["timeToRefresh"])
        mainContentAnime.style.display = "none";
        mainContentHome.style.display = "none";
        mainContentSearch.style.display = "";
    }
    let routeSearch = new URLSearchParams(newUrl.search);
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
            case "episode": anime("episode"); break;
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
            if (config.route[1] === "search") {
                let sub = "";
                if (config.route.length === 5) { sub = `p=${config.route.slice(2, i + 1).join("&=")}`.replace("&=", "&q=").replace("&=", "&n=") }
                if (config.route.length === 4) { sub = `q=${config.route.slice(2, i + 1).join("&=")}`.replace("&=", "&n=") }
                if (i === 2) sub += "&n=1";
                path = `/${config.route.slice(0, 2).join("/")}?${sub}`
            } else if(config.route[1] === "episode"){
                if(i === 2){
                    path = `/${config.route.slice(0, i + 1).join("/")}`.replaceAll("/episode/","/anime/")
                }else{
                    path = `/${config.route.slice(0, i + 1).join("/")}`
                }
            } else {
                path = `/${config.route.slice(0, i + 1).join("/")}`
            }
        } else {
            path = `/${config.route.slice(0, i + 1).join("/")}`
        }
        console.log(path);

        if (i < config.route.length - 1) {
            e.classList.add('enable')
            e.title = path;
            e.onclick = () => { goTo(path) }
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
    for (let index = 0; index < 20; index++) {
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