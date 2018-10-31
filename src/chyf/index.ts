import { Extension } from "../manageExtension/Extension";
import { CHyFExtension } from "./CHyFExtension";
import { ManageExtension } from "../manageExtension/ManageExtension";
import Map from "api/map";

/**
 * Global object called by the "rz-extensions".
 * The fonction "init" contain the global map instance "api"
 */
(<any>window).myExtension = {
    init: function(api: Map) {
        const manageExtension: ManageExtension = new ManageExtension(api, "CHyF");
        const upstream: Extension = new CHyFExtension("upstream",`http://dev.geogratis.gc.ca:8012/chyf/drainageArea/upstreamOf.json`);
        const downstream: Extension = new CHyFExtension("downstream",`http://dev.geogratis.gc.ca:8012/chyf/drainageArea/downstreamOf.json`);

        manageExtension.addExtensions([upstream, downstream]);
    }
};

