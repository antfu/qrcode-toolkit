/*!
Copyright 2021 Adonmo  https://www.adonmo.com/
Copyright 2010 futomi  http://www.html5.jp/

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

This file was modified by Fabien LOISON <http://www.flozz.fr/>

This file was further modified by Adonmo https://www.adonmo.com/
*/

interface Quadrilateral {
  topLeftX: number;
  topLeftY: number;
  topRightX: number;
  topRightY: number;
  bottomRightX: number;
  bottomRightY: number;
  bottomLeftX: number;
  bottomLeftY: number;
}

export default class Perspective {
  // Context for destination (output will go here)
  // @ts-expect-error 
  private ctxd: CanvasRenderingContext2D;

  // Canvas for original image
  // @ts-expect-error 
  private cvso: HTMLCanvasElement;

  // Context for original image
  // @ts-expect-error 
  private ctxo: CanvasRenderingContext2D;

  // Context for transformed image
  // @ts-expect-error 
  private ctxt: CanvasRenderingContext2D;

  constructor(ctxd: CanvasRenderingContext2D, target: ImageData) {
    // check the arguments
    if (!ctxd || !ctxd.strokeStyle) {
      return;
    }
  
    // prepare a <canvas> for the image
    let cvso = document.createElement("canvas");
    cvso.width = Math.round(target.width);
    cvso.height = Math.round(target.height);
    let ctxo = cvso.getContext("2d")!;
    ctxo.putImageData(target, 0, 0);
    // prepare a <canvas> for the transformed image
    let cvst = document.createElement("canvas");
    cvst.width = ctxd.canvas.width;
    cvst.height = ctxd.canvas.height;
    let ctxt = cvst.getContext("2d")!;

    this.ctxd = ctxd;
    this.cvso = cvso;
    this.ctxo = ctxo;
    this.ctxt = ctxt;
  }

  draw(q: Quadrilateral) {
    let {
      topLeftX,
      topLeftY,
      topRightX,
      topRightY,
      bottomRightX,
      bottomRightY,
      bottomLeftX,
      bottomLeftY,
    } = q;

    // compute the dimension of each side
    let dims = [
      Math.sqrt(
        Math.pow(topLeftX - topRightX, 2) + Math.pow(topLeftY - topRightY, 2)
      ), // top side
      Math.sqrt(
        Math.pow(topRightX - bottomRightX, 2) +
          Math.pow(topRightY - bottomRightY, 2)
      ), // right side
      Math.sqrt(
        Math.pow(bottomRightX - bottomLeftX, 2) +
          Math.pow(bottomRightY - bottomLeftY, 2)
      ), // bottom side
      Math.sqrt(
        Math.pow(bottomLeftX - topLeftX, 2) +
          Math.pow(bottomLeftY - topLeftY, 2)
      ), // left side
    ];
    //
    let ow = this.cvso.width;
    let oh = this.cvso.height;
    // specify the index of which dimension is longest
    let base_index = 0;
    let max_scale_rate = 0;
    let zero_num = 0;
    for (let i = 0; i < 4; i++) {
      let rate = 0;
      if (i % 2) {
        rate = dims[i] / ow;
      } else {
        rate = dims[i] / oh;
      }
      if (rate > max_scale_rate) {
        base_index = i;
        max_scale_rate = rate;
      }
      if (dims[i] == 0) {
        zero_num++;
      }
    }
    if (zero_num > 1) {
      return;
    }
    //
    let step = 2;
    let cover_step = step * 5;
    //
    let ctxo = this.ctxo;
    let ctxt = this.ctxt;
    ctxt.clearRect(0, 0, ctxt.canvas.width, ctxt.canvas.height);
    if (base_index % 2 == 0) {
      // top or bottom side
      let ctxl = this.create_canvas_context(ow, cover_step);
      ctxl.globalCompositeOperation = "copy";
      let cvsl = ctxl.canvas;
      for (let y = 0; y < oh; y += step) {
        let r = y / oh;
        let sx = topLeftX + (bottomLeftX - topLeftX) * r;
        let sy = topLeftY + (bottomLeftY - topLeftY) * r;
        let ex = topRightX + (bottomRightX - topRightX) * r;
        let ey = topRightY + (bottomRightY - topRightY) * r;
        let ag = Math.atan((ey - sy) / (ex - sx));
        let sc = Math.sqrt(Math.pow(ex - sx, 2) + Math.pow(ey - sy, 2)) / ow;
        ctxl.setTransform(1, 0, 0, 1, 0, -y);
        ctxl.drawImage(ctxo.canvas, 0, 0);
        //
        ctxt.translate(sx, sy);
        ctxt.rotate(ag);
        ctxt.scale(sc, sc);
        ctxt.drawImage(cvsl, 0, 0);
        //
        ctxt.setTransform(1, 0, 0, 1, 0, 0);
      }
    } else if (base_index % 2 == 1) {
      // right or left side
      let ctxl = this.create_canvas_context(cover_step, oh);
      ctxl.globalCompositeOperation = "copy";
      let cvsl = ctxl.canvas;
      for (let x = 0; x < ow; x += step) {
        let r = x / ow;
        let sx = topLeftX + (topRightX - topLeftX) * r;
        let sy = topLeftY + (topRightY - topLeftY) * r;
        let ex = bottomLeftX + (bottomRightX - bottomLeftX) * r;
        let ey = bottomLeftY + (bottomRightY - bottomLeftY) * r;
        let ag = Math.atan((sx - ex) / (ey - sy));
        let sc = Math.sqrt(Math.pow(ex - sx, 2) + Math.pow(ey - sy, 2)) / oh;
        ctxl.setTransform(1, 0, 0, 1, -x, 0);
        ctxl.drawImage(ctxo.canvas, 0, 0);
        //
        ctxt.translate(sx, sy);
        ctxt.rotate(ag);
        ctxt.scale(sc, sc);
        ctxt.drawImage(cvsl, 0, 0);
        //
        ctxt.setTransform(1, 0, 0, 1, 0, 0);
      }
    }
    // set a clipping path and draw the transformed image on the destination canvas.
    this.ctxd.save();
    this.ctxd.drawImage(ctxt.canvas, 0, 0);
    this._applyMask(this.ctxd, q);
    this.ctxd.restore();
  }

  private create_canvas_context(w: number, h: number) {
    let canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    let ctx = canvas.getContext("2d")!;
    return ctx;
  }

  private _applyMask(ctx: CanvasRenderingContext2D, q: Quadrilateral) {
    ctx.beginPath();
    ctx.moveTo(q.topLeftX, q.topLeftY);
    ctx.lineTo(q.topRightX, q.topRightY);
    ctx.lineTo(q.bottomRightX, q.bottomRightY);
    ctx.lineTo(q.bottomLeftX, q.bottomLeftY);
    ctx.closePath();
    ctx.globalCompositeOperation = "destination-in";
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }
}
