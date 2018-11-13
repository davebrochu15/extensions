import { Extension } from "./Extension";
import { MapClickEvent } from "api/events";
import { Map } from "api/map";
import { SimpleLayer } from "api/layers";

const PANEL_EXTENSION = "panel-extensions";

/**
 * The extensions manager allows to create the HTML component of the extensions and bind the events on buttons and map
 */
export class ExtensionsManager {

    private _map: Map;
    private _name: String;
    private _extensions: Extension[];
    private _selectedExtension: Extension;

    public constructor(api: Map, name: string) {
        
        // Remove space in the name   
        this._name = name.replace(/\s/g, '');
        this._map = api;
        this._extensions = [];
        this._selectedExtension = null;
        this.init(); 
    }

    /**
     * Initialise the events on buttons and map and create the HTML base extension component.
     */
    private init(): void{
        this.createHTMLBaseComponent();
        this.manageClickEventMap();
    }

    /**
     * Create the HTML extensions base component.
     */
    private createHTMLBaseComponent(): void {

        if ( $("ul.rv-legend-level-0").length ) {
            // Create the HTML base for the extensions
            $("ul.rv-legend-level-0").after(
                `<div class="ng-isolate-scope border-top">
                    <div class="main-appbar rv-whiteframe-z2">
                        <h2 class="md-headline title-extensions ng-scope">${this._name}</h2>
                    </div>
                </div>
                
                <ul class="${PANEL_EXTENSION}"></ul>
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
        
            this.addHTMLButton(extension);

            // Create a layer from the button
            const layer: SimpleLayer[] = await this._map.layers.addLayer(extension.name);
            extension.layer = layer[0];

            // Manage click event on extension
            $(`#${extension.name}`).click( async () => {
                await this.manageClickEventBtn(extension);
            });
        }); 
    }

    /**
     * Add a button to the base component
     * @param name - The extension's name
     */
    private addHTMLButton(extension: Extension) {
        $(`ul.${PANEL_EXTENSION}`).first().append(`
            <li>
                ${extension.HTMLElement}
            </li>
        `);
    }

    /**
     * Manage the click event on an extension
     * @param extension - The clicked extension
     */
    private async manageClickEventBtn(extension: Extension): Promise<void> {

        if(extension === this._selectedExtension) {
            this.deselectAll();
        } else {
            // Need to deselect every buttons when we select a new button for remove unwanted state
            this.deselectAll();
            this._selectedExtension = extension;
            $(`#${extension.name}`).css("background-color", "#ECECEC");
            // Extension-specific actions
            await extension.actionBtn(this._map);
        }
    }

    /**
     * Remove selected state and style for every buttons
     */
    private deselectAll(): void {
        const extensionsBaseHTMLElement = $(`ul.${PANEL_EXTENSION}`).first();
        const liArray: Element[] = Array.from(extensionsBaseHTMLElement[0].children); 
        liArray.forEach( (li: Element) =>  {
            li.children[0].removeAttribute("style");
        });

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
                
                // Allows to not open the details panel and to not change the opacity of the layer
                $($(".rv-esri-map")[0]).removeClass("rv-map-highlight");
                this._map.ui.panels.byId("main").open();
                
                if (!this._selectedExtension.persist()) {
                    this.deselectAll();
                }
            }
        });
    }

    /**
     * Add a component in the extensions menu
     * @param component - The component to add
     */
    public addHTMLComponent(component: string): void {
        $(`ul.${PANEL_EXTENSION}`).first().append(`<li>${component}</li>`);
    }

}

