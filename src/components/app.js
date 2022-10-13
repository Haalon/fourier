import commonCSS from '../../style.css';

import { CanvasController } from './canvasController.js'
import { BrushMenu } from './brushMenu.js';
import { CanvasContainer } from './canvasContainer.js';
import { loadImageByUrl } from '../imageUtils.js';
import { BaseComponent } from '../baseComponent';

const IMG_NUM=10;
function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class MainApp extends BaseComponent {

    get css() {
        return commonCSS + /*css*/`
            .container {
                padding-bottom: 3rem;
            }
        `;
    }

    get html() {
        return  /*html*/`
        <div class="container column">

            <div id="header" class="row justify-center">
                <span>Discrete Fourier transform of an image</span>
            </div>
            <div id="body" class="row justify-center flex-grow-1 flex-wrap">
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

    async connectedCallback() {
        const elems = this.elems;
        // const elems = this.elems = this.getElementsWithId();

        const spaceCtrl = elems.space.controller;
        const magnitudeCtrl = elems.magnitude.controller;
        const phaseCtrl = elems.phase.controller;

        const reverseFourier = async () => {
            const halfDim = Math.floor(magnitudeCtrl.dimension / 2);
            const magn = magnitudeCtrl.shift(-halfDim, -halfDim, false);
            const phase = phaseCtrl.shift(-halfDim, -halfDim, false);

            spaceCtrl.idft(magn, phase);
        }

        const forwardFourier = async () => {
            const { magnitude, phase } = spaceCtrl.dft();
            const halfDim = Math.floor(magnitudeCtrl.dimension / 2);

            magnitudeCtrl.setImage(magnitude);
            magnitudeCtrl.shift(halfDim, halfDim);

            phaseCtrl.setImage(phase);
            phaseCtrl.shift(halfDim, halfDim);
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