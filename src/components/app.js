import commonCSS from '../../style.css';

import { CanvasController } from './canvasController.js'
import { BrushMenu } from './brushMenu.js';
import { CanvasContainer } from './canvasContainer.js';
import { loadImageByUrl } from '../imageUtils.js';

const IMG_NUM=10;
function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class MainApp extends HTMLElement {

    get css() {
        return commonCSS + /*css*/`
            
        `;
    }

    get html() {
        return  /*html*/`
        <div class="container column">

            <div id="header" class="row justify-center">
                <span>Discrete Fourier transform of an image</span>
            </div>
            <div id="body" class="row  justify-center flex-grow-1">
                <canvas-container title="Magnitude" id="magnitude"></canvas-container>
                <canvas-container title="Original" id="space" is-main></canvas-container>
                <canvas-container title="Phase" id="phase"></canvas-container>
            </div>

            <div id="footer">
                <brush-menu></brush-menu>
            </div>
        </div>
        `;
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open'});
        this.shadowRoot.innerHTML = `<style>${this.css}</style>` + this.html;
        this.elems = this.getElementsWithId();
    }

    getElementsWithId() {

        const res = {}
        const elems = this.shadowRoot.querySelectorAll('[id]')
    
        for (const el of elems)
            res[el.id] = el
    
    
        return res;
    }

    async connectedCallback() {
        const elems = this.elems;
        // const elems = this.elems = this.getElementsWithId();

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
        });

        const num = getRandomInt(0, IMG_NUM);
        const img = await loadImageByUrl(`src/static/${num}.jpg`);
        elems.space._setImage(img);
    }
}

customElements.define("main-app", MainApp);