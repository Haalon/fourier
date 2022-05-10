import { loadImageByFile, resizeImage } from './imageUtils.js'

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
    let img = await loadImageByFile(file);
    img = await resizeImage(img, 512, 512);

    const context = canvas.getContext('2d');
    context.drawImage(img, 0, 0);
}

function main() {
    const elems = getElementsWithId();

    elems.space_input.onchange = () => {
        setImage(elems.space_input, elems.space);
    }

    elems.magnitude_input.onchange = async () => {
        setImage(elems.magnitude_input, elems.magnitude);
    }

    elems.phase_input.onchange = () => {
        setImage(elems.hase_input, elems.phase);
    }
}