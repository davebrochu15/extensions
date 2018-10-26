import Map from "api/map";
import { XY, BaseGeometry } from "api/geometry";
import { SimpleLayer } from "api/layers";
import { MapClickEvent } from "api/events";

/**
 * All extensions must derive from this class. Not intented to be instantiated on its own.
 */
export abstract class Extension {

    protected _url: string;
    protected _name: string;
    protected _layer: SimpleLayer;

    constructor(name: string, url: string) {
        this._url = url;
        this._name = name;
        this._layer = null;
    }

    /**
     * Return the extension's name
     * @return The extension's name
     */
    get name(): string {
        return this._name;
    }

    /**
     * Return the url of the endpoind
     * @return The endpoind's url
     */
    get url(): string {
        return this.url;
    }

    /**
     * Get the extension's attributes
     * @return the extension's attributes
     */
    get attributes(): any[] {
        return this._layer.getAttributes();
    }

    /**
     * Get the extension's geometries
     * @return the extension's geometries
     */
    get geometries(): any[] {
        return this._layer.geometry;
    }

    /**
     * Set the extension's layer
     */
    set layer(layer: SimpleLayer) {
        this._layer = layer;
    }

    /**
     * Set the layer attributes and returns geometries after parsing a JSON file
     * @param xy - The position XY on map
     * @return geometries The extension's geometries
     */
    public async fetch(point?: XY): Promise<BaseGeometry> {
        const json: any = await this.getJSON(point);
        this.setAttributes([json.properties]);
        const geometries: BaseGeometry = this.parse(json);
        return geometries;
    }

    /**
     * Set the extension layer's geometries 
     * @param geometries - The geometries to add
     */
    public setGeometries(geometries: BaseGeometry): void {

        // If the layer has geometries, remove them
        if(this._layer.geometry && this._layer.geometry.length !== 0) {
            this._layer.removeGeometry();
        }

        this._layer.addGeometry(geometries);
    }

    /**
     * Set the extension layer's attributes
     * @param attrs - The attributes to add
     */
    public setAttributes(attrs: any[]): void {
        if(!this._layer) {
            throw new Error("The extension's layer is null");
        }

        this._layer._attributeArray = attrs; 
    }

    /**
     * Get the display style of the geometries
     * @return The render stryle
     */
    public abstract renderStyleGeometries(): RenderStyle;

    /**
     * Return the JSON response of the endpoind
     * @param point - The selected point
     * @return The JSON data
     */
    protected abstract async getJSON(point?: XY): Promise<Object>;

    /**
     * Parse the json to create geometries
     * @param json - The json data
     * @return The geometries created 
     */
    protected abstract parse(json: any): BaseGeometry;

    /**
     * Call needed action from click event
     */
    public abstract async actionBtn(map: Map): Promise<void>;

    public abstract async actionMap(map: Map, mapClickEvent: MapClickEvent): Promise<void>;

}

// interface for geometries style
export interface RenderStyle {
    outlineWidth: number;
    fillColor: string;
    fillOpacity: number;
}