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
 * @exports GraticuleGridTile
 */
define([
    '../../geom/Sector',
    '../../geom/BoundingBox',
    '../../geom/Angle',
    '../../geom/Position',
    '../../render/DrawContext',
    '../../shapes/Path',
    '../../geom/Vec3',
    '../../geom/Location',
    './GridElement'
],
function (Sector,
          BoundingBox,
          Angle,
          Position,
          DrawContext,
          Path,
          Vec3,
          Location,
          GridElement) {
    "use strict";

    /**
     * Constructs a grid tile for use by a graticule layer. This constructor is intended to be called only by subclasses.
     * @alias GraticuleGridTile
     * @constructor
     * @classdesc Represents an abstract graticule grid tile.
     * @param {Sector} sector The sector for the tile.
     * @param {Number} divisions The number of subtile divisions to be made.
     * @param {Number} level The division depth of this tile.
     */
    var GraticuleGridTile = function (sector, divisions, level) {

        /**
         * The sector (min-max lat/long) for the tile.
         * @type {Sector}
         */
        this.sector = sector;
        
        /**
         * The number of subtile divisions to be made.
         * @type {Number}
        */
        this.divisions = divisions;
       
        /**
         * The division depth of this tile.
         * @type {Number}
         */
        this.level = level;

        /**
         * The grid elements for this tile.
         * @type {Array<GridElement>}
         */
        this.gridElements = null;

        /**
         * The subtiles within this tile.
         * @type {Array<GraticuleGridTile>}
         */
        this.subTiles = null;
    };

    /**
     * Tests if the tile is in view for the given draw context. This method is intended to be called only by subclasses.
     * @param {DrawContext} dc The current draw context.
     * @returns {Boolean} Is in view.
     */
    GraticuleGridTile.prototype.isInView = function(dc) {
        let [minElv, maxElv] = dc.globe.minAndMaxElevationsForSector(this.sector);
        let extent = new BoundingBox();
        extent.setToSector(this.sector, dc.globe, minElv * dc.verticalExaggeration, maxElv * dc.verticalExaggeration);

        if (!extent.intersectsFrustum(dc.frustumInModelCoordinates)) return false;

        if (dc.projectionLimits && !this.sector.overlaps(vs)) return false;

        return true;
    };

    /**
     * Calculates the current size of the tile in pixels.
     * @param {DrawContext} dc The current draw context.
     * @returns {Number} The pixel size.
     */
    GraticuleGridTile.prototype.getSizeInPixels = function(dc) {
        let location = Location.ZERO;
        this.sector.centroid(location);
        let centerPoint = new Vec3();
        dc.surfacePointForMode(location.latitude, location.longitude, 0, null, centerPoint);

        let distance = dc.eyePoint.distanceTo(centerPoint);
        let tileSizeMeter = this.sector.deltaLatitude() * Angle.DEGREES_TO_RADIANS;
        return tileSizeMeter / dc.pixelSizeAtDistance(distance);
    };

    /**
     * Removes the grid elements and subtiles for this tile and subtiles.
     */
    GraticuleGridTile.prototype.clearRenderables = function() {
        this.gridElements = null;

        if (this.subTiles) {
            for (let tile of this.subTiles) {
                tile.clearRenderables();
            }
            this.subTiles = null;
        }
    };

    /**
     * Creates grid elements for this tile.
     */
    GraticuleGridTile.prototype.createRenderables = function() {
        this.gridElements = [];

        let step = this.sector.deltaLatitude() / this.divisions;

        // Generate meridians with labels
        let longitude = this.sector.minLongitude + (this.level == 0 ? 0 : step);
        while (longitude < this.sector.maxLongitude - step / 2) {
            let positions = [
                new Position(this.sector.minLatitude, longitude, 0),
                new Position(this.sector.maxLatitude, longitude, 0)
            ];

            let line = this.createLineRenderable(positions, WorldWind.LINEAR);
            let sector = new Sector(this.sector.minLatitude, this.sector.maxLatitude, longitude, longitude);
            let lineType = longitude == this.sector.minLongitude ? GridElement.typeLineWest : GridElement.typeLine;

            let element = new GridElement(sector, line, lineType);
            element.value = longitude;
            this.gridElements.push(element);

            longitude += step;
        }

        // Generate parallels
        let latitude = this.sector.minLatitude + (this.level == 0 ? 0 : step);
        while (latitude < this.sector.maxLatitude - step / 2) {
            let positions = [
                new Position(latitude, this.sector.minLongitude, 0),
                new Position(latitude, this.sector.maxLongitude, 0)
            ];

            let line = this.createLineRenderable(positions, WorldWind.LINEAR);
            let sector = new Sector(latitude, latitude, this.sector.minLongitude, this.sector.maxLongitude);
            let lineType = latitude == this.sector.minLatitude ? GridElement.typeLineSouth : GridElement.typeLine;

            let element = new GridElement(sector, line, lineType);
            element.value = latitude;
            this.gridElements.push(element);

            latitude += step;
        }

        // Draw and label a parallel at the top of the graticule. The line is apparent only on 2D globes.
        if (this.sector.maxLatitude == 90) {
            let positions = [
                new Position(90, this.sector.minLongitude, 0),
                new Position(90, this.sector.maxLongitude, 0)
            ];

            let line = this.createLineRenderable(positions, WorldWind.LINEAR);
            let sector = new Sector(90, 90, this.sector.minLongitude, this.sector.maxLongitude);
            let lineType = GridElement.typeLineNorth;

            let element = new GridElement(sector, line, lineType);
            element.value = 90;
            this.gridElements.push(element);
        }
    };

    /**
     * Selects the renderables to draw for the current draw context.
     * @param {DrawContext} dc The current draw context.
     * @returns {Array<>} The list of selected path renderables (Path object, graticule level),
     * the selected text renderables (GeographicText object, graticule level),
     * and the list of created labels (value, label type, graticule level, delta latitude, offset)
     */
    GraticuleGridTile.prototype.selectRenderables = function(dc) {
        // Implemented by subclasses.
        return [];
    };

    /**
     * Creates the subtiles of this tile.
     */
    GraticuleGridTile.prototype.createSubTiles = function() {
        // Implemented by subclasses.
    }

    // Internal.
    GraticuleGridTile.prototype.createLineRenderable = function(positions, pathType) {
        let path = new Path(positions);
        path.altitudeMode = WorldWind.CLAMP_TO_GROUND;
        path.followTerrain = true;
        path.pathType = pathType;
        return path;
    };

    // Internal.
    GraticuleGridTile.prototype.computeLabelOffset = function(dc) {
        return dc.eyePosition;
    };

    // Internal.
    GraticuleGridTile.prototype.subdivideSector = function() {
        let dLat = this.sector.deltaLatitude();
        let dLon = this.sector.deltaLongitude();

        let minLat = this.sector.minLatitude;
        let minLon = this.sector.minLongitude;

        let sectors = [];
        let idx = 0;

        for (let row = 0; row < this.divisions; row++) {
            for (let col = 0; col < this.divisions; col++) {
                sectors[idx++] = new Sector(
                    minLat + dLat * row,
                    minLat + dLat * row + dLat,
                    minLon + dLon * col,
                    minLon + dLon * col + dLon
                );
            }
        }

        return sectors;
    };

    return GraticuleGridTile;
});