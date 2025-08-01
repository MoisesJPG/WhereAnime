import { database } from "../database.js";
import { highlightMatch, showAdultContentConfirm } from "./misc.js";
import { openAnimeModal, openEpisodeModal } from "./modal.js";

export function generateCard(type, anime, episode, url, highlight) {
    // Data
    let title = highlightMatch(anime.titles[0], highlight);
    let otherTitles = `<br> - ${highlightMatch(anime.titles.slice(1,anime.titles.length).join("<br> - "), highlight || "")}`;
    
    let thumbnail = anime.pages.filter(p => 
        p.page.toLowerCase() === (url ? url.page.toLowerCase() : database.config.page) ||
        database.config.page === "all"
    )[0].thumbnail;
    console.log(thumbnail);
    let date = new Date(url ? url.time : (episode ? episode.datetime : anime.datetime)).toLocaleString().split(",")[0];
    /**/ let innerHTML = "";
    /*    */ innerHTML += `${url ? `<p class="page">${url.page}</p>` : ``}`
    /*    */ innerHTML += `<div class="image"><img src="${thumbnail !== "" ? thumbnail : `https://media1.tenor.com/m/lcPmye0KHp4AAAAC/yori-asanagi-whisper-me-a-love-song.gif`}" alt="${title}"></div>`;
    /*    */ innerHTML += `${!url && type !== "modal-episode" ? `<p class="title">${title}</p>` : ``}`
    /*    */ innerHTML += `${episode && !url ? `<p class="episode">${episode.episode}</p>` : ``}`
    /*    */ innerHTML += `<div class="hover">`
    /*    */ innerHTML += `    <p>Titulo: ${title}</p>`
    /*    */ innerHTML += `    ${anime && !episode ? `<p>Episodios: ${anime.episodes.length}</p>` : ``}`
    /*    */ innerHTML += `    ${episode ? `<p>Episodio: ${episode.episode}</p>` : ``}`
    /*    */ innerHTML += `    <p>Fecha: ${date}</p>`
    /*    */ innerHTML += `    ${anime.titles.length > 1 ? `<p>Otros titulos: ${otherTitles}</p>` : ``}`
    /*    */ innerHTML += `</div>`;
    const div = document.createElement("div");
    div.className = `card ${anime.type.toLowerCase() || 'unknown'}`
    div.innerHTML = innerHTML;
    return div;
}
export function generateAnimeCard(anime, highlight = null) {
    const div = generateCard("anime", anime, null, null, highlight);
    div.onclick = () => {
        let open = true;
        if (database.config.ac && (!database.config.allow_ac && anime.type.toLowerCase() === "hentai")) { open = showAdultContentConfirm() }
        if (open) { openAnimeModal(anime) };
    };
    return div;
}
export function generateEpisodeCard(episode) {
    const anime = database.findAnimeById(episode.animeId);
    if (!anime) return;
    const div = generateCard("episode", anime, episode, null, null);
    div.onclick = () => {
        let open = true;
        if (database.config.ac && (!database.config.allow_ac && anime.type.toLowerCase() === "hentai")) { open = showAdultContentConfirm() }
        if (open) { openEpisodeModal(anime, episode) };
    }
    return div;
}