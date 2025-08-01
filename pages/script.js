//#region Importaciones y elementos
import { database } from "../src/js/database.js";
import { generateAnimeCard, generateEpisodeCard } from "../src/js/v2/card.js";
import { log } from "../src/js/v2/misc.js";
const recentEpisodes = document.querySelector('#recentEpisodes .content');
const recentAnimes = document.querySelector('#recentAnimes .content');
//#endregion Importaciones y elementos

//#region Verificar parametros
const params = new URLSearchParams(window.location.search);
const page = params.get('p') || "all";
//#endregion Verificar parametros

//#region Configurar la base de datos
database.config.page = page;
database.config.ac = localStorage.getItem(`ac`) === "true";
database.config.allow_ac = localStorage.getItem(`allow-ac`) === "true";
//#endregion Configurar la base de datos

//#region Comportamiento
async function main() {
    await database.load();
    const lastEpisodes = database.getLastEpisodes(20);
    if (lastEpisodes.length > 0) {
        recentEpisodes.innerHTML = "";
        for (const episode of lastEpisodes) {
            recentEpisodes.appendChild(generateEpisodeCard(episode));
        }
    } else {
        recentEpisodes.innerHTML = "<h3>A</h3>";
    }
    const lastAnimes = database.getLastAnimes(20);
    if (lastAnimes.length > 0) {
        recentAnimes.innerHTML = "";
        for (const anime of lastAnimes) {
            recentAnimes.appendChild(generateAnimeCard(anime));
        }
    } else {
        recentAnimes.innerHTML = "<h3>A</h3>";
    }
}
async function start() {
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
    await main();
    let nextAt = getNextAlignedTime();
    log(`Next update at ${new Date(Date.now() + nextAt).toLocaleString()}`);
    setTimeout(async () => {
        await main();
        nextAt = getNextAlignedTime();
        log(`Next update at ${new Date(Date.now() + reloadDelay).toLocaleString()}`);
        setInterval(async () => {
            await main();
            log(`Next update at ${new Date(Date.now() + reloadDelay).toLocaleString()}`);
        }, reloadDelay);
    }, getNextAlignedTime());
}
start();
// Mensajes de proxima actualizacion
const reloadDelay = 5 * 60 * 1000;
setInterval(() => {
    document.querySelectorAll('.timeToRefresh').forEach(el => {
        let time = Date.now() - 60 * 1000 - 1000;   // Tiempo actual en milisegundos
        let rem = reloadDelay - (time % reloadDelay);           // Tiempo restante hasta el próximo múltiplo de delay
        let totalSeconds = Math.floor(rem / 1000);  // Segundos totales restantes
        let s = totalSeconds % 60;                  // Segundos restantes (parte del minuto)
        let m = Math.floor(totalSeconds / 60);      // Minutos restantes
        el.innerHTML = `Proxima act.: ${m > 0 ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`}`;
    });
}, 100);
//#endregion Comportamiento