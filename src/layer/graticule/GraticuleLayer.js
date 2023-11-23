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
 * @exports GraticuleLayer
 */
define([
    '../Layer',
    './GraticuleSupport',
    './GraticuleRenderingParams',
    './GraticuleGridTile',
    './GridElement',
    '../../globe/Globe',
    '../../geom/Vec3',
    '../../geom/Angle',
    '../../projections/GeographicProjection',
    '../../shapes/Path',
    '../../shapes/GeographicText'
],
function (Layer,
          GraticuleSupport,
          GraticuleRenderingParams,
          GraticleGridTile,
          GridElement,
          Globe,
          Vec3,
          Angle,
          GeographicProjection,
          Path,
          GeographicText) {
    "use strict";

    /**
     * Constructs a graticule layer. This constructor is intended to be called only by subclasses.
     * @alias GraticuleLayer
     * @constructor
     * @classdesc Represents an abstract graticule layer.
     */
    var GraticuleLayer = function (displayName) {
        Layer.call(this, displayName);

        /**
         * The graticule support instance.
         * @type {Array<GraticleGridTile>}
         */
        this.gridTiles = [];
        
        /**
         * The graticule support instance.
         * @type {GraticuleSupport}
         */
        this.graticuleSupport = new GraticuleSupport();

        /**
         * The values of the current latitude labels.
         * @type {Array<Number>}
         */
        this.latitudeLabels = [];

        /**
         * The values of the current longitude labels.
         * @type {Array<Number>}
         */
        this.longitudeLabels = [];

        /**
         * The values of the current longitude labels.
         * @type {String}
         */
        this.angleFormat = GraticuleLayer.dmsAngleFormat;

        /**
         * The current globe.
         * @type {Globe}
         */
        this.globe = null;

        /**
         * The last eye point.
         * @type {Vec3}
         */
        this.lastEyePoint = null;

        /**
         * The last heading.
         * @type {Number}
         */
        this.lastHeading = 0;

        /**
         * The last tilt.
         * @type {Number}
         */
        this.lastTilt = 0;

        /**
         * The last FOV angle.
         * @type {Number}
         */
        this.lastFOV = 0;

        /**
         * The last vertical exaggeration.
         * @type {Number}
         */
        this.lastVerticalExaggeration = 1;

        /**
         * The last geographic projection, if using a Globe2D.
         * @type {GeographicProjection}
         */
        this.lastProjection = null;

        /**
         * Used for 2D continuous projections do determine whether render is in the same frame.
         * @type {Number}
         */
        this.frameTimestamp = null;
    };

    GraticuleLayer.prototype = Object.create(Layer.prototype);

    GraticuleLayer.dmsAngleFormat = "DegreesMinutesSeconds";
    GraticuleLayer.dmAngleFormat = "DegreesMinutes";
    GraticuleLayer.ddAngleFormat = "DecimalDegrees";

    /**
     * Fetches the GraticuleRenderingParams for the given key.
     * @param {String} paramKey The key for the graticule rendering params object.
     * @returns {GraticuleRenderingParams} The GraticuleRenderingParams object.
     */
    GraticuleLayer.prototype.getRenderingParams = function(paramKey) {
        return this.graticuleSupport.getRenderingParams(paramKey);
    };

    /**
     * Sets the GraticuleRenderingParams with the given key.
     * @param {String} paramKey The key for the graticule rendering params object.
     * @param {GraticuleRenderingParams} renderingParams The GraticuleRenderingParams object to be set.
     */
    GraticuleLayer.prototype.setRenderingParams = function(paramKey, renderingParams) {
        this.graticuleSupport.setRenderingParams(paramKey, renderingParams);
    };
    
    /**
     * Adds a path renderable with the given attributes key.
     * @param {Path} path The path shape.
     * @param {String} paramKey The attributes key.
     */
    GraticuleLayer.prototype.addPathRenderable = function(path, paramKey) {
        this.graticuleSupport.addPathRenderable(path, paramKey);
    };

    /**
     * Adds a text renderable with the given attributes key.
     * @param {GeographicText} text The text shape.
     * @param {String} paramKey The attributes key.
     */
    GraticuleLayer.prototype.addTextRenderable = function(text, paramKey) {
        this.graticuleSupport.addTextRenderable(text, paramKey);
    };

    /**
     * Removes all renderables.
     */
    GraticuleLayer.prototype.removeAllRenderables = function() {
        this.graticuleSupport.removeAllRenderables();
    };

    GraticuleLayer.prototype.selectRenderables = function(dc) {
        let visibleTiles = this.getVisibleTiles(dc);
        for (let tile of visibleTiles) {
            let [pathRenderables, textRenderables, createdLabels] = tile.selectRenderables();

            for (let [path, graticuleLevel] of pathRenderables) {
                this.addPathRenderable(path, graticuleLevel);
            }

            for (let [text, graticuleLevel] of textRenderables) {
                this.addTextRenderable(text, graticuleLevel);
            }

            for (let [value, labelType, graticuleLevel, deltaLatitude, labelOffset] of createdLabels) {
                this.addLabel(value, labelType, graticuleLevel, deltaLatitude, labelOffset);
            }
        }
    };

    GraticuleLayer.prototype.getVisibleTiles = function(dc) {
        // Implemented by subclasses.
        return [];
    }

    GraticuleLayer.prototype.addLabel = function(value, labelType, graticuleLevel, resolution, labelOffset) {
        let angleLabel = this.makeAngleLabel(new Angle(value), resolution);
        let text;

        if (labelType == GridElement.typeLatitudeLabel && !this.latitudeLabels.contains(value)) {
            this.latitudeLabels.push(value);
            text = new GeographicText(angleLabel, new Vec3(value, labelOffset.longitude, 0));
        } else if (labelType == GridElement.typeLongitudeLabel && !this.latitudeLabels.contains(value)) {
            this.longitudeLabels.push(value);
            text = new GeographicText(angleLabel, new Vec3(labelOffset.latitude, value, 0));
        }

        if (text) this.addTextRenderable(text, graticuleLevel);
    };

    GraticuleLayer.prototype.makeAngleLabel = function(angle, resolution) {
        switch (this.angleFormat) {
            case GraticuleLayer.dmsAngleFormat:
                if (resolution >= 1)
                    return angle.toDecimalDegreesString(0);

                return angle.doDMSString();
            
            case GraticuleLayer.dmAngleFormat:
                if (resolution >= 1)
                    return angle.toDecimalDegreesString(0);

                return angle.toDMString();

            case GraticuleLayer.ddAngleFormat:
            default:
                if (resolution >= 1)
                    label = angle.toDecimalDegreesString(0);
                else if (resolution >= .1)
                    label = angle.toDecimalDegreesString(1);
                else if (resolution >= .01)
                    label = angle.toDecimalDegreesString(2);
                else if (resolution >= .001)
                    label = angle.toDecimalDegreesString(3);
                else
                    label = angle.toDecimalDegreesString(4);
        };
    };

    GraticuleLayer.prototype.doRender = function(dc) {
        // For now, not dealing with special updates to 2D continuous globes wrt timestamps

        if (this.needsToUpdate(dc)) {
            this.clear(dc);
            this.selectRenderables(dc);
        }
        
        this.graticuleSupport.render(dc, this.opacity);
    };

    GraticuleLayer.prototype.needsToUpdate = function(dc) {
        if (!this.lastEyePoint) return true;

        let surfacePoint = dc.surfacePointForMode(this.lastEyePoint.latitude, this.lastEyePoint.longitude, 0, WorldWind.RELATIVE_TO_GROUND);
        let altitudeAboveGround = dc.eyePoint.distanceTo(surfacePoint);
        if (dc.eyePoint.distanceTo(this.lastEyePoint) > altitudeAboveGround / 100) return true;

        if (this.lastVerticalExaggeration != dc.verticalExaggeration) return true;

        if (Math.abs(this.lastHeading - dc.navigator.heading) > 1) return true;

        if (Math.abs(this.lastTilt - dc.navigator.tilt) > 1) return true;

        if (Math.abs(this.lastFOV - dc.navigator.fieldOfView) > 1) return true;

        // Test if the globe or projection changed
        if (this.globe != dc.globe) return true;

        if (dc.globe.projection.is2D && dc.globe.projection != this.lastProjection) return true;

        return false;
    };

    /**
     * Clears renderables, updates position and view.
     * @param {DrawContext} dc The current draw context.
     */
    GraticuleLayer.prototype.clear = function(dc) {
        this.removeAllRenderables();
        this.globe = dc.globe;
        this.lastEyePoint = dc.eyePoint;
        this.lastFOV = dc.navigator.fieldOfView;
        this.lastHeading = dc.navigator.heading;
        this.lastTilt = dc.navigator.tilt;
        this.lastVerticalExaggeration = dc.verticalExaggeration;
        this.lastProjection = dc.globe.projection;

        this.latitudeLabels = [];
        this.longitudeLabels = [];
    };

    return GraticuleLayer;
});