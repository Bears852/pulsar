"use strict";

const fineHeight = 4000;
const fineNumAnchor = 100;
const fineNumImage = 20;

let __utils__ = function () {};

/**
 * @param maxRound The maximum round to check ready
 * @param scroll The count to scroll down
 * */
__utils__.waitForReady = function(maxRound = 30, scroll = 2) {
    // A document is ready when the major html is downloaded
    // and all sub resources(images, css, js) are also downloaded
    if (document.readyState === "loading") {
        return false
    }

    if (!document.pulsarData) {
        // initialization
        __utils__.createPulsarDataIfAbsent();
        __utils__.updatePulsarStat(true);
    }

    let status = document.pulsarData.status;
    status.n += 1;

    // start count down latch
    if (maxRound > 0 && status.n > maxRound) {
        return "timeout"
    }

    if (status.scroll < scroll) {
        window.scrollBy(0, 500);
        status.scroll += 1;
    }

    let ready = __utils__.isActuallyReady();
    if (!ready) {
        return false
    }

    // The document is ready
    return JSON.stringify(document.pulsarData.status)
};

/**
 * @param selector The selector to click
 * @param sourceLocation The source location
 * @param maxRound The maximum round to check ready
 * */
__utils__.navigateTo = function(selector, sourceLocation, maxRound = 30) {
    if (window.location !== sourceLocation) {
        window.stop();
        return window.location
    }
    return false
};

__utils__.createPulsarDataIfAbsent = function() {
    if (!document.pulsarData) {
        document.pulsarData = {
            status: { n: 0, scroll: 0, idl: 0, st: "", r: "" },
            initStat: null,
            lastStat: {w: 0, h: 0, na: 0, ni: 0, nst: 0, nnm: 0},
            lastD:    {w: 0, h: 0, na: 0, ni: 0, nst: 0, nnm: 0},
            initD:    {w: 0, h: 0, na: 0, ni: 0, nst: 0, nnm: 0}
        };
    }
};

__utils__.writePulsarData = function() {
    if (!document.body) {
        return false
    }

    let script = document.getElementById(SCRIPT_SECTION_ID);
    if (script != null) {
        return
    }

    script = document.createElement('script');
    script.id = SCRIPT_SECTION_ID;
    script.type = 'text/javascript';

    let pulsarData = JSON.stringify(document.pulsarData, null, 3);
    script.textContent = "\n" + `;let pulsarData = ${pulsarData};\n`;

    document.body.appendChild(script);
};

/**
 * Check if the document is ready to analyze.
 * A document is hardly be perfect ready in time, since it's very common there are very slow sub resources to wait for.
 * */
__utils__.isActuallyReady = function() {
    // unexpected
    if (!document.body) {
        return false
    }

    __utils__.updatePulsarStat();

    if (!document.pulsarData) {
        return false
    }

    let ready = false;
    let status = document.pulsarData.status;
    let d = document.pulsarData.lastD;

    // all sub resources are loaded, the document is ready now
    if (status.st === "c") {
        // assert(document.readyState === "complete")
        status.r = "st";
        ready = true
    }

    // The DOM is very good for analysis, no wait for more information
    let stat = document.pulsarData.lastStat;
    if (status.n > 20 && stat.h >= fineHeight && stat.na >= fineNumAnchor && stat.ni >= fineNumImage) {
        if (d.h < 10 && d.na === 0 && d.ni === 0 && d.nst === 0 && d.nnm === 0) {
            // DOM changed since last check, store the latest stat and return false to wait for the next check
            ++status.idl;
            if (status.idl > 10) {
                // idle for 10 seconds
                status.r = "ct";
                ready = true;
            }
        }
    }

    return ready;
};

__utils__.isIdle = function(init = false) {
    let idle = false;
    let status = document.pulsarData.status;
    let d = document.pulsarData.lastD;
    if (d.h < 10 && d.na === 0 && d.ni === 0 && d.nst === 0 && d.nnm === 0) {
        // DOM changed since last check, store the latest stat and return false to wait for the next check
        ++status.idl;
        if (status.idl > 5) {
            // idle for 10 seconds
            idle = true;
        }
    }
    return idle
};

