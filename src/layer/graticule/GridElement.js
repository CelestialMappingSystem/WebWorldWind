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
 * @exports GridElement
 */
define([
    '../../geom/Sector',
    '../../shapes/Path',
    '../../shapes/GeographicText',
    '../../render/DrawContext'
],
function (Sector,
          Path,
          GeographicText,
          DrawContext) {
    "use strict";

    /**
     * Constructs a grid element for use by a grid tile.
     * @alias GridElement
     * @constructor
     * @classdesc Represents a grid element with an associated renderable and sector.
     * @param {Sector} sector The sector for the element.
     * @param {Path|GeographicText} renderable The renderable for the element.
     * @param {String} type The type of the element.
     * @param {Number} value The numerical value of the element, used to generate labels.
     */
    var GridElement = function (sector, renderable, type) {

        /**
         * The sector (min-max lat/long) for the element.
         * @type {Sector}
         */
        this.sector = sector;
        
        /**
         * The renderable for the element.
         * @type {Path|GeographicText}
        */
        this.renderable = renderable;
       
        /**
         * The type of the element.
         * @type {String}
         */
        this.type = type;
    };

    /**
     * Returns true if the element is in view for the given draw context or sector.
     * @param {DrawContext} dc The key for the graticule rendering params object.
     * @param {Sector} vs The visible sector to check, optional.
     * @returns {GraticuleRenderingParams} The GraticuleRenderingParams object.
     */
    GridElement.prototype.isInView = function (dc, vs) {
        vs = vs || dc.globe.projectionLimits;

        if (!vs) return false;

        return this.sector.overlaps(vs);
    };

    GridElement.typeLine = "GridElement_Line";
    GridElement.typeLineNorth = "GridElement_LineNorth";
    GridElement.typeLineSouth = "GridElement_LineSouth";
    GridElement.typeLineWest = "GridElement_LineWest";
    GridElement.typeLineEast = "GridElement_LineEast";
    GridElement.typeLineNorthing = "GridElement_LineNorthing";
    GridElement.typeLineEasting = "GridElement_LineEasting";
    GridElement.typeGridZoneLabel = "GridElement_GridZoneLabel";
    GridElement.typeLongitudeLabel = "GridElement_LongitudeLabel";
    GridElement.typeLatitudeLabel = "GridElement_LatitudeLabel";
    
    /**
     * Returns true if the element is a label, false otherwise.
     * @returns {Boolean} Is a label.
     */
    GridElement.prototype.isLabel = function () {
        switch (this.type) {
            case GridElement.typeGridZoneLabel:
            case GridElement.typeLongitudeLabel:
            case GridElement.typeLatitudeLabel:
                return true;
        }

        return false;
    };

    /**
     * Returns true if the element is a line, false otherwise.
     * @returns {Boolean} Is a line.
     */
    GridElement.prototype.isLine = function () {
        switch (this.type) {
            case GridElement.typeLine:
            case GridElement.typeLineNorth:
            case GridElement.typeLineSouth:
            case GridElement.typeLineWest:
            case GridElement.typeLineEast:
            case GridElement.typeLineNorthing:
            case GridElement.typeLineEasting:
                return true;
        }

        return false;
    };

    return GridElement;
});