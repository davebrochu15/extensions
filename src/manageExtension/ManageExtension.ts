import { Extension } from "./Extension";
import { MapClickEvent } from "api/events";
import Map from "api/map";
import { SimpleLayer } from "api/layers";

export class ManageExtension {

    private static _instance: ManageExtension;
    private _map: Map;
    private _extensions: Extension[];
    private _selectedExtension: Extension;

    private constructor(api: Map) {
        this._map = api;
        this._extensions = [];
        this._selectedExtension = null;
        this.init(); 
    }

    /**
     * Get the instance of the class ManageExtension
     * @param api - The map instance
     * @return The class ManageExtension
     */
    public static getInstance(api: Map) {
        if(!this._instance) {
            //create a new instance
            this._instance = new this(api);
        } 
        return this._instance;
    }

    /**
     * Initialise the events on buttons and map and create the HTML base extension component.
     */
    private init(): void{
        this.createHTMLBaseComponent();
        this.manageClickEventMap();
    }

    /**
     * Create the HTML extension base component.
     */
    private createHTMLBaseComponent(): void {

        if ( $('ul.rv-legend-level-0').length ) {
            // Create the HTML base for the extensions
            $('ul.rv-legend-level-0').after(
                `<div class="ng-isolate-scope border-top">
                    <div class="main-appbar rv-whiteframe-z2">
                        <h2 class="md-headline title-extensions ng-scope">Extensions</h2>
                    </div>
                </div>
                
                <ul class="panel-extensions">
                </ul>
                `
            );
        }
    }

    /**
     * Add extensions to the manager
     * @param extensions - The extensions to add
     */
    public addExtensions(extensions: Extension[]): void {
        extensions.forEach( async (extension: Extension) => {
            this._extensions.push(extension);
        
            this.addHTMLButton(extension.name);

            // Create a layer from the button
            const layer: SimpleLayer[] = await this._map.layers.addLayer(extension.name);
            extension.layer = layer[0];

            // Manage click event on extension
            $(`#${extension.name}`).click( () => {
                this.manageClickEventBtn(extension);
            });
        }); 
    }

    /**
     * Add a button to the base component
     * @param name - The extension's name
     */
    private addHTMLButton(name: string) {
        $("ul.panel-extensions").append(`
            <li>
                <button id="${name}" >${name.charAt(0).toUpperCase() + name.slice(1)}</button>
            </li>
        `);
    }

    /**
     * Manage the click event on an extension
     * @param extension - The clicked extension
     */
    private manageClickEventBtn(extension: Extension): void {

        if(extension === this._selectedExtension) {
            this.deselectAll();
        } else {
            // Need to deselect every buttons when we select a new button for remove unwanted state
            this.deselectAll();
            this._selectedExtension = extension;
            $(`#${extension.name}`).css("background-color", "#ECECEC");
            // Extension-specific actions
            extension.actionBtn(this._map);
        }
    }

    /**
     * Remove selected state and style for every buttons
     */
    private deselectAll(): void {
        $("ul.panel-extensions > li > button").removeAttr("style");
        this._map.mapI.setMapCursor("default");
        this._selectedExtension = null;
    }

    /**
     * Manage the click events on the map
     */
    private manageClickEventMap(): void {
        this._map.click.subscribe( async (mapClickEvent: MapClickEvent) => {
            if( this._selectedExtension ) {

                // Extension-specific actions
                await this._selectedExtension.actionMap(this._map, mapClickEvent);

                // Close the details tab and refresh the map to display the geometry
                if ($("button[ng-click='self.closeDetails()']")[0]) {
                    $("button[ng-click='self.closeDetails()']")[0].click();
                }

                this.deselectAll();
            }
        });
    }

}

