/*
 * Copyright (C) 2013 salesforce.com, inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function (w) {
    'use strict';
     w || (w = window);


    /**
     * Get the position of an element relative
     * to the viewport
     * @param  {HTMLElement} target The element to compute
     * @return {Object}  An object representing the position in pixels
     *                      (top, left)
     */
    function computeAbsPos(target) {
        var val2;
        var val ={
            top: target.offsetTop,
            left: target.offsetLeft
        };
        
        if(target.offsetParent) {
            val2 = computeAbsPos(target.offsetParent);
            val.top += val2.top;
            val.left += val2.left;
        }
        return val;
    }

    /**
     * A facade for a DOM element
     * to simplift reading/writing values
     * as well as prevent unnecessary DOM reads
     * @class  ElementProxy
     * @private
     * @param el {HTMLElement} el
     * @param id {String} a unique id for the element
     */
    function ElementProxy(el, id) {
        this.id = id;
        this.width = 0;
        this.height = 0;
        this.left = 0;
        this.top = 0;
        this.right = 0;
        this.bottom = 0;
        this._dirty = false;
        this._node = null;
        this._releaseCb = null;


        if(!el) {
            throw new Error('Element missing');
        }
        this._node = el;
        this.refresh();
    }

    /**
     * Set a function to be called when release() is called
     * @param {Function} cb    The callback
     * @param {Object}   scope Scope for release callback (default is this)
     */
    ElementProxy.prototype.setReleaseCallback = function(cb, scope) {
        var scopeObj = scope || this;
        this._releaseCb = cb.bind(scopeObj);
    };

    /**
     * Update values from the dom
     * 
     * @method refresh
     */
    ElementProxy.prototype.refresh = function() {


        if(this.isDirty()) {
            return;
        }
        var box, x;
        
        if(this._node !== w) {
            box = this._node.getBoundingClientRect();
            for(x in box) {
                this[x] = box[x];
            }
            this.top = this.top + w.scrollY;
            this.bottom = this.top + box.height;
            this.left = this.left + w.scrollX;
            this.right = this.left + box.width;
        } else {
            box = {};
            this.width = w.innerWidth;
            this.height = w.innerHeight;
            this.left = w.scrollX;
            this.top = w.scrollY;
            this.right = w.innerWidth + w.scrollX;
            this.bottom = w.innerHeight;
        }

        this._dirty = false;
    };

    /**
     * Get the underlying DOM node
     * @return {HTMLElement}
     */
    ElementProxy.prototype.getNode = function() {
        return this._node;
    };

    /**
     * Check if this is dirty:
     * values have been changed but the DOM
     * is not updated
     * @return {Boolean}
     */
    ElementProxy.prototype.isDirty = function() {
        return this._dirty;
    };

    /**
     * Computes and applies the positioning changes to the DOM
     */
    ElementProxy.prototype.bake = function() {

        var absPos = this._node.getBoundingClientRect();
        this._node.style.position = 'absolute';
        var style = w.getComputedStyle(this._node);
        var originalLeft, originalTop;
        if(style.left.match(/auto|fixed/)) {
            originalLeft = '0';
        } else {
            originalLeft = style.left;
        }
        if(style.top.match(/auto|fixed/)) {
            originalTop = '0';
        } else {
            originalTop = style.top;
        }
        
        originalLeft = parseInt(originalLeft.replace('px', ''), 10);
        originalTop = parseInt(originalTop.replace('px', ''), 10);
        
        var leftDif = this.left - (absPos.left + w.scrollX);
        var topDif = this.top - (absPos.top + w.scrollY);
        
        this._node.style.left = (originalLeft + leftDif) + 'px';
        this._node.style.top = (originalTop+ topDif) + 'px';
        
        this._dirty = false;
    };

    ElementProxy.prototype.set = function(direction, val) {
        this[direction] = val;
        this._dirty = true;
    };

    /**
     * Calls the release callback, this is so
     * the proxyFactory can manager garbage collection
     */
    ElementProxy.prototype.release = function() {
        if(this._releaseCb) {
            this._releaseCb(this);
        }
    };


    return {
        ElementProxy: ElementProxy
    };
}