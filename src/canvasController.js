import { Igloo } from './igloo.js'

import drawFrag from './glsl/draw.frag'
import copyFrag from './glsl/copy.frag'
import copyVert from './glsl/copy.vert'

export class CanvasController {
    constructor(canvas) {
        this.canvas = canvas;
        this.viewsize = new Float32Array([canvas.width, canvas.height]);

        var gl = canvas.getContext("webgl");
        if (!gl) {
            throw new Error('no webgl')
        }

        this.gl = gl

        this.igloo = new Igloo(gl)
        this.quad = this.igloo.array(Igloo.QUAD2);

        this.program_copy = this.igloo.program(copyVert, copyFrag);
        this.program_draw = this.igloo.program(copyVert, drawFrag);

        this.frameBuffer = this.igloo.framebuffer();
        this.tex_main = this.igloo.texture(null, gl.RGBA)
            .blank(this.viewsize[0], this.viewsize[1]);
        this.tex_temp = this.igloo.texture(null, gl.RGBA)
            .blank(this.viewsize[0], this.viewsize[1]);


        this.show();
        this._addEvents();
    }

    _swapTextures() {
        var tmp = this.tex_main;
        this.tex_main = this.tex_temp
        this.tex_temp = tmp;
    };

    _getMousePos(event) {
        var rect = this.canvas.getBoundingClientRect();
        return [
            (event.pageX - rect.left),
            (this.canvas.height - (event.pageY - rect.top)),
        ];
    };

    _addEvents() {
        this.start_pos = null
        this.canvas.addEventListener('mousedown', e => {
            e.stopPropagation();
            this.start_pos = this._getMousePos(e)
        })
        this.canvas.addEventListener('mouseup', e => {
            e.stopPropagation();
            if (!this.start_pos) return;
            const end_pos = this._getMousePos(e);
            this.draw(this.start_pos, end_pos)
        })
    }

    draw(from, to, col=null, rad=5, mode=2) {
        from = new Float32Array(from);
        to = new Float32Array(to);
        col = col ? new Float32Array(col) : new Float32Array([1,1,1,1]);


        const gl = this.gl

        this.frameBuffer.attach(this.tex_temp);
        gl.viewport(0, 0, this.viewsize[0], this.viewsize[1]);
        this.tex_main.bind(0);
        this.program_draw.use()
            .attrib('a_position', this.quad, 2)
            .uniformi('texture', 0)
            .uniform('screenSize', this.viewsize)
            .uniform('u_org', from)
            .uniform('u_end', to)
            .uniform('u_col', col)
            .uniform('u_rad', rad-1)
            .uniformi('u_mode', mode)
            .draw(gl.TRIANGLE_STRIP, 4);
        
        this._swapTextures();
        this.show();
    }

    show() {
        const gl = this.gl
        this.igloo.defaultFramebuffer.bind();
        gl.viewport(0, 0, this.viewsize[0], this.viewsize[1]);
        this.tex_main.bind(0);
        this.program_copy.use()
            .attrib('a_position', this.quad, 2)
            .uniform('screenSize', this.viewsize)
            .uniformi('texture', 0)
            .draw(gl.TRIANGLE_STRIP, 4);
    }


    setImage(img) {
        this.tex_main.set(img);
        this.show();
    }
}