/**
 * @return {Object}
 * */
__utils__.updatePulsarStat = function(init = false) {
    const config = PULSAR_CONFIGS;
    const viewPortWidth = config.viewPortWidth;
    const viewPortHeight = config.viewPortHeight;
    const maxWidth = 1.2 * viewPortWidth;
    const fineWidth = 300;

    let width = 0;
    let height = 0;
    let na = 0;  // anchor
    let ni = 0;  // image
    let nst = 0; // short text in first screen
    let nnm = 0; // number like text in first screen

    document.body.forEach((node) => {
        if (node.isIFrame()) {
            return
        }

        if (node.isAnchor()) ++na;
        if (node.isImage() && !node.isSmallImage()) ++ni;

        if (node.isText() && node.nScreen() <= 20) {
            let isShortText = node.isShortText();
            let isNumberLike = isShortText && node.isNumberLike();
            if (isShortText) {
                ++nst;
                if (isNumberLike) {
                    ++nnm;
                }

                let ele = node.bestElement();
                if (ele != null && !init && !ele.hasAttribute("_ps_tp")) {
                    // not set at initialization, it's lazy loaded
                    ele.setAttribute("_ps_lazy", "1")
                }

                let type = isNumberLike ? "nm" : "st";
                ele.setAttribute("_ps_tp", type);
            }
        }

        if (node.isDiv() && node.scrollWidth > width && node.scrollWidth < maxWidth) width = node.scrollWidth;
        if (node.isDiv() && node.scrollWidth >= fineWidth && node.scrollHeight > height) height = node.scrollHeight;
    });

    // unexpected but occurs when do performance test to parallel harvest Web sites
    if (!document.pulsarData) {
        return
    }

    let initStat = document.pulsarData.initStat;
    if (!initStat) {
        initStat = { w: width, h: height, na: na, ni: ni, nst: nst, nnm: nnm };
        document.pulsarData.initStat = initStat
    }
    let lastStat = document.pulsarData.lastStat;
    let lastStatus = document.pulsarData.status;
    let state = document.readyState.substr(0, 1);
    let data = {
        status: {n: lastStatus.n, scroll: lastStatus.scroll, idl: lastStatus.idl, st: state, r: lastStatus.r},
        lastStat: {w: width, h: height, na: na, ni: ni, nst: nst, nnm: nnm},
        // changes from last round
        lastD: {
            w: width - lastStat.w,
            h: height - lastStat.h,
            na: na - lastStat.na,
            ni: ni - lastStat.ni,
            nst: nst - lastStat.nst,
            nnm: nnm - lastStat.nnm
        },
        // changes from the initialization
        initD: {
            w: width - initStat.w,
            h: height - initStat.h,
            na: na - initStat.na,
            ni: ni - initStat.ni,
            nst: nst - initStat.nst,
            nnm: nnm - initStat.nnm
        }
    };

    document.pulsarData = Object.assign(document.pulsarData, data)
};

__utils__.scrollToBottom = function() {
    if (!document || !document.documentElement || !document.body) {
        return
    }

    let x = 0;
    let y = Math.max(
        document.documentElement.scrollHeight,
        document.documentElement.clientHeight,
        document.body.scrollHeight
    );

    window.scrollTo(x, Math.min(y, 15000))
};

__utils__.scrollToTop = function() {
    window.scrollTo(0, 0)
};

__utils__.scrollDownN = function(scrollCount = 5) {
    if (!document.pulsarData) {
        // TODO: this occurs when do performance test, but the reason is not investigated
        return false
    }

    let status = document.pulsarData.status;

    window.scrollBy(0, 500);
    status.scroll += 1;

    return status.scroll >= scrollCount
};

