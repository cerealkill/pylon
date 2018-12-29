/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */

// #ifdef __AMLCOLORPICKER || __INC_ALL

/**
 * Element giving the user a visual choice to pick a color just like Photoshop
 * does it!
 *
 * @constructor
 * @define colorpicker
 *
 *
 * @author      Mike de Boer (mike AT javeline DOT com)
 * @version     %I%, %G%
 * @since       3.0
 *
 * @inherits apf.StandardBinding
 * @inherits apf.DataAction
 *
 * @attribute {String} value the color that is selected in the color picker.
 *
 * @binding value  Determines the way the value for the element is retrieved
 * from the bound data.
 * Example:
 * Sets the color based on data loaded into this component.
 * <code>
 *  <a:model id="mdlColor">
 *      <data color="#000099"></data>
 *  </a:model>
 *  <a:colorpicker 
 *    model = "mdlColor" 
 *    value = "[@color]" />
 * </code>
 */
apf.colorpicker = function(struct, tagName){
    this.$init(tagName || "colorpicker", apf.NODE_VISIBLE, struct);
};

(function(){
    this.value       = "ff0000";
    this.changeTimer = null;

    var c = apf.color;

    this.$supportedProperties.push("color", "red", "green", "blue", "hue",
        "saturation", "brightness", "hex", "skin-textbox", "skin-spinner");

    this.$propHandlers["red"]        =
    this.$propHandlers["green"]      =
    this.$propHandlers["blue"]       =
    this.$propHandlers["hue"]        =
    this.$propHandlers["saturation"] = 
    this.$propHandlers["brightness"] = 
    this.$propHandlers["hex"]        = function(val, prop) {
        if (this.$ignoreSetProperty)
            return;
        clearTimeout(this.changeTimer);
        var _self = this;
        this.changeTimer = $setTimeout(function() {
            _self.$change(prop);
        });
    };

    this.$propHandlers["value"] = function(val) {
        this.$restoreOriginal();
    };

    this.$restoreOriginal = function() {
        var hsb = c.hexToHSB(this.value);
        this.hue = hsb.h;
        this.saturation = hsb.s;
        this.brightness = hsb.b;
        this.$change();
        this.oCustomColor.style.backgroundColor = 
            (this.value.substr(0, 1) != "#" ? "#" : "") + this.value;
    };

    this.$change = function(prop) {
        if (!prop || /hsb|hue|saturation|brightness/.test(prop)) {
            prop = "hsb";
            var hsb = c.fixHSB({h: this.hue, s: this.saturation, b: this.brightness});
            var hex = c.HSBToHex(hsb);
            var rgb = c.HSBToRGB(hsb);
        } else if (/red|green|blue|rgb/.test(prop)) {
            prop = "rgb";
            var rgb = c.fixRGB({r: this.red, g: this.green, b: this.blue});
            var hex = c.RGBToHex(rgb);
            var hsb = c.RGBToHSB(rgb);
        } else {
            prop = "hex";
            var hex = c.fixHex(this.hex);
            var hsb = c.hexToHSB(hex);
            var rgb = c.hexToRGB(hex);
        }

        this.oNewColor.style.backgroundColor = "#" + hex;

        this.$ignoreSetProperty = true;
        if (prop != "rgb") {
            this.setProperty("red", rgb.r);
            this.setProperty("green", rgb.g);
            this.setProperty("blue", rgb.b);
        }
        if (prop != "hsb") {
            this.setProperty("hue", hsb.h);
            this.setProperty("saturation", hsb.s);
            this.setProperty("brightness", hsb.b);
        }
        if (prop != "hex")
            this.setProperty("hex", hex);
        this.$ignoreSetProperty = false;
        
        this.oSelector.style.background = "#" + c.HSBToHex({h: hsb.h, s: 100, b: 100});
        this.oHue.style.top          = parseInt(150 - 150 * hsb.h / 360, 10) + "px";
        this.oSelectorInd.style.left = parseInt(150 * hsb.s / 100, 10) + "px";
        this.oSelectorInd.style.top  = parseInt(150 * (100 - hsb.b) / 100, 10) + "px";
    };

    this.$draw = function() {
        if (!this.id)
            this.setProperty("id", "colorpicker" + this.$uniqueId);

        //Build Main Skin
        this.$ext          = this.$getExternal();
        this.oSelector     = this.$getLayoutNode("main", "selector", this.$ext);
        this.oSelectorInd  = this.$getLayoutNode("main", "selector_indic", this.$ext);
        this.oHue          = this.$getLayoutNode("main", "hue", this.$ext);
        this.oNewColor     = this.$getLayoutNode("main", "newcolor", this.$ext);
        this.oCustomColor  = this.$getLayoutNode("main", "customcolor", this.$ext);
        this.oInputs       = this.$getLayoutNode("main", "inputs", this.$ext);

        this.$restoreOriginal();

        //attach behaviours
        var _self = this,
            doc   = (!document.compatMode || document.compatMode == 'CSS1Compat')
                ? document.html : document.body;
        function stopMoving() {
            document.onmousemove = document.onmouseup = null;
            _self.$change();
            return false;
        }
        function selectorDown() {
            var el  = this,
                pos = apf.getAbsolutePosition(el);
            
            function selectorMove(e) {
                e = e || event;
                var pageX = e.pageX || e.clientX + (doc ? doc.scrollLeft : 0),
                    pageY = e.pageY || e.clientY + (doc ? doc.scrollTop  : 0);
                // only the saturation and brightness change...
                _self.brightness = parseInt(100 * (150 - Math.max(0, Math.min(150,
                    (pageY - pos[1])))) / 150, 10);
                _self.saturation = parseInt(100 * (Math.max(0, Math.min(150,
                    (pageX - pos[0])))) / 150, 10);
                _self.$change();
                pos = apf.getAbsolutePosition(el);
                return false;
            }
            document.onmousemove = selectorMove;
            document.onmouseup   = function(e) {
                selectorMove(e);
                return stopMoving(e);
            };
        }
        
        function hueDown(e) {
            var el  = this,
                pos = apf.getAbsolutePosition(el);

            function hueMove(e) {
                e = e || event;
                var pageY = e.pageY || e.clientY + (doc ? doc.scrollTop : 0);
                _self.hue  = parseInt(360 * (150 - Math.max(0,
                    Math.min(150, (pageY - pos[1])))) / 150, 10);
                _self.$change();
                pos = apf.getAbsolutePosition(el);
            }
            document.onmousemove = hueMove;
            document.onmouseup   = function(e) {
                hueMove(e);
                return stopMoving(e);
            };
        }
        this.oSelector.onmousedown       = selectorDown;
        this.oHue.parentNode.onmousedown = hueDown;
        this.oCustomColor.onmousedown    = function() {
            _self.$restoreOriginal();
        };

        function spinnerChange(e) {
            var o     = e.currentTarget;
            var isRGB = false;
            if (o.id.indexOf("hue") > -1) {
                _self.hue = e.value;
            }
            else if (o.id.indexOf("saturation") > -1) {
                _self.saturation = e.value;
            }
            else if (o.id.indexOf("brightness") > -1) {
                _self.brightness = e.value;
            }
            else if (o.id.indexOf("red") > -1) {
                _self.red = e.value;
                isRGB = true;
            }
            else if (o.id.indexOf("green") > -1) {
                _self.green = e.value;
                isRGB = true;
            }
            else if (o.id.indexOf("blue") > -1) {
                _self.blue = e.value;
                isRGB = true;
            }

            _self.$change(isRGB ? "red" : "hue");
        }

        //append APF widgets for additional controls
        var skin = apf.getInheritedAttribute(this.parentNode, "skinset");
        new apf.hbox({
            htmlNode: this.oInputs,
            skinset: skin,
            left: 212,
            top: 52,
            width: 150,
            padding: 3,
            childNodes: [
                new apf.vbox({
                    padding: 3,
                    edge: "0 10 0 0",
                    childNodes: [
                        new apf.hbox({
                            childNodes: [
                                new apf.label({
                                    width: 14,
                                    caption: "R:",
                                    "for": this.id + "_red"
                                }),
                                new apf.spinner({
                                    id: this.id + "_red",
                                    skin: this["skin-spinner"],
                                    realtime: true,
                                    width: 45,
                                    min: 0,
                                    max: 255,
                                    value: "{" + this.id + ".red}",
                                    onafterchange: spinnerChange
                                })
                            ]
                        }),
                        new apf.hbox({
                            edge: "0 0 3 0",
                            childNodes: [
                                new apf.label({
                                    width: 14,
                                    caption: "G:",
                                    "for": this.id + "_green"
                                }),
                                new apf.spinner({
                                    id: this.id + "_green",
                                    skin: this["skin-spinner"],
                                    realtime: true,
                                    width: 45,
                                    min: 0,
                                    max: 255,
                                    value: "{" + this.id + ".green}",
                                    onafterchange: spinnerChange
                                })
                            ]
                        }),
                        new apf.hbox({
                            edge: "0 0 3 0",
                            childNodes: [
                                new apf.label({
                                    width: 14,
                                    caption: "B:",
                                    "for": this.id + "_blue"
                                }),
                                new apf.spinner({
                                    id: this.id + "_blue",
                                    skin: this["skin-spinner"],
                                    realtime: true,
                                    width: 45,
                                    min: 0,
                                    max: 255,
                                    value: "{" + this.id + ".blue}",
                                    onafterchange: spinnerChange
                                })
                            ]
                        })
                    ]
                }),
                new apf.vbox({
                    padding: 3,
                    childNodes: [
                        new apf.hbox({
                            childNodes: [
                                new apf.label({
                                    width: 14,
                                    caption: "H:",
                                    "for": this.id + "_hue"
                                }),
                                new apf.spinner({
                                    id: this.id + "_hue",
                                    skin: this["skin-spinner"],
                                    realtime: true,
                                    width: 45,
                                    min: 0,
                                    max: 360,
                                    value: "{" + this.id + ".hue}",
                                    onafterchange: spinnerChange
                                })
                            ]
                        }),
                        new apf.hbox({
                            edge: "0 0 3 0",
                            childNodes: [
                                new apf.label({
                                    width: 14,
                                    caption: "S:",
                                    "for": this.id + "_saturation"
                                }),
                                new apf.spinner({
                                    id: this.id + "_saturation",
                                    skin: this["skin-spinner"],
                                    realtime: true,
                                    width: 45,
                                    min: 0,
                                    max: 100,
                                    value: "{" + this.id + ".saturation}",
                                    onafterchange: spinnerChange
                                })
                            ]
                        }),
                        new apf.hbox({
                            edge: "0 0 3 0",
                            childNodes: [
                                new apf.label({
                                    width: 14,
                                    caption: "B:",
                                    "for": this.id + "_brightness"
                                }),
                                new apf.spinner({
                                    id: this.id + "_brightness",
                                    skin: this["skin-spinner"],
                                    realtime: true,
                                    width: 45,
                                    min: 0,
                                    max: 100,
                                    value: "{" + this.id + ".brightness}",
                                    onafterchange: spinnerChange
                                })
                            ]
                        })
                    ]
                })
            ]
        });

        new apf.label({
            htmlNode: this.oInputs,
            skinset: skin,
            left: 212,
            top: 144,
            width: 14,
            caption: "#",
            "for": this.id + "_hex"
        });

        this.$input = new apf.textbox({
            htmlNode: this.oInputs,
            skinset: skin,
            skin: this["skin-textbox"],
            mask: "<XXXXXX;;_",
            left: 222,
            top: 140,
            width: 60,
            value: "{" + this.id + ".hex}",
            onafterchange: function(e) {
                _self.hex = c.fixHex(e.value);
                var hsb   = c.hexToHSB(_self.hex);
                _self.hue = hsb.h;
                _self.saturation = hsb.s;
                _self.brightness = hsb.b;
                _self.$change();
            }
        });
    };

    this.$destroy = function() {
        this.$ext = this.oSelector = this.oSelectorInd = this.oHue =
            this.oNewColor = this.oCustomColor = this.oInputs = null;
    };
// #ifdef __WITH_DATABINDING
}).call(apf.colorpicker.prototype = new apf.StandardBinding());
/* #else
}).call(apf.colorpicker.prototype = new apf.Presentation());
#endif */

apf.aml.setElement("colorpicker", apf.colorpicker);

// #endif
