import { Extension } from "../manageExtension/Extension";
import { CHyFExtension } from "./CHyFExtension";
import { ExtensionsManager } from "../manageExtension/ExtensionsManager";
import Map from "api/map";

/**
 * Global object called by the "rz-extensions".
 * The fonction "init" contain the global map instance "api"
 */
(<any>window).chyf = {
    init: function(api: Map) {
        const manageExtension: ExtensionsManager = new ExtensionsManager(api, "CHyF");
        const flowpathUpstream: Extension = new CHyFExtension(api, "Flowpath Upstream", "http://dev.geogratis.gc.ca:8012/chyf/eflowpath/upstreamOf.json");
        const flowpathDownstream: Extension = new CHyFExtension(api, "Flowpath Downstream", "http://dev.geogratis.gc.ca:8012/chyf/eflowpath/downstreamOf.json");
        const upstream: Extension = new CHyFExtension(api, "Upstream","http://dev.geogratis.gc.ca:8012/chyf/drainageArea/upstreamOf.json");
        const downstream: Extension = new CHyFExtension(api, "Downstream","http://dev.geogratis.gc.ca:8012/chyf/drainageArea/downstreamOf.json");

        manageExtension.addHTMLComponent(`<div class="list-extensions">Remove Holes: <input id="removeHoles" type="checkbox" value="holes"></div>`);
        manageExtension.addExtensions([upstream, downstream, flowpathUpstream, flowpathDownstream]);
    }
};