/**
 * Clones an object.
 *
 * @param  {Object} o
 * @return {Object}
 */
__utils__.clone = function(o) {
    return JSON.parse(JSON.stringify(o))
};

/**
 * Get attribute as an integer
 * @param node {Element}
 * @param attrName {String}
 * @param defaultValue {Number}
 * @return {Number}
 * */
__utils__.getIntAttribute = function(node, attrName, defaultValue) {
    if (!defaultValue) {
        defaultValue = 0;
    }

    let value = node.getAttribute(attrName);
    if (!value) {
        return defaultValue;
    }

    return parseInt(value);
};

/**
 * Increase the attribute value as if it's an integer
 * @param node {Element}
 * @param attrName {String}
 * @param add {Number}
 * */
__utils__.increaseIntAttribute = function(node, attrName, add) {
    let value = node.getAttribute(attrName);
    if (!value) {
        value = '0';
    }

    value = parseInt(value) + add;
    node.setAttribute(attrName, value)
};

/**
 * Get attribute as an integer
 * */
__utils__.getReadableNodeName = function(node) {
    let name = node.tagName
        + (node.id ? ("#" + node.id) : "")
        + (node.className ? ("#" + node.className) : "");

    let seq = this.getIntAttribute(node, "_seq", -1);
    if (seq >= 0) {
        name += "-" + seq;
    }

    return name;
};

/**
 * Clean node's textContent
 * @param textContent {String} the string to clean
 * @return {String} The clean string
 * */
__utils__.getCleanTextContent = function(textContent) {
    // all control characters
    // @see http://www.asciima.com/
    textContent = textContent.replace(/[\x00-\x1f]/g, " ");

    // combine all blanks into one " " character
    textContent = textContent.replace(/\s+/g, " ");

    return textContent.trim();
};

/**
 * Get clean, merged textContent from node list
 * @param nodeOrList {NodeList|Array|Node} the node from which we extract the content
 * @return {String} The clean string, "" if no text content available.
 * */
__utils__.getMergedTextContent = function(nodeOrList) {
    if (!nodeOrList) {
        return "";
    }

    if (nodeOrList instanceof  Node) {
        return this.getTextContent(nodeOrList);
    }

    let content = "";
    for (let i = 0; i < nodeOrList.length; ++i) {
        if (i > 0) {
            content += " ";
        }
        content += this.getTextContent(nodeOrList[i]);
    }

    return content;
};

/**
 * Get clean node's textContent
 * @param node {Node} the node from which we extract the content
 * @return {String} The clean string, "" if no text content available.
 * */
__utils__.getTextContent = function(node) {
    if (!node || !node.textContent || node.textContent.length === 0) {
        return "";
    }

    return this.getCleanTextContent(node.textContent);
};

/**
 * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
 *
 * @param {String} text The text to be rendered.
 * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
 *
 * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
 */
__utils__.getTextWidth = function(text, font) {
    // re-use canvas object for better performance
    let canvas = this.getTextWidth.canvas || (this.getTextWidth.canvas = document.createElement("canvas"));
    let context = canvas.getContext("2d");
    context.font = font;
    let metrics = context.measureText(text);

    return Math.round(metrics.width * 10) / 10
};

/**
 * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
 *
 * @param {String} text The text to be rendered.
 * @param {HTMLElement} ele The container element.
 * */
__utils__.getElementTextWidth = function(text, ele) {
    let style = window.getComputedStyle(ele);
    let font = style.getPropertyValue('font-weight') + ' '
        + style.getPropertyValue('font-size') + ' '
        + style.getPropertyValue('font-family');

    return this.getTextWidth(text, font);
};

/**
 * Format rectangle
 * @param top {Number}
 * @param left {Number}
 * @param width {Number}
 * @param height {Number}
 * @return {String|Boolean}
 * */
