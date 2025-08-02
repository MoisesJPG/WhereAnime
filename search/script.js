//#region Importaciones y elementos
import { database } from "../src/js/database.js";
import { generateAnimeCard } from "../src/js/v2/card.js";
import { generateNavigatorList, log } from "../src/js/v2/misc.js";
const repository = document.querySelector(`#repository .content`);
const navigator = document.querySelector(`#repository .navigator .content`);
//#endregion Importaciones y elementos

//#region Verificar parametros
const url = new URL(window.location);
const params = new URLSearchParams(window.location.search);
const param_page = params.get('p') || "";
const param_query = params.get('q') || "";
const param_query_number = parseInt(params.get('n')) || 1;

export function goTo(p, q, n) {
    url.searchParams.set('p', p);
    url.searchParams.set('q', q);
    url.searchParams.set('n', n);
    window.history.pushState({}, '', url);
}
//#endregion Verificar parametros

//#region Configurar la base de datos
await database.load();
database.config.page = param_page || "all";
database.config.ac = localStorage.getItem(`ac`) === "true";
//#endregion Configurar la base de datos

//#region Comportamiento
async function main() {
    repository.parentElement.querySelector('h2').textContent = param_query !== "" ? `Buscando '${param_query}'` : `Repositorio`;
    const animes = database.findAnimesByTitle(param_query, "datetime", "desc");
    if (animes.length > 0) {
        repository.innerHTML = "";
        let animesPerPage = 20 * 1;
        let min = 1;
        let cur = param_query_number;
        let max = Math.ceil(animes.length / animesPerPage);
        if (cur < min) {
            window.location = `?${param_page !== "" ? `p=${param_page}&`: ""}${param_query !== "" ? `q=${encodeURI(param_query)}&`: ""}n=${min}`
        } else if (cur > max) {
            window.location = `?${param_page !== "" ? `p=${param_page}&`: ""}${param_query !== "" ? `q=${encodeURI(param_query)}&`: ""}n=${max}`
        } else {
            animes.slice((cur-1) * animesPerPage, cur * animesPerPage).forEach(anime => {
                repository.appendChild(generateAnimeCard(anime, param_query));
            });
            navigator.innerHTML = "";
            const list = generateNavigatorList(min, cur, max);
            for (const number of list) {
                let text = number["text"], value = number["value"];
                let title = `Ir a la pagina ${value}`;
                if(text === "<<") title = `Ir a la primera pagina`;
                if(text === "<") title = `Ir a la pagina anterior`;
                if(text === ">") title = `Ir a la pagina siguiente`;
                if(text === ">>") title = `Ir a la ultima pagina`;
                if (value !== cur && value > 0 && value <= max) {
                    navigator.innerHTML += `<a class="button" title="${title}" href="?${param_page !== "" ? `p=${param_page}&`: ""}${param_query !== "" ? `q=${encodeURI(param_query)}&`: ""}n=${value}">${text}</a>`
                } else {
                    if(text !== cur){
                        navigator.innerHTML += `<a title="${title}">${text}</a>`
                    }else{
                        navigator.innerHTML += `<a class="current" title="${title}">${text}</a>`
                    }
                }
            }
            navigator.parentElement.style.display = "";
        }
    } else {
        repository.innerHTML = `<h3>No se han encontrado resultados para la busqueda '${param_query}'</h3>`;
    }
}
async function start() {
    await main();
}
start();
//#endregion Comportamiento