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
 * @exports LatLonGraticuleGridTile
 */
define([
    './GraticuleGridTile',
    '../../geom/Sector',
    '../../geom/BoundingBox',
    '../../geom/Angle',
    '../../geom/Position',
    '../../render/DrawContext',
    '../../shapes/Path',
    './GridElement'
],
function (GraticuleGridTile,
          Sector,
          BoundingBox,
          Angle,
          Position,
          DrawContext,
          Path,
          GridElement) {
    "use strict";

    /**
     * Constructs a latitude-longitude grid tile for use by a lat-lon graticule layer.
     * @alias LatLonGraticuleGridTile
     * @constructor
     * @augments GraticuleGridTile
     * @classdesc Represents a lat-lon graticule grid tile.
     * @param {Sector} sector The sector for the tile.
     * @param {Number} divisions The number of subtile divisions to be made.
     * @param {Number} level The division depth of this tile.
     */
    var LatLonGraticuleGridTile = function (sector, divisions, level) {

        GraticuleGridTile.call(this, sector, divisions, level);
    };

    LatLonGraticuleGridTile.minCellSizePixels = 40;

    LatLonGraticuleGridTile.graticuleLatLonLevel0 = "Graticule.LatLonLevel0";
    LatLonGraticuleGridTile.graticuleLatLonLevel1 = "Graticule.LatLonLevel1";
    LatLonGraticuleGridTile.graticuleLatLonLevel2 = "Graticule.LatLonLevel2";
    LatLonGraticuleGridTile.graticuleLatLonLevel3 = "Graticule.LatLonLevel3";
    LatLonGraticuleGridTile.graticuleLatLonLevel4 = "Graticule.LatLonLevel4";
    LatLonGraticuleGridTile.graticuleLatLonLevel5 = "Graticule.LatLonLevel5";

    LatLonGraticuleGridTile.prototype = Object.create(GraticuleGridTile.prototype);

    // Documented by superclass.
    LatLonGraticuleGridTile.prototype.isInView = function(dc) {
        if (!GraticuleGridTile.prototype.isInView.call(this, dc)) return false;

        if (this.level != 0 && this.getSizeInPixels(dc) / this.divisions < LatLonGraticuleGridTile.minCellSizePixels) return false;

        return true;
    };

    // Documented by superclass.
    LatLonGraticuleGridTile.prototype.selectRenderables = function(dc) {
        if (!this.gridElements) {
            this.createRenderables();
        }

        let selectedPathRenderables = [];
        let selectedTextRenderables = [];
        let createdLabels = [];

        let labelOffset = this.computeLabelOffset(dc);
        
        // Add level 0 bounding lines and labels
        let graticuleLevel = this.getLevel(this.sector.deltaLatitude());

        if (this.level == 0) {
            for (let ge of this.gridElements) {
                if (ge.isInView(dc) && (
                    ge.type == GridElement.typeLineSouth || 
                    ge.type == GridElement.typeLineNorth || 
                    ge.type == GridElement.typeLineWest)) {
                    selectedPathRenderables.push([ge.renderable, graticuleLevel]);

                    let labelType = (ge.type == GridElement.typeLineNorth || ge.type == GridElement.typeLineSouth) ?
                        GridElement.typeLatitudeLabel : GridElement.typeLongitudeLabel;
                    createdLabels.push([ge.value, labelType, graticuleLevel, this.sector.deltaLatitude(), labelOffset]);
                }
            }
            if (this.getSizeInPixels(dc) / this.divisions < this.minCellSizePixels) return [selectedPathRenderables, selectedTextRenderables, createdLabels];
        }

        // Add tile grid elements
        let resolution = this.sector.deltaLatitude() / this.divisions;
        graticuleLevel = this.getLevel(resolution);

        for (let ge of this.gridElements) {
            if (ge.isInView(dc) && ge.type == GridElement.typeLine) {
                if (ge.isLine()) {
                    selectedPathRenderables.push([ge.renderable, graticuleLevel]);
                } else if (ge.isText()) {
                    selectedTextRenderables.push([ge.renderable, graticuleLevel]);
                }

                let labelType = ge.sector.deltaLatitude() == 0 ?
                    GridElement.typeLatitudeLabel : GridElement.typeLongitudeLabel;
                createdLabels.push([ge.value, labelType, graticuleLevel, this.sector.deltaLatitude(), labelOffset])
            }
        }

        if (this.getSizeInPixels(dc) / this.divisions < LatLonGraticuleGridTile.minCellSizePixels * 2) return [selectedPathRenderables, selectedTextRenderables, createdLabels];

        if (!this.subTiles) {
            this.createSubTiles();
        }
        for (let gt of this.subTiles) {
            if (gt.isInView(dc)) gt.selectRenderables(dc);
            else gt.clearRenderables();
        }

        return [selectedPathRenderables, selectedTextRenderables, createdLabels];
    };

    // Documented by superclass.
    LatLonGraticuleGridTile.prototype.createSubTiles = function() {
        this.subTiles = [];
        let sectors = this.subdivideSector();

        let subdivisions = 10;
        if (this.level == 0 || this.level == 2) {
            subdivisions = 6;
        }

        for (let s of sectors) {
            this.subTiles.push(new LatLonGraticuleGridTile(
                s,
                subdivisions,
                this.level + 1
            ));
        }
    };

    /**
     * Gets the graticule level for a given resolution.
     * @param {Number} resolution The resolution in delta latitude degrees.
     * @returns {String} The LatLonGraticuleGridTile.graticuleLatLonLevelX constant.
     */
    LatLonGraticuleGridTile.prototype.getLevel = function(resolution) {
        if (resolution >= 10) return LatLonGraticuleGridTile.graticuleLatLonLevel0;
        else if (resolution >= 1) return LatLonGraticuleGridTile.graticuleLatLonLevel1;
        else if (resolution >= .1) return LatLonGraticuleGridTile.graticuleLatLonLevel2;
        else if (resolution >= .01) return LatLonGraticuleGridTile.graticuleLatLonLevel3;
        else if (resolution >= .001) return LatLonGraticuleGridTile.graticuleLatLonLevel4;
        else if (resolution >= .0001) return LatLonGraticuleGridTile.graticuleLatLonLevel5;
    };

    return LatLonGraticuleGridTile;
});