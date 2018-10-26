import { Map } from "api/map";
import { Extension, RenderStyle } from "../manageExtension/Extension";
import { XY, BaseGeometry, Polygon, MultiPolygon } from "api/geometry";
import { AxiosResponse,  } from "axios";
import { MapClickEvent } from "api/events";
const axios = require('axios');

/**
 * Hydraulic's extensions
 */
export class CHyFExtension extends Extension {

    constructor(name: string, url: string) {
        super(name, url);
    }

    protected async getJSON(point: XY): Promise<Object> {
        const response: AxiosResponse = await axios.get(`${this._url}?point=${point.x},${point.y}&removeHoles=false`)
        return response.data;
    }

    protected parse(json: ResponseJSON): BaseGeometry {
        let points: XY[] = [];
        let polygons: Polygon[] = [];

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
        this.setGeometries(geometries);

        // Trigger the layer click event for display the enhancedTable
        // The enhancedTable rz-extension must be include
        map.layers._click.next(this._layer);
    }
}

export interface ResponseJSON {
    ID: number,
    geometry: {
        type: string,
        coordinates: any
    },
    properties: {
        area?: number
    },
    responseMetadata: {
        executionTime: number
    },
    type: string
}