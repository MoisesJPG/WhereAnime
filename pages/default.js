import { generateModal, generatePagesHeader } from "../src/js/default.js";

if(localStorage.getItem(`allow-ac`) === "true"){
    document.body.classList.add('ac')
}
generatePagesHeader()
generateModal();