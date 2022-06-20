import {CanvasController} from './canvasController.js'
import { loadImageByFile, resizeImage } from './imageUtils.js'
import commonCSS from '../style.css';
// icons
import flipX from './icons/flip-x.svg'
import flipY from './icons/flip-y.svg'
import rotRight from './icons/rotate-right.svg'
import rotLeft from './icons/rotate-left.svg'
import negate from './icons/negate.svg'

export class CanvasContainer extends HTMLElement {
    get css() {
        return commonCSS + /*css*/`
            canvas {
                border: 1px grey solid;
            }

            input[type=file] {
                width: 200px;
            }

            #title {
                font-size: 24px;
                font-family: Arial;
            }
        `;
    }
    get html() {
        return  /*html*/`
        <div class="column flex-grow-1">
            <div class="row justify-center">
                <span id="title"></span>
            </div>

            <div class="row justify-center">
                <button title="Flip x" id="flip-x-btn">${flipX}</button>
                <button title="Flip y" id="flip-y-btn">${flipY}</button>
                <button title="Negate" id="negate-btn">${negate}</button>
                <button title="Rotate left" id="rot-l-btn">${rotLeft}</button>
                <button title="Rotate right" id="rot-r-btn">${rotRight}</button>      
            </div>

            <div class="flex-grow-1">
                <canvas width="512" height="512"></canvas>
            </div>

            <div class="row justify-center">
                <button id="save-btn">Save</button>
                <input type="file" id="file-input" accept="image/*">  
            </div>
        </div>
        `;
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open'});
        this.shadowRoot.innerHTML = `<style>${this.css}</style>` + this.html;
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

    async _setImage() {
        const file = this.fileInput.files[0];
        let img = await loadImageByFile(file);
        img = await resizeImage(img, 512, 512);
    
        this.controller.setImage(img);
        this.notifyImageChange();
    }

    getElementsWithId() {

        const res = {}
        const elems = this.shadowRoot.querySelectorAll('[id]')
    
        for (const el of elems)
            res[el.id] = el
    
    
        return res;
    }

    connectedCallback() {
        this.canvas = this.shadowRoot.querySelector('canvas');
        this.isMain = this.hasAttribute('is-main');
        this.controller = new CanvasController(this.canvas, this.isMain);
        this.controller.drawHook = () => this.notifyImageChange();

        const elems = this.getElementsWithId();
        this.fileInput = elems['file-input'];
        elems['title'].innerHTML = this.getAttribute('title');

        elems['file-input'].onchange = () => this._setImage();
        elems['save-btn'].onclick = () => this._saveImage();

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

    }
}

customElements.define("canvas-container", CanvasContainer);