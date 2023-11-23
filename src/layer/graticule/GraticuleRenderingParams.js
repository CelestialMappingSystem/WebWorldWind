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
 * @exports GraticuleRenderingParams
 */
define([
        '../../util/Color',
        '../../util/Font'
    ],
    function (Color,
              Font) {
        "use strict";

        /**
         * Constructs an empty set of graticule rendering parameters.
         * @alias GraticuleRenderingParams
         * @constructor
         * @classdesc Represents a set of graticule rendering parameters.
         */
        var GraticuleRenderingParams = function () {

            /**
             * If the graticule lines should be drawn.
             * @type {Boolean}
             */
            this.drawLines = true;
            
            /**
             * The color of the graticule lines.
             * @type {Color}
            */
            this.lineColor = Color.WHITE;
           
            /**
             * The width of the graticule lines.
             * @type {Boolean}
             */
            this.lineWidth = 1.0;

            /**
             * The style of the graitcule lines.
             * @type {String}
             */
            this.lineStyle = GraticuleRenderingParams.lineStyleSolid;

            /**
             * If the graticule labels should be drawn.
             * @type {Boolean}
             */
            this.drawLabels = true;

            /**
             * The color of the graticule labels.
             * @type {Color}
            */
            this.labelColor = Color.WHITE;

            /**
             * The color of the graticule labels.
             * @type {Font}
            */
            this.labelFont = new Font(12, null, null, "bold", "Arial", null);
        };

        GraticuleRenderingParams.lineStyleSolid = "LineStyleSolid";
        GraticuleRenderingParams.lineStyleDashed = "LineStyleDashed";
        GraticuleRenderingParams.lineStyleDotted = "LineStyleDotted";

        return GraticuleRenderingParams;
    });