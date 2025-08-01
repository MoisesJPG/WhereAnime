import { database } from "./database.js";
const params = {
    page: "all",
    ac: localStorage.getItem(`ac`) === "true"
};
function goTo(hash) {
    window.location.hash = hash;
    console.log(hash);
}
await database.load();
let i = 0;
setTimeout(() => { goTo("animeflv"); }, (++i) *1000);
setTimeout(() => { goTo("animeav1"); }, (++i) *1000);
setTimeout(() => { goTo("animefenix"); }, (++i) *1000);
setTimeout(() => { goTo("otakustv"); }, (++i) *1000);
setTimeout(() => { goTo("otakustv?query=h"); }, (++i) *1000);