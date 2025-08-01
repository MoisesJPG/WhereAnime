import { generateCard } from "./card.js";
import { generateNavigatorList } from "./misc.js";
const modal = document.querySelector(`#modal`);
const navigator = modal.querySelector(`.content .foot .navigator .content`);
function updateNavigator(type, anime = null, episode = null,min, cur, max) {
    navigator.innerHTML = ""
    const navList = generateNavigatorList(min, cur, max);
    for (const number of navList) {
        let text = number["text"], value = number["value"];
        let title = `Ir a la pagina ${value}`;
        if(text === "<<") title = `Ir a la primera pagina`;
        if(text === "<") title = `Ir a la pagina anterior`;
        if(text === ">") title = `Ir a la pagina siguiente`;
        if(text === ">>") title = `Ir a la ultima pagina`;
        const a = document.createElement("a");
        a.title = title;
        a.innerHTML = text;
        if (value !== cur && value > 0 && value <= max) {
            a.className = "button";
            if(type === "AnimeModal"){
                a.onclick = () => { openAnimeModal(anime, value); };
            }else if(type === "EpisodeModal"){
                a.onclick = () => { openEpisodeModal(anime, episode, value); };
            }
        } else {
            if(text === cur){
                a.className = "current";
            }
        }
        navigator.appendChild(a);
    }
}
export function openAnimeModal(anime, page = parseInt(modal.getAttribute("nav-page")) || 1) {
    let itemAmount = 8, min = 1, cur = page, max = Math.ceil(anime.episodes.length / itemAmount);
    modal.setAttribute("nav-page", cur);
    modal.querySelector(`.content .head .back`).style.display = "none";
    modal.querySelector(`.content .head .title`).innerHTML = `${anime.titles[0]}`;
    modal.querySelector(`.content .head .sub-title`).innerHTML = `Episodios ${anime.episodes.length - ((cur-1) * itemAmount)} a ${anime.episodes.length - (cur * itemAmount)+1 < 1 ? 1 : anime.episodes.length - (cur * itemAmount)+1}`;
    modal.querySelector(`.content .body`).innerHTML = "";
    updateNavigator("AnimeModal", anime, null, min, cur, max);
    for (const episode of anime.episodes.slice(0 + 8 * (cur - 1), 8 + 8 * (cur - 1))) {
        const div = generateCard("modal-episode", anime, episode, null, null);
        div.onclick = () => { openEpisodeModal(anime, episode); };
        modal.querySelector(`.content .body`).appendChild(div);
    }
    modal.querySelector(`.content .head .back`).onclick = null;
    modal.style.display = "";
    modal.querySelector(`.content .head .close`).onclick = () => { modal.removeAttribute("nav-page"); modal.removeAttribute("nav-url-page"); modal.style.display = "none"; }
}
export function openEpisodeModal(anime, episode, page = parseInt(modal.getAttribute("nav-url-page")) || 1) {
    let itemAmount = 8, min = 1, cur = page, max = Math.ceil(episode.urls.length / itemAmount);
    modal.setAttribute("nav-url-page", cur);
    modal.querySelector(`.content .head .back`).style.display = "";
    modal.querySelector(`.content .head .title`).innerHTML = anime.titles[0];
    modal.querySelector(`.content .head .sub-title`).innerHTML = `Episodio ${episode.episode}`;
    modal.querySelector(`.content .body`).innerHTML = "";
    updateNavigator("EpisodeModal", anime, episode,min, cur, max);
    for (const url of episode.urls.slice(0 + 8 * (cur - 1), 8 + 8 * (cur - 1))) {
        const div = generateCard("url", anime, episode, url, null);
        div.onclick = () => {
            if (confirm(`Estas apunto de ir a la pagina '${url.page}' a ver '${anime.titles[0]}' Ep.${episode.episode}, ¿Deseas continuar?`)) {
                window.open(url.url, '_blank');
            }
        }
        modal.querySelector(`.content .body`).appendChild(div);
    }
    modal.querySelector(`.content .head .back`).onclick = () => { openAnimeModal(anime); }
    modal.style.display = "";
    modal.querySelector(`.content .head .close`).onclick = () => { modal.removeAttribute("nav-page"); modal.removeAttribute("nav-url-page"); modal.style.display = "none"; }
}