
import Pica from 'pica' 

if (document.readyState === "complete" ||
    (document.readyState !== "loading" && !document.documentElement.doScroll)) {
    main();
} else {
    document.addEventListener("DOMContentLoaded", main);
}

function loadImage(url) {
    return new Promise(r => { let i = new Image(); i.onload = (() => r(i)); i.src = url; });
}

function getElementsWithId() {

    const res = {}
    const elems = document.querySelectorAll('[id]')

    for (const el of elems)
        res[el.id] = el


    return res;
}

function setImage(input, canvas) {

    const file = input.files[0];

    let reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = async () => {
        const img = await loadImage(reader.result)
        const p = new Pica()
        p.resize(img, canvas)
        
        // let ctx = canvas.getContext("2d");
        // ctx.drawImage(img, 0, 0,img.width,img.height,0,0, canvas.clientWidth, canvas.clientHeight)
    };
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