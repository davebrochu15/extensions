import { expect } from "chai";
import { CHyFExtension } from "../chyf/CHyFExtension";
import { BaseGeometry, XY, Point, Polygon } from "api/geometry";
import { Extension } from "./Extension";
import { SimpleLayer } from "api/layers";


describe("Extension class tests", () => {

    /**
     * IMPORTANT - For test purposes, you must remove the "RZ.GEO" in the corresponding files
     * ex: RZ.GEO.Polygon -> Polygon
     * This is because the variable RZ is a window variable from the FGPV-VPGF
     */

    const URL = "http://dev.geogratis.gc.ca:8012/chyf/";
    let _extension: Extension;
    let _layer: SimpleLayer;

    before( () => {

        // @ts-ignore - Mock layer
        _layer = {
            _attributeArray: [],
            _geometryArray: [],
            addGeometry: function(geo: BaseGeometry) {
                this._geometryArray.push(geo);
            },
            get geometry() {
                return this._geometryArray;
            },
            getAttributes: function() {
                return this._attributeArray;
            },
            removeGeometry: function() {
                this._geometryArray = [];
            }
        }

        _extension = new CHyFExtension("extension",`${URL}/drainageArea/upstreamOf.json`);
        _extension.layer = _layer;
        
    });
    

    describe("fetch", async () => {

        it("should return a polygon", async () => {  
            const point: XY = new XY(-73.2480812072754,45.82245932513635);
            const geometries: BaseGeometry = await _extension.fetch(point);
            expect(geometries.type).to.equal("Polygon");
        });

        it("should have attributes", async () => {
            const point: XY = new XY(-73.2480812072754,45.82245932513635);
            await _extension.fetch(point);
            expect(_extension.attributes).to.not.be.null;
        });

        it("should throw a error if the layer is null or undefined", () => {
            const extension = new CHyFExtension("extension",`${URL}/drainageArea/upstreamOf.json`);
            const point: XY = new XY(-73.2480812072754,45.82245932513635);
            expect( async () => await extension.fetch(point) ).to.throw;
        });

        it("should throw a error if the address is wrong", async () => {
            const extension = new CHyFExtension("extension",`${URL}/drainageArea/upstreamOf.json`);
            extension.layer = _layer;
            const point: XY = new XY(-73.2480812072754,45.82245932513635);
            expect( async () => await extension.fetch(point) ).to.throw;
        });

    });

    describe("setGeometries", () => {

        it("should remove the old geometries and add the news", async () => {
            const point1: Point = new Point(0, new XY(45,65));
            const polygon1: Polygon = new Polygon(1, [point1]);
            const point2: Point = new Point(2, new XY(40,60));
            const polygon2: Polygon = new Polygon(3, [point2]);
            
            _extension.geometries = [polygon1, polygon2];

            const point3: Point = new Point(4, new XY(35,55));
            const polygon3: Polygon = new Polygon(6, [point3]);
            _extension.geometries = [polygon3];

            expect(_extension.geometries.length).to.equal(1);
            expect(_extension.geometries[0][0]._id).to.equal('6');
            
        });

    });

});