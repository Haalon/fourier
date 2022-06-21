import { CanvasController } from './canvasController.js'
import { CanvasContainer } from './canvasContainer.js';

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

function main() {
    const elems = getElementsWithId();

    const spaceCtrl = elems.space.controller;
    const magnitudeCtrl = elems.magnitude.controller;
    const phaseCtrl = elems.phase.controller;

    const reverseFourier = async () => {
        const magn = magnitudeCtrl.shift(-256, -256, false);
        const phase = phaseCtrl.shift(-256, -256, false);

        spaceCtrl.idft(magn, phase);
    }

    const forwardFourier = async () => {
        const { magnitude, phase } = spaceCtrl.dft();

        magnitudeCtrl.setImage(magnitude, 512, 512);
        magnitudeCtrl.shift(256, 256);

        phaseCtrl.setImage(phase, 512, 512);
        phaseCtrl.shift(256, 256);
    }

    document.addEventListener('image-change', e => {
        if (e.detail.main) forwardFourier();
        else reverseFourier();
    })
}