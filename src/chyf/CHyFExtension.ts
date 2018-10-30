import { Map } from "api/map";
import { Extension, RenderStyle } from "../manageExtension/Extension";
import { XY, BaseGeometry, Polygon, MultiPolygon } from "api/geometry";
import Axios, { AxiosResponse } from "axios";
import { MapClickEvent } from "api/events";

/**
 * Hydraulic's extensions
 */
export class CHyFExtension extends Extension {

    constructor(name: string, url: string) {
        super(name, url);
    }

    public async getJSON(point: XY): Promise<Object> {
        try {
            const response: AxiosResponse = await Axios.get(`${this._url}?point=${point.x},${point.y}&removeHoles=false`)
            return response.data;
        } catch (error) {
            throw new Error("File not found");
        }
    }

    public parse(json: ResponseChyfJSON): BaseGeometry {
        let points:XY[] = [];
        let polygons: Polygon[] = [];

        try 
        {
            switch (json.geometry.type) {
                case "Polygon":
                    points.push(json.geometry.coordinates[0]);
                    return new Polygon(1000, points, this.renderStyleGeometries);
                case "MultiPolygon":
                    json.geometry.coordinates.forEach ( (coordinates: any[], index: number) => {
                        points.push(coordinates[0]);
                        polygons.push(new Polygon(1000+index, points, this.renderStyleGeometries));
                        points = [];
                    }); 
                    return new MultiPolygon(100000, polygons, this.renderStyleGeometries);
            }
        } catch (error) {
            throw new Error(`Cannot parse the data : ${error.message}`);
        }
    }

    public renderStyleGeometries(): RenderStyle {
        return {    
                    outlineWidth: 0,
                    fillColor: '#000000',
                    fillOpacity: 0.3
                };
    }

    public async actionBtn(map: Map): Promise<void> { 
            map.mapI.setMapCursor("crosshair");
    }

    public async actionMap(map: Map, mapClickEvent: MapClickEvent): Promise<void> {

        const geometries: BaseGeometry = await this.fetch(mapClickEvent.xy);
        this.geometries = [geometries];

        // Trigger the layer click event for display the enhancedTable
        // The enhancedTable rz-extension must be include
        map.layers._click.next(this._layer);
    }
}

export interface ResponseChyfJSON {
    ID: number,
    geometry: {
        type: string,
        coordinates: any
    },
    properties: {
        area?: number
    },
    responseMetadata?: {
        executionTime: number
    },
    type?: string
}