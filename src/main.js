
import Pica from 'pica' 
import { loadImageByFile } from './imageUtils.js'

if (document.readyState === "complete" ||
    (document.readyState !== "loading" && !document.documentElement.doScroll)) {
    main();
} else {
    document.addEventListener("DOMContentLoaded", main);
}

function getElementsWithId() {

    const res = {}
    const elems = document.querySelectorAll('[id]')

    for (const el of elems)
        res[el.id] = el


    return res;
}

async function setImage(input, canvas) {

    const file = input.files[0];
    const img = await loadImageByFile(file);

    const p = new Pica();
    p.resize(img, canvas);
}

function main() {
    const elems = getElementsWithId();

    elems.space_input.onchange = () => {
        setImage(space_input, space);
    }

    elems.magnitude_input.onchange = () => {
        setImage(magnitude_input, magnitude);
    }

    elems.phase_input.onchange = () => {
        setImage(phase_input, phase);
    }

}