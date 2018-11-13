import { expect } from "chai";
import { CHyFExtension, ResponseChyfJSON } from "../chyf/CHyFExtension";
import { BaseGeometry, XY, Polygon, MultiPolygon } from "api/geometry";
import { SimpleLayer } from 'api/layers';
import { Extension } from "../manageExtension/Extension";


describe("Extension class tests", () => {

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

        _extension = new CHyFExtension(null, "extension",`${URL}/drainageArea/upstreamOf.json`);
        _extension.layer = _layer;
    })
    

    describe("getJSON", async () => {

        /*it("should return a json file", async () => {
            const point: XY = new XY(-73.2480812072754,45.82245932513635);
            const json: Object = await _extension.getJSON(point);
            expect(json).to.not.be.undefined;
        });*/

        /*it("should throw a error if the address is wrong", async () => {
            const extension = new CHyFExtension("extension",`${URL}/drainageArea/upstreamOf.json`);
            extension.layer = _layer;
            const point: XY = new XY(-73.2480812072754,45.82245932513635);
            expect( async () => await extension.getJSON(point)).to.throw;
        });*/

    });

    describe("parse", async () => {

        it("should return a valid polygon", async () => {  
            const json: ResponseChyfJSON = {
                "ID": 1,
                "geometry":{
                    "type":"Polygon",
                    "coordinates":[
                        [
                            [-73.13263,46.0267],[-73.13267,46.02665],[-73.13278,46.02646]
                        ]
                    ]},
                "properties":{"area":56.09}
            }
            // @ts-ignores
            const geometries: Polygon = _extension.parse(json);
            expect(geometries.ringArray[0]._pointArray[0]._xy).to.deep.equal({x: -73.13263, y: 46.0267 });
            expect(geometries.ringArray[0]._pointArray[2]._xy).to.deep.equal({x: -73.13278, y: 46.02646 });
            expect(geometries.type).to.equal("Polygon");
        });

        it("should return a valid multiPolygon", async () => {  
            const json: ResponseChyfJSON = {
                "ID": 1,
                "geometry":{
                    "type":"MultiPolygon",
                    "coordinates":[
                        [
                            [
                                [-73.13263,46.0267],[-73.13267,46.02665],[-73.13278,46.02646]
                            ]
                        ],
                        [
                            [
                                [-73.13263,46.0267],[-73.13267,46.02665],[-73.13278,46.02646]
                            ]
                        ]
                    ]},
                "properties":{"area":56.09}
            }
            // @ts-ignores
            const geometries: MultiPolygon = _extension.parse(json);
            expect(geometries.polygonArray[0].ringArray[0]._pointArray[0]._xy).to.deep.equal({x: -73.13263, y: 46.0267 });
            expect(geometries.polygonArray[1].ringArray[0]._pointArray[2]._xy).to.deep.equal({x: -73.13278, y: 46.02646 });
            expect(geometries.type).to.equal("MultiPolygon");
        });

        /*it("should throw a error if the json is invalid", () => {
            expect( () => _extension.parse({ data: "test" })).to.throw;
        });*/

    });

});