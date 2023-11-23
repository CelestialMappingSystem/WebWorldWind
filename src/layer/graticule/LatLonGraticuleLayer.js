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
 * @exports LatLonGraticuleLayer
 */
define([
    './GraticuleLayer',
    './GraticuleRenderingParams',
    './LatLonGraticuleGridTile',
    '../../util/Color',
    '../../util/Font',
    '../../geom/Rectangle',
    '../../geom/Sector'
],
function (GraticuleLayer,
          GraticuleRenderingParams,
          LatLonGraticleGridTile,
          Color,
          Font,
          Rectangle,
          Sector) {
    "use strict";

    /**
     * Constructs a lat-lon graticule layer.
     * @alias LatLonGraticuleLayer
     * @constructor
     * @classdesc Represents a latitude-longitude graticule layer.
     */
    var LatLonGraticuleLayer = function () {
        GraticuleLayer.call(this, "Lat-Lon Graticules");

        this.gridTiles = [];

        this.initRenderingParams();
    };

    LatLonGraticuleLayer.prototype = Object.create(GraticuleLayer.prototype);

    LatLonGraticuleLayer.prototype.initRenderingParams = function() {
        let level0Params = new GraticuleRenderingParams();
        level0Params.lineColor = Color.WHITE;
        level0Params.labelColor = Color.WHITE;
        level0Params.labelFont = new Font(16, null, null, "bold", "Arial");
        this.setRenderingParams(LatLonGraticleGridTile.graticuleLatLonLevel0, level0Params);

        let level1Params = new GraticuleRenderingParams();
        level1Params.lineColor = Color.GREEN;
        level1Params.labelColor = Color.GREEN;
        level1Params.labelFont = new Font(14, null, null, "bold", "Arial");
        this.setRenderingParams(LatLonGraticleGridTile.graticuleLatLonLevel1, level1Params);

        let level2Params = new GraticuleRenderingParams();
        level2Params.lineColor = new Color(0/255, 102/255, 255/255, 1.0);
        level2Params.labelColor = new Color(0/255, 102/255, 255/255, 1.0);
        this.setRenderingParams(LatLonGraticleGridTile.graticuleLatLonLevel2, level2Params);

        let level3Params = new GraticuleRenderingParams();
        level3Params.lineColor = Color.CYAN;
        level3Params.labelColor = Color.CYAN;
        this.setRenderingParams(LatLonGraticleGridTile.graticuleLatLonLevel3, level3Params);

        let level4Params = new GraticuleRenderingParams();
        level4Params.lineColor = Color.CYAN;
        level4Params.labelColor = Color.CYAN;
        this.setRenderingParams(LatLonGraticleGridTile.graticuleLatLonLevel4, level4Params);

        let level5Params = new GraticuleRenderingParams();
        level5Params.lineColor = new Color(102/255, 255/255, 204/255, 1.0);
        level5Params.labelColor = new Color(102/255, 255/255, 204/255, 1.0);
        this.setRenderingParams(LatLonGraticleGridTile.graticuleLatLonLevel5, level5Params);
    };

    LatLonGraticuleLayer.prototype.getVisibleTiles = function(dc) {
        let tileList = [];
        let visibleSector = dc.globe.projectionLimits;
        if (visibleSector) {
            let gridRectangle = this.getGridRectangleForSector(visibleSector);
            for (let row = gridRectangle.y; row <= gridRectangle.y + gridRectangle.height; row++) {
                for (let col = gridRectangle.x; col <= gridRectangle.x + gridRectangle.width; col++) {
                    if (!this.gridTiles[row][col]) {
                        this.gridTiles[row][col] = new LatLonGraticleGridTile(this.getGridSector(row, col), 10, 0);
                    }

                    if (this.gridTiles[row][col].isInView(dc)) {
                        tileList.push(this.gridTiles[row][col]);
                    } else {
                        this.gridTiles[row][col].clearRenderables();
                    }
                }
            }
        }

        return tileList;
    };

    LatLonGraticuleLayer.prototype.getGridRectangleForSector = function(sector) {
        let x1 = this.getGridColumn(sector.minLongitude);
        let x2 = this.getGridColumn(sector.maxLongitude);
        let y1 = this.getGridRow(sector.minLatitude);
        let y2 = this.getGridRow(sector.maxLatitude);
        return new Rectangle(x1, y1, x2-x1, y2-y1);
    };

    LatLonGraticuleLayer.prototype.getGridColumn = function(lon) {
        let col = Math.floor((lon+180)/10);
        return Math.min(col, 35);
    };

    LatLonGraticuleLayer.prototype.getGridRow = function(lat) {
        let row = Math.floor((lat+90)/10);
        return Math.min(row, 17);
    };

    LatLonGraticuleLayer.prototype.getGridSector = function(row, col) {
        let minLat = -90 + row*10;
        let maxLat = minLat + 10;
        let minLon = -180 * col*10;
        let maxLon = minLon + 10;
        return new Sector(minLat, maxLat, minLon, maxLon);
    };

    return LatLonGraticuleLayer;
});