/*
 * Copyright 2003-2006, 2009, 2017, 2020 United States Government, as represented
 * by the Administrator of the National Aeronautics and Space Administration.
 * All rights reserved.
 *
 * The NASAWorldWind/WebWorldWind platform is licensed under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License
 * at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed
 * under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 *
 * NASAWorldWind/WebWorldWind also contains the following 3rd party Open Source
 * software:
 *
 *    ES6-Promise – under MIT License
 *    libtess.js – SGI Free Software License B
 *    Proj4 – under MIT License
 *    JSZip – under MIT License
 *
 * A complete listing of 3rd Party software notices and licenses included in
 * WebWorldWind can be found in the WebWorldWind 3rd-party notices and licenses
 * PDF found in code  directory.
 */
/**
 * @exports GraticuleSupport
 */
define([
    './GraticuleRenderingParams',
    '../../shapes/ShapeAttributes',
    '../../shapes/Path',
    '../../shapes/GeographicText',
    '../../shapes/TextAttributes',
    '../../util/Color'
],
function (GraticuleRenderingParams,
          ShapeAttributes,
          Path,
          GeographicText,
          TextAttributes,
          Color) {
    "use strict";

    /**
     * Constructs an empty graticule support instance.
     * @alias GraticuleSupport
     * @constructor
     * @classdesc A support class with helper functions for displaying graticules.
     */
    var GraticuleSupport = function () {

        /**
         * The rendering params for each name.
         * @type {Map<String, GraticuleRenderingParams>}
         */
        this._namedParams = new Map();
        
        /**
         * The shape attributes for each name.
         * @type {Map<String, ShapeAttributes>}
        */
        this._namedShapeAttributes = new Map();

        /**
         * The path renderables with associated param keys.
         * @type {Array<{path: Path, paramKey: String}>}
        */
        this._pathRenderables = [];

        /**
         * The path renderables with associated param keys.
         * @type {Array<{text: GeographicText, paramKey: String}>}
        */
        this._textRenderables = [];
    };

    /**
     * Adds a Path to be rendered.
     * @param {Path} path The path to be added to the renderable array.
     * @param {String} paramKey The key for the associated graticule rendering params object.
     */
    GraticuleSupport.prototype.addPathRenderable = function (path, paramKey) {
        this._pathRenderables.push({path: path, paramKey: paramKey});
    };

    /**
     * Adds a GeographicText to be rendered.
     * @param {GeographicText} text The GeographicText to be added to the renderable array.
     * @param {String} paramKey The key for the associated graticule rendering params object.
     */
    GraticuleSupport.prototype.addTextRenderable = function (text, paramKey) {
        this._textRenderables.push({text: text, paramKey: paramKey});
    };

    /**
     * Removes all renderables.
     */
    GraticuleSupport.prototype.removeAllRenderables = function () {
        this._pathRenderables = [];
        this._textRenderables = [];
    };

    /**
     * Fetches the GraticuleRenderingParams for the given key.
     * @param {String} paramKey The key for the graticule rendering params object.
     * @returns {GraticuleRenderingParams} The GraticuleRenderingParams object.
     */
    GraticuleSupport.prototype.getRenderingParams = function (paramKey) {
        let renderingParams = this._namedParams.get(paramKey);

        if (renderingParams == null) {
            renderingParams = new GraticuleRenderingParams();
            this._namedParams.set(paramKey, renderingParams);
        }

        return renderingParams;
    };

    /**
     * Sets the GraticuleRenderingParams with the given key.
     * @param {String} paramKey The key for the graticule rendering params object.
     * @param {GraticuleRenderingParams} renderingParams The GraticuleRenderingParams object to be set.
     */
    GraticuleSupport.prototype.setRenderingParams = function (paramKey, renderingParams) {
        this._namedParams.set(paramKey, renderingParams);
    };

    /**
     * Render the Path and GeographicText renderables using the set GraticuleRenderingParams.
     * @param {DrawContext} drawContext The DrawContext to render into.
     * @param {Number} opacity The opacity for the rendered objects, defaults to 1.
     */
    GraticuleSupport.prototype.render = function (drawContext, opacity) {
        opacity = opacity || 1;

        for (let {path, paramKey} of this._pathRenderables) {
            if (path == null || paramKey == null) continue;

            let renderingParams = this._namedParams.get(paramKey);
            if (renderingParams == null || !renderingParams.drawLines) continue;

            this.applyPathRenderingParams(paramKey, renderingParams, path, opacity);
            path.render(drawContext);
        }

        for (let {text, paramKey} of this._textRenderables) {
            if (text == null || paramKey == null) continue;

            let renderingParams = this._namedParams.get(paramKey);
            if (renderingParams == null || !renderingParams.drawLabels) continue;

            this.applyTextRenderingParams(renderingParams, text, opacity);
            text.render(drawContext);
        }
    };

    // Internal.
    GraticuleSupport.prototype.applyPathRenderingParams = function (paramKey, renderingParams, path, opacity) {
        let shapeAttributes = this._namedShapeAttributes.get(paramKey);

        if (shapeAttributes == null) {
            shapeAttributes = this.createPathShapeAttributes(renderingParams, opacity);
            this._namedShapeAttributes.set(paramKey, shapeAttributes);
        }

        path.attributes = shapeAttributes;
    };

    // Internal.
    GraticuleSupport.prototype.createPathShapeAttributes = function (renderingParams, opacity) {
        let newShapeAttributes = new ShapeAttributes();
        newShapeAttributes.drawInterior = false;
        newShapeAttributes.drawOutline = true;

        let color = renderingParams.lineColor;
        if (color != null) {
            newShapeAttributes.outlineColor = new Color(color.red, color.green, color.blue, color.alpha*opacity);
        }

        let lineWidth = renderingParams.lineWidth;
        newShapeAttributes.lineWidth = lineWidth;

        let lineStyle = renderingParams.lineStyle;
        let baseFactor = Math.round(lineWidth) || 1;
        switch (lineStyle) {
            case GraticuleRenderingParams.lineStyleSolid:
                newShapeAttributes.outlineStipplePattern = 0xAAAA;
                newShapeAttributes.outlineStippleFactor = 0;
                break;
            case GraticuleRenderingParams.lineStyleDashed:
                newShapeAttributes.outlineStipplePattern = 0xAAAA;
                newShapeAttributes.outlineStippleFactor = 3*baseFactor;
                break;
            case GraticuleRenderingParams.lineStyleDotted:
                newShapeAttributes.outlineStipplePattern = 0xAAAA;
                newShapeAttributes.outlineStippleFactor = baseFactor;
                break;
        }
    };

    // Internal.
    GraticuleSupport.prototype.applyTextRenderingParams = function (renderingParams, text, opacity) {
        let textAttributes = new TextAttributes();

        let color = renderingParams.labelColor;
        if (color != null) {
            textAttributes.color = new Color(color.red, color.green, color.blue, color.alpha*opacity);
        }

        let font = renderingParams.labelFont;
        if (font != null) {
            textAttributes.font = font;
        }

        text.attributes = textAttributes;
    };

    return GraticuleSupport;
});