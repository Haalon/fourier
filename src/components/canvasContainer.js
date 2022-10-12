import {CanvasController} from './canvasController.js'
import { loadImageByFile, resizeImage } from '../imageUtils.js'
import commonCSS from '../../style.css';
// icons
import flipX from '../icons/flip-x.svg'
import flipY from '../icons/flip-y.svg'
import rotRight from '../icons/rotate-right.svg'
import rotLeft from '../icons/rotate-left.svg'
import negate from '../icons/negate.svg'

import up from '../icons/up.svg'
import left from '../icons/left.svg'
import right from '../icons/right.svg'
import down from '../icons/down.svg'

import zoomIn from '../icons/zoom-in.svg'
import zoomOut from '../icons/zoom-out.svg'
import { BaseComponent } from '../baseComponent.js';

export class CanvasContainer extends BaseComponent {
    get css() {
        return commonCSS + /*css*/`
            :host {
                flex: 1;
            }

            canvas {
                border: 1px grey solid;
                width: 100%;
                height: 100%;
                display: block;
            }

            input[type=file] {
                width: 200px;
            }

            #title {
                font-size: 24px;
                font-family: Arial;
            }

            .controls button {
                width: 1.5rem;
                height: 1.5rem;
            }

            svg {width: 100%; height: auto;}
        `;
    }
    get html() {
        return  /*html*/`
        <div class="column flex-grow-1">
            <div class="row justify-center">
                <span id="title"></span>
            </div>

            <div class="row justify-center controls">
                <button title="Flip x" id="flip-x-btn">${flipX}</button>
                <button title="Flip y" id="flip-y-btn">${flipY}</button>
                <button title="Down" id="down-btn">${down}</button>
                <button title="Up" id="up-btn">${up}</button>

                <button title="Zoom In" id="zoom-in-btn">${zoomIn}</button>
                <button title="Negate" id="negate-btn">${negate}</button>
                <button title="Zoom Out" id="zoom-out-btn">${zoomOut}</button>

                <button title="Left" id="left-btn">${left}</button>
                <button title="Right" id="right-btn">${right}</button>
                <button title="Rotate left" id="rot-l-btn">${rotLeft}</button>
                <button title="Rotate right" id="rot-r-btn">${rotRight}</button>      
            </div>

            <div class="flex-grow-1 column justify-center">
                <canvas></canvas>
            </div>

            <div class="row justify-center">
                <button id="save-btn">Save</button>
                <button id="reset-btn">Reset to last loaded</button>
                <input type="file" id="file-input" accept="image/*">  
            </div>
        </div>
        `;
    }

    notifyImageChange() {
        const event = new CustomEvent('image-change', {detail: {main: this.isMain}});

        document.dispatchEvent(event);
    }

    _saveImage() {
        const img = this.controller.getImage();

        const link = document.createElement("a");
        link.href = img.src;
        link.download = "image" + ".png";
        link.style.display = "none";
        const evt = new MouseEvent("click", {
            "view": window,
            "bubbles": true,
            "cancelable": true
        });

        document.body.appendChild(link);
        link.dispatchEvent(evt);
        document.body.removeChild(link);
    }

    async _setImage(img) {
        const file = this.fileInput.files[0];
        if (!img)
            img = await loadImageByFile(file);

        img = await resizeImage(img, this.controller.dimension, this.controller.dimension);

        this.previousImg = img;
    
        this.controller.setImage(img);
        this.notifyImageChange();
    }

    connectedCallback() {
        this.canvas = this.shadowRoot.querySelector('canvas');
        this.isMain = this.hasAttribute('is-main');
        this.controller = new CanvasController(this.canvas, this.isMain);
        this.controller.drawHook = () => this.notifyImageChange();

        const elems = this.elems;
        this.fileInput = elems['file-input'];
        elems['title'].innerHTML = this.getAttribute('title');

        elems['file-input'].onchange = () => this._setImage();
        elems['save-btn'].onclick = () => this._saveImage();
        elems['reset-btn'].onclick = () => {
            if (!this.previousImg) return;
            this.controller.setImage(this.previousImg);
            this.notifyImageChange();
        }


        elems['flip-x-btn'].onclick = () => { 
            this.controller.flipX();
            this.notifyImageChange();
        };
        elems['flip-y-btn'].onclick = () => { 
            this.controller.flipY();
            this.notifyImageChange();
        };

        elems['rot-l-btn'].onclick = () => { 
            this.controller.rotateLeft();
            this.notifyImageChange();
        };
        elems['rot-r-btn'].onclick = () => { 
            this.controller.rotateRight();
            this.notifyImageChange();
        };

        elems['negate-btn'].onclick = () => { 
            this.controller.negate();
            this.notifyImageChange();
        };

        const quarterDim = Math.floor(this.controller.dimension / 4);
        // translation
        elems['up-btn'].onclick = () => { 
            this.controller.shift(0, -quarterDim);
            this.notifyImageChange();
        };

        elems['down-btn'].onclick = () => { 
            this.controller.shift(0, quarterDim);
            this.notifyImageChange();
        };

        elems['left-btn'].onclick = () => { 
            this.controller.shift(quarterDim, 0);
            this.notifyImageChange();
        };

        elems['right-btn'].onclick = () => { 
            this.controller.shift(-quarterDim, 0);
            this.notifyImageChange();
        };

        // zoom
        elems['zoom-in-btn'].onclick = () => { 
            this.controller.zoom(0.5);
            this.notifyImageChange();
        };

        elems['zoom-out-btn'].onclick = () => { 
            this.controller.zoom(2);
            this.notifyImageChange();
        };

    }
}

customElements.define("canvas-container", CanvasContainer);