__utils__.formatRect = function(top, left, width, height) {
    if (width === 0 && height === 0) {
        return false;
    }

    return ''
        + Math.round(top * 10) / 10 + ' '
        + Math.round(left * 10) / 10 + ' '
        + Math.round(width * 10) / 10 + ' '
        + Math.round(height * 10) / 10;
};

/**
 * Format a DOMRect object
 * @param rect {DOMRect}
 * @return {String|Boolean}
 * */
__utils__.formatDOMRect = function(rect) {
    if (!rect || (rect.width === 0 && rect.height === 0)) {
        return false;
    }

    return ''
        + Math.round(rect.left * 10) / 10 + ' '
        + Math.round(rect.top * 10) / 10 + ' '
        + Math.round(rect.width * 10) / 10 + ' '
        + Math.round(rect.height * 10) / 10;
};

/**
 * The result is the smallest rectangle which contains the entire element, including the padding, border and margin.
 *
 * @param node {Node|Element|Text}
 * @return {DOMRect|Boolean}
 * */
__utils__.getClientRect = function(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        return this.getTextNodeClientRect(node)
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        return this.getElementClientRect(node)
    } else {
        return null
    }
};

/**
 * The computed style.
 *
 * @param node {Node|Element|Text}
 * @param propertyNames {Array}
 * @return {Object|Boolean}
 * */
__utils__.getComputedStyle = function(node, propertyNames) {
    if (node.nodeType === Node.ELEMENT_NODE) {
        let styles = {};
        let computedStyle = window.getComputedStyle(node, null);
        propertyNames.forEach(propertyName =>
            styles[propertyName] = __utils__.getPropertyValue(computedStyle, propertyName)
        );
        return styles
    } else {
        return null
    }
};

/**
 * Get a simplified property value of computed style.
 *
 * @param style {CSSStyleDeclaration}
 * @param propertyName {String}
 * @return {String}
 * */
__utils__.getPropertyValue = function(style, propertyName) {
    let value = style.getPropertyValue(propertyName);

    if (!value || value === '') {
        return ''
    }

    if (propertyName === 'font-size') {
        value = value.substring(0, value.lastIndexOf('px'))
    } else if (propertyName === 'color' || propertyName === 'background-color') {
        value = __utils__.shortenHex(__utils__.rgb2hex(value));
        // skip prefix '#'
        value = value.substring(1)
    }

    return value
};

/**
 * Color rgb(a) format to hex
 *
 * rgb(255, 255, 0) -> #
 *
 * @param rgb {String}
 * @return {String}
 * */
__utils__.rgb2hex = function(rgb) {
    let parts = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return (parts && parts.length === 4) ? "#" +
        ("0" + parseInt(parts[1],10).toString(16)).slice(-2) +
        ("0" + parseInt(parts[2],10).toString(16)).slice(-2) +
        ("0" + parseInt(parts[3],10).toString(16)).slice(-2) : '';
};

/**
 * CSS Hex to Shorthand Hex conversion
 * @param hex {String}
 * @return {String}
 * */
__utils__.shortenHex = function(hex) {
    if ((hex.charAt(1) === hex.charAt(2))
        && (hex.charAt(3) === hex.charAt(4))
        && (hex.charAt(5) === hex.charAt(6))) {
        hex = "#" + hex.charAt(1) + hex.charAt(3) + hex.charAt(5);
    }

    // the most simple case: all chars are the same
    if (hex.length === 4) {
        let c = hex.charAt(1);
        if (hex.charAt(2) === c && hex.charAt(3) === c) {
            return '#' + c
        }
    }

    return hex
};

/**
 * Add to attribute
 *
 * @param node {Node|Element|Text}
 * @param attributeName {String}
 * @param key {String}
 * @param value {Object}
 * */
__utils__.addTuple = function(node, attributeName, key, value) {
    let attributeValue = node.getAttribute(attributeName) || "";
    if (attributeValue.length > 0) {
        attributeValue += " "
    }
    attributeValue += key + ":" + value.toString();
    node.setAttribute(attributeName, attributeValue);
};

