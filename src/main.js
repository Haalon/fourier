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

    const spaceCtrl = new CanvasController(elems.space, true);
    const magnitudeCtrl = new CanvasController(elems.magnitude);
    const phaseCtrl = new CanvasController(elems.phase);

    const reverseFourier = async () => {
        const magn = magnitudeCtrl.shift(-256, -256, false);
        const phase = phaseCtrl.shift(-256, -256, false);

        spaceCtrl.idft2(magn, phase);
    }

    const forwardFourier = async () => {
        const { magnitude, phase } = spaceCtrl.dft2();

        magnitudeCtrl.setImage(magnitude, 512, 512);
        magnitudeCtrl.shift(256, 256);

        phaseCtrl.setImage(phase, 512, 512);
        phaseCtrl.shift(256, 256);
    }

    spaceCtrl.drawHook = () => {
        forwardFourier();
    }

    magnitudeCtrl.drawHook = () => {
        reverseFourier();
    }

    phaseCtrl.drawHook = () => {
        reverseFourier();
    }

    elems.space_input.onchange = async () => {
        await setImage(elems.space_input, spaceCtrl);
        forwardFourier();
    }

    elems.magnitude_input.onchange = async () => {
        await setImage(elems.magnitude_input, magnitudeCtrl);
        reverseFourier();
    }

    elems.phase_input.onchange = async () => {
        await setImage(elems.phase_input, phaseCtrl);
        reverseFourier();
       
    }
}