import { loadImageByFile, resizeImage } from './imageUtils.js'
import { CanvasController } from './canvasController.js'
import { fftPixelData } from './fft.js'

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

async function setImage(input, ctrl) {

    const file = input.files[0];
    let img = await loadImageByFile(file);
    img = await resizeImage(img, 512, 512);

    ctrl.setImage(img);
}

function main() {
    const elems = getElementsWithId();

    const spaceCtrl = new CanvasController(elems.space);
    const magnitudeCtrl = new CanvasController(elems.magnitude);
    const phaseCtrl = new CanvasController(elems.phase);

    elems.space_input.onchange = async () => {
        await setImage(elems.space_input, spaceCtrl);
        spaceCtrl.sync();
        const arr = spaceCtrl.getArray();
        const res = fftPixelData(arr, 512, 512);

        magnitudeCtrl.setImage(res.magnitude, 512, 512);
        phaseCtrl.setImage(res.phase, 512, 512);
    }

    elems.magnitude_input.onchange = async () => {
        await setImage(elems.magnitude_input, magnitudeCtrl);
    }

    elems.phase_input.onchange = async () => {
        await setImage(elems.phase_input, phaseCtrl);
    }
}