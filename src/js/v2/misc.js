import { database } from "../database.js";
export function generateNavigatorList(min, cur, max) {
    const pre = [
        { text: "<<", value: min},
        { text: "<", value: cur-1 < min ? min : cur-1}
    ]
    const sub = [
        { text: ">", value: cur+1 > max ? max : cur+1},
        { text: ">>", value: max}
    ]
    const total = max - min + 1;
    const lista = [];
    if (total <= 11) { 
        for (let i = 0; i < total; i++) {
            lista.push({ text: min + i, value: min + i })
        }
        return pre.concat(lista).concat(sub);
    }
    // Siempre mostrar el primero
    lista.push({ text: min, value: min});
    // Cur cerca del principio
    if (cur <= min + 5) {
        for (let i = min + 1; i <= min + 8; i++) { lista.push({text: i, value: i}); }
        lista.push({ text: "…", value: "…"});
        lista.push({ text: max, value: max});
        return pre.concat(lista).concat(sub);
    }
    // Cur cerca del final
    if (cur >= max - 5) {
        lista.push({ text: "…", value: "…"});
        for (let i = max - 8; i < max; i++) { lista.push({text: i, value: i}); }
        lista.push({ text: max, value: max});
        return pre.concat(lista).concat(sub);
    }
    // Cur en el medio
    lista.push({ text: "…", value: "…"});
    for (let i = cur - 3; i <= cur + 3; i++) {
        lista.push({text: i, value: i});
    }
    lista.push({ text: "…", value: "…"});
    lista.push({ text: max, value: max});
    return pre.concat(lista).concat(sub);
}
export function highlightMatch(text, searchTitle) {
    if (searchTitle) {
        const escaped = searchTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapa caracteres especiales
        const regex = new RegExp(escaped, 'gi'); // 'g' para global, 'i' para ignorar mayúsculas
        return text.replace(regex, match => `<b>${match}</b>`);
    }
    return text;
}
export function showAdultContentConfirm() {
    if (confirm('Estas apunto de activar el modo (+18) ¿Deseas continuar?')) {
        localStorage.setItem('allow-ac', true);
        database.config.allow_ac = true;
        document.body.classList.add("ac");
        return true;
    } else {
        localStorage.setItem('allow-ac', false);
        database.config.allow_ac = false;
        document.body.classList.remove("ac");
        return false;
    }
}
export function log(...args) {
    function pad(n) { return `${n}`.padStart(2,'0') }
    const date = new Date();
    const timestamp = `[ ${pad(date.getFullYear())}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ]`;
    console.log(timestamp, ...args);
}