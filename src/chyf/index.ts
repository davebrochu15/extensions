import { Extension } from "../manageExtension/Extension";
import { CHyFExtension } from "./CHyFExtension";
import { ExtensionsManager } from "../manageExtension/ExtensionsManager";
import Map from "api/map";

/**
 * Global object called by the "rz-extensions".
 * The fonction "init" contain the global map instance "api"
 */
(<any>window).myExtension = {
    init: function(api: Map) {
        const manageExtension: ExtensionsManager = new ExtensionsManager(api, "CHyF");
        const upstream: Extension = new CHyFExtension("upstream",`http://dev.geogratis.gc.ca:8012/chyf/drainageArea/upstreamOf.json`);
        const downstream: Extension = new CHyFExtension("downstream",`http://dev.geogratis.gc.ca:8012/chyf/drainageArea/downstreamOf.json`);

        manageExtension.addExtensions([upstream, downstream]);
    }
};

