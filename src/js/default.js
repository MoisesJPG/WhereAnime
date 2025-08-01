import { database } from "./database.js";

const header = document.querySelector("header");
const footer = document.querySelector("footer");
const modal = document.querySelector("#modal");
const allowedPages = {
    NoAC: {
        "Todos": "all",
        "AnimeAV1": "animeav1",
        "AnimeFenix": "animefenix",
        "AnimeFLV": "animeflv",
        "OtakusTV": "otakustv"
    },
    AC: {
        "HentaiLA": "hentaila"
    }
}
function generateHeader() {
    let AC = localStorage.getItem("ac") === "true";
    header.innerHTML = `
        <div class="content">
            <h1><a href="/WhereAnime/pages">${AC ? `WhereHentai`: `WhereAnime`}</a><span></span><a target="_blank"></a></h1>
            <nav>
                <div id="searcher" class="hidden"><input type="text" placeholder="Buscar..."><button>🔎</button></div>
                <a href="/WhereAnime/pages">Inicio</a>
                <a href="/WhereAnime/search">Repositorio</a>
                <div class="sub"><a>Paginas</a><div></div></div>
            </nav>
        </div>
    `;
    const searcher = header.querySelector(`#searcher`);
    searcher.querySelector('input').onkeydown = (event) => { if (event.key === "Enter") { search(); } }
    searcher.querySelector('button').onclick = () => { search(); }
    function search() {
        if (!searcher.classList.contains('hidden')) {
            let title = searcher.querySelector('input').value;
            title.replaceAll("#", "%25")
            let search = true;
            if (title.toLowerCase() === "/enable-ac") { search = false; localStorage.setItem('ac', true); window.location.reload(); }
            if (title.toLowerCase() === "/switch-ac") { search = false; localStorage.setItem('ac', enableAC ? false : true); localStorage.setItem('allow-ac', enableAC); window.location.reload(); }
            if (title.toLowerCase() === "/disable-ac") { search = false; localStorage.setItem('ac', false); localStorage.setItem('allow-ac', false); window.location.reload(); }
            if (search && title !== "") { window.location = `/WhereAnime/search/?${database.config.page !== "all" ? `p=${database.config.page}&` : ""}q=${encodeURIComponent(title)}&n=1`; }
        }
        searcher.classList.toggle('hidden');
        searcher.querySelector('input').focus();
    }

}
export function generatePagesHeader() {
    let AC = localStorage.getItem("ac") === "true";
    let pages = allowedPages[AC ? "AC": "NoAC"];
    generateHeader();
    header.querySelector(`.content nav .sub > div`).innerHTML = Object.keys(pages).map(p => `<a href="/WhereAnime/pages/?p=${pages[p]}">${p}</a>`).join("")
}
export function generateSearchHeader() {
    let AC = localStorage.getItem("ac") === "true";
    let pages = allowedPages[AC ? "AC": "NoAC"];
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || "";
    const n = params.get('n') || "";
    generateHeader();
    header.querySelector(`.content nav .sub > div`).innerHTML = Object.keys(pages).map(p => `<a href="/WhereAnime/search/?p=${pages[p]}${q !== "" ? `&q=${q}` : ``}${n > 1 ? `&n=${n}` : ``}">${p}</a>`).join("")
}
export function generateFooter() {
    footer.innerHTML = ``;
}
export function generateModal() {
    modal.style.display = "none"
    modal.innerHTML = `
        <div class="content">
            <div class="head">
                <button class="back"><</button>
                <div class="info">
                    <h2 class="title"></h2>
                    <h4 class="sub-title"></h4>
                </div>
                <button class="close">X</button>
            </div>
            <div class="body"></div>
            <div class="foot">
                <div class="navigator"><div class="content"></div></div>
            </div>
        </div>
    `;
}

const custom_root = document.querySelector('#custom-root');
document.onmousemove = (event) => {
    custom_root.textContent = `
        :root {
            --hover-top: ${event.clientY}px;
            --hover-left: ${event.clientX}px;
        }
    `;
}