/**
 * The result is the smallest rectangle which contains the entire element, including the padding, border and margin.
 *
 * Properties other than width and height are relative to the top-left of the viewport.
 *
 * @see https://idiallo.com/javascript/element-postion
 * @see https://stackoverflow.com/questions/442404/retrieve-the-position-x-y-of-an-html-element
 *
 * @param ele {Node|Element}
 * @return {DOMRect|Boolean}
 * */
__utils__.getElementClientRect = function(ele) {
    let bodyRect = this.bodyRect || (this.bodyRect = document.body.getBoundingClientRect());
    let r = ele.getBoundingClientRect();

    if (r.width <= 0 || r.height <= 0) {
        return false
    }

    let top = r.top - bodyRect.top;
    let left = r.left - bodyRect.left;

    return new DOMRect(left, top, r.width, r.height);
};

/**
 * Get the client rect of a text node
 *
 * @param node {Node|Text}
 * @return {DOMRect|null}
 * */
__utils__.getTextNodeClientRect = function(node) {
    let bodyRect = this.bodyRect || (this.bodyRect = document.body.getBoundingClientRect());

    let rect = null;
    let text = this.getTextContent(node);
    if (text.length > 0) {
        let range = document.createRange();
        range.selectNodeContents(node);
        let rects = range.getClientRects();
        if (rects.length > 0) {
            let r = rects[0];
            if (r.width > 0 && r.height > 0) {
                let top = r.top - bodyRect.top;
                let left = r.left - bodyRect.left;
                rect = new DOMRect(left, top, r.width, r.height);
            }
        }
    }

    return rect;
};

/**
 * Generate meta data
 *
 * MetaInformation version :
 * 0.2.2 :
 * */
__utils__.generateMetadata = function() {
    let meta = document.getElementById(META_INFORMATION_ID);
    if (meta != null) {
        // already generated
        return
    }

    let config = PULSAR_CONFIGS || {};

    document.body.setAttribute("data-url", document.URL);
    let date = new Date();

    let ele = document.createElement("input");
    ele.setAttribute("type", "hidden");
    ele.setAttribute("id", META_INFORMATION_ID);
    ele.setAttribute("domain", document.domain);
    ele.setAttribute("version", DATA_VERSION);
    ele.setAttribute("url", document.URL);
    ele.setAttribute("base-uri", document.baseURI);
    ele.setAttribute("view-port", config.viewPortWidth + "x" + config.viewPortHeight);
    ele.setAttribute("code-structure", CODE_STRUCTURE_SCHEMA_STRING);
    ele.setAttribute("vision-schema", VISION_SCHEMA_STRING);
    ele.setAttribute("date-time", date.toLocaleDateString() + " " + date.toLocaleTimeString());
    ele.setAttribute("timestamp", date.getTime().toString());

    if (config.version !== DATA_VERSION) {
        ele.setAttribute("version-mismatch", config.version + "-" + DATA_VERSION);
    }

    document.body.appendChild(ele);
};

/**
 * Calculate visualization info and do human actions
 * */
__utils__.visualizeHumanize = function() {
    if (!document.body || !document.body.firstChild) {
        return
    }

    const DATA_ERROR = "data-error";

    let done = document.body.hasAttribute(DATA_ERROR);
    if (done) {
        return
    }

    // __utils__.scrollToBottom();
    __utils__.scrollToTop();

    window.stop();

    __utils__.updatePulsarStat();
    __utils__.writePulsarData();

    // do something like a human being
    // humanize(document.body);

    document.body.forEachElement(ele => {
        ele.removeAttribute("_ps_tp")
    });

    // traverse the DOM and compute necessary data, we must compute data before we perform humanization
    new PlatonNodeTraversor(new NodeFeatureCalculator()).traverse(document.body);

    __utils__.generateMetadata();

    // if any script error occurs, the flag can NOT be seen
    document.body.setAttribute(DATA_ERROR, '0');

    window.stop();
};
