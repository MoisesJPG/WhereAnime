import { database } from "../src/js/database.js";

// alert(window.screen.availWidth + "x" + window.screen.availHeight)
const params = new URLSearchParams(window.location.search);
if (params.size < 1) { window.location = "?/" }
const page = [...params][0][0].replace("/", "");
const allowPages = [
    "AnimeAV1",
    "AnimeFenix",
    "AnimeFLV",
    "OtakusTV",
    "search/title/*"
]
const pageIsAllowed = allowPages.some(key => {
    if (key.includes("*")) {
        const pattern = new RegExp("^" + key.replace("*", ".*") + "$");
        return pattern.test(page);
    }
    return key === page;
});
if (!pageIsAllowed && page !== "") {
    window.location = "?/"
}
database.page = page.startsWith('search/') ? "" : page;
database.searching = page.startsWith('search/') ? page.substring(0, page.lastIndexOf("/")) : "";
database.searchingPage = parseInt(page.substring(page.lastIndexOf("/") + 1, page.length))
database.load();
let enableAC = localStorage.getItem('ac') === "true";
let allowedAC = localStorage.getItem('allow-ac') === "true";
database.enableAC = enableAC;
if (allowedAC) {
    document.body.classList.add("ac");
}
if (enableAC) {
    document.querySelector('header h1').textContent = "WhereHentai"
}


const recentAnimes = document.getElementById('recentAnimes');
const recentEpisodes = document.getElementById('recentEpisodes');
const pagesNavigator = document.getElementById('pagesNavigator').getElementsByClassName('content')[0];


function showAdultContentConfirm() {
    if (confirm('Estas apunto de activar el modo (+18) ¿Deseas continuar?')) {
        localStorage.setItem('allow-ac', true);
        window.location.reload();
    } else {
        localStorage.setItem('allow-ac', false);
        allowedAC = false;
        document.body.classList.remove("ac");
        return false;
    }
}
function updateDatabaseHTML() { 
    if (database.searching === "") {
        recentEpisodes.innerHTML = "";
        database.getLastEpisodes(20).forEach(episode => {
            recentEpisodes.appendChild(generateEpisodeCard(episode));
        });
    } else {
        recentEpisodes.parentElement.querySelector('h2[name="recentEpisodes"]').style.display = "none"
        recentEpisodes.style.display = "none"
    }
    if (database.searching === "") {
        recentAnimes.innerHTML = "";
        database.getLastAnimes(database.animeCount).forEach(anime => {
            recentAnimes.appendChild(generateAnimeCard(anime, null));
        });
    } else {
        let searchTitle = database.searching.substring(13, database.searching.length);
        recentAnimes.parentElement.querySelector('h2[name="recentAnimes"] span').textContent = `Buscando '${searchTitle}'...`
        recentAnimes.innerHTML = "";
    }
}