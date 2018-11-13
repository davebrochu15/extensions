import { Map } from "api/map";
import { Extension, RenderStyle } from "../manageExtension/Extension";
import { BaseGeometry } from "api/geometry";
import { MapClickEvent } from "api/events";
import { Feature } from "../manageExtension/Feature";
import { Panel } from "api/panel";
import { SimpleLayer } from "api/layers";
import { geoconnexService, CatchmentsProperties, LinkedDataObj } from "../service/GeoconnexService";
import { GeojsonUtils } from "../util/GeojsonUtils";

const LINKED_DATA_PANEL: string = "linkedDataPanel"
const INFO_PANEL: string = "infoPanel";

/**
 * Geoconnex extensions
 */
export class GeoconnexExtension extends Extension {

    private _features: Feature<CatchmentsProperties>[];
    private _layerLinkedData: SimpleLayer;

    constructor(map: Map, name: string, url: string) {
        super(map, name, url);
        this._layerLinkedData = null;
    }

    public renderStyleGeometries(): RenderStyle {
        return {    
                    outlineWidth: 0,
                    fillColor: '#000000',
                    fillOpacity: 0.3
                };
    }

    public persist(): boolean {
        return true;
    }

    public async actionBtn(map: Map): Promise<void> { 
        this._features = await geoconnexService.getFeaturesFromCatchments(this._url);
        const geometries: BaseGeometry[] = GeojsonUtils.convertFeaturesToGeometries(this._features, this.renderStyleGeometries());
        this.geometries = geometries;
    }

    public async actionMap(map: Map, mapClickEvent: MapClickEvent): Promise<void> {

        // Get the geometry from a point
        const geometry: BaseGeometry =  GeojsonUtils.clickGeometry(mapClickEvent.xy, this._features, this.geometries);
        
        if(geometry) {
            const feature: Feature<CatchmentsProperties> = GeojsonUtils.convertGeometryToFeature(geometry, this._features);
            await this.manageInfoPanel(map, feature);
        }
        
    }

    /**
     * Manage the info panel
     * @param map - The map
     * @param feature - The feature of the geometry
     */
    private async manageInfoPanel(map: Map, feature: Feature<CatchmentsProperties>): Promise<void> {
        
        let infoPanel: Panel = this.getPanel(INFO_PANEL);
        
        // If it doesn't exit, create it
        if(!infoPanel) {
            infoPanel = this.createInfoPanel();
        }

        // Set the informations
        infoPanel.content = new infoPanel.container(
            `
                <div>${feature.properties.name} 
                ${this.createHTMLButton("linked", feature.properties.uri)}
            `
        );

        // Manage the click event on the linked button
        $(`#${INFO_PANEL}`).find("button").on("click", (event: any) => {
            const uri: string = event.currentTarget.getAttribute("featureuri")
            this.manageLinkedDataPanel(map, uri);
        });
        
        // Close the Linked data panel
        let linkedDataPanel: Panel = this.getPanel(LINKED_DATA_PANEL);
        if(linkedDataPanel) {
            linkedDataPanel.close();
        }
        
        infoPanel.open();

    }

    /**
     * Manage the linked data panel
     * @param map - The map
     * @param url - The url of the linked data
     */
    private async manageLinkedDataPanel(map: Map, url: string): Promise<void> {

        let linkedDataPanel: Panel = this.getPanel(LINKED_DATA_PANEL);
        
        // If it doesn't exit, create it
        if(!linkedDataPanel) {
            linkedDataPanel = this.createLinkedDataPanel();

            // Create a layer for the linked geometries
            const layer: SimpleLayer[] = await map.layers.addLayer("LinkedData");
            this._layerLinkedData = layer[0];
        }

        // Get the linked data objects
        const linkedDataObjs: LinkedDataObj[] = await geoconnexService.getLinkedDataObjs(url);

        // Convert the objects to a HTML list
        const html: string = this.createLinkedDataHTML(linkedDataObjs);  
        linkedDataPanel.content = new linkedDataPanel.container(html);

        // Manage the click event from buttons
        $(`#${LINKED_DATA_PANEL}`).find("li").find("button").on("click", async (event: any) => {

            let uri: string = "";

            // If it is geometries to show
            uri = event.currentTarget.getAttribute("geojson")
            if(uri) {
                this.manageclickEventGeoBouton(uri);
            }

            // If it is linked data
            uri = event.currentTarget.getAttribute("featureuri")
            if(uri) {
                this.manageLinkedDataPanel(map, uri);
            }
        });

        linkedDataPanel.open();
        this.getPanel(INFO_PANEL).close();
    }

    /**
     * Create the HTML structure and list for the linked data panel from linked data objects
     * @param linkedDataObjs - The objects to convert
     */
    private createLinkedDataHTML(linkedDataObjs: LinkedDataObj[]): string {
        let listItemsHTML: string = "";
        linkedDataObjs.forEach( (obj: LinkedDataObj, index: number) => {

            // The first element represent the catchment itself
            if(index===0) {return;}

            listItemsHTML += `<li>`;
            listItemsHTML += `<strong>${obj.type}: </strong>`;
            listItemsHTML += `${obj.name}`;

            listItemsHTML += this.createHTMLButton("linked",obj.uri);
            listItemsHTML += this.createHTMLButton("html",obj.uri);
            obj.dataUris.forEach( (uri: string) => {
                listItemsHTML += this.createHTMLButton("geo", uri);
                ;
            });

            listItemsHTML += `</li>`;
        });

        const html: string = `
            <div>
                ${linkedDataObjs[0].name}
                <hr>
                <ul>
                    ${listItemsHTML}
                </ul>
            </div>
        `;

        return html;
    }

    /**
     * Create the info panel
     */
    private createInfoPanel(): Panel {

        const infoPanel: Panel = this.addPanel(INFO_PANEL);

        infoPanel.panelContents.css({
            left: "410px",
            right: "0px",
            overflow: "auto"
        });

        let closeBtn = new infoPanel.button('X');
        closeBtn.element.css('float', 'right');
        infoPanel.controls = [closeBtn];

        return infoPanel;
    }

    /**
     * Create the linked data panel
     */
    private createLinkedDataPanel(): Panel {
        const linkedDataPanel: Panel = this.addPanel(LINKED_DATA_PANEL);

        linkedDataPanel.panelContents.css({
            left: "410px",
            right: "0px",
            overflow: "auto"
        });

        linkedDataPanel.panelBody.css("height", "500px");

        let title: string = new linkedDataPanel.container("<h2>Linked Data</h2>");
        let closeBtn: any = new linkedDataPanel.button("X");
        let minimizeBtn: any = new linkedDataPanel.button("T");
        closeBtn.element.css("float", "right");
        linkedDataPanel.controls = [minimizeBtn, title, closeBtn];

        return linkedDataPanel;
    }

    /**
     * Manage the click event on the geo button
     * @param url - The url of the geometries
     */
    private async manageclickEventGeoBouton(url: string): Promise<void> {

        const features: Feature<any>[] = await geoconnexService.getFeaturesFromCatchments(url);
        const geometries: BaseGeometry[] = GeojsonUtils.convertFeaturesToGeometries(features, {   
            colour: '#9e0e0e',
            icon: "M255,0C114.75,0,0,114.75,0,255s114.75,255,255,255s255-114.75,255-255S395.25,0,255,0z M255,459    c-112.2,0-204-91.8-204-204S142.8,51,255,51s204,91.8,204,204S367.2,459,255,459z"
        });

        this._layerLinkedData.removeGeometry();
        this._layerLinkedData.addGeometry(geometries);
    }

    /**
     * Create a HTML button based on the type
     * @param type - Type must be (linked | html | geo)
     * @param url  - The button's url 
     */
    private createHTMLButton(type: string, url: string) {

        let html: string = "";

        switch (type) {
            case "html":
                html = `<button class="md-icon-button primary md-button md-ink-ripple" type="button">
                            <a target="_blank" href="${url}">
                                <md-icon>
                                    <svg xmlns="http://www.w3.org/2000/svg" fit="" height="100%" width="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 56 56" focusable="false">
                                        <g>
                                            <path style="fill:#E9E9E0;" d="M36.985,0H7.963C7.155,0,6.5,0.655,6.5,1.926V55c0,0.345,0.655,1,1.463,1h40.074   c0.808,0,1.463-0.655,1.463-1V12.978c0-0.696-0.093-0.92-0.257-1.085L37.607,0.257C37.442,0.093,37.218,0,36.985,0z"/>
                                            <polygon style="fill:#D9D7CA;" points="37.5,0.151 37.5,12 49.349,12  "/>
                                            <path style="fill:#EC6630;" d="M48.037,56H7.963C7.155,56,6.5,55.345,6.5,54.537V39h43v15.537C49.5,55.345,48.845,56,48.037,56z"/>
                                        </g>
                                        <g>
                                            <path style="fill:#FFFFFF;" d="M17.455,42.924V53h-1.641v-4.539h-4.361V53H9.785V42.924h1.668v4.416h4.361v-4.416H17.455z"/>
                                            <path style="fill:#FFFFFF;" d="M27.107,42.924v1.121H24.1V53h-1.654v-8.955h-3.008v-1.121H27.107z"/>
                                            <path style="fill:#FFFFFF;" d="M36.705,42.924h1.668V53h-1.668v-6.932l-2.256,5.605H33l-2.27-5.605V53h-1.668V42.924h1.668    l2.994,6.891L36.705,42.924z"/>
                                            <path style="fill:#FFFFFF;" d="M42.57,42.924v8.832h4.635V53h-6.303V42.924H42.57z"/>
                                        </g>
                                        <g>
                                            <path style="fill:#EC6630;" d="M23.207,16.293c-0.391-0.391-1.023-0.391-1.414,0l-6,6c-0.391,0.391-0.391,1.023,0,1.414l6,6    C21.988,29.902,22.244,30,22.5,30s0.512-0.098,0.707-0.293c0.391-0.391,0.391-1.023,0-1.414L17.914,23l5.293-5.293    C23.598,17.316,23.598,16.684,23.207,16.293z"/>
                                            <path style="fill:#EC6630;" d="M41.207,22.293l-6-6c-0.391-0.391-1.023-0.391-1.414,0s-0.391,1.023,0,1.414L39.086,23    l-5.293,5.293c-0.391,0.391-0.391,1.023,0,1.414C33.988,29.902,34.244,30,34.5,30s0.512-0.098,0.707-0.293l6-6    C41.598,23.316,41.598,22.684,41.207,22.293z"/>
                                        </g>
                                    </svg>
                                </md-icon>
                            </a>
                        </button>`
                break;
            case "linked":
                html = `<button featureuri="${url}" type="button" class="md-icon-button primary md-button md-ink-ripple" type="button">
                            <md-icon>
                                <svg xmlns="http://www.w3.org/2000/svg" fit="" height="100%" width="100%" preserveAspectRatio="xMidYMid meet" viewBox="-71 0 512 512" focusable="false">
                                    <g>
                                    <path d="m280 1.074219v88.925781h88.925781c-6.597656-45.914062-43.011719-82.328125-88.925781-88.925781zm0 0"/><path d="m250 120v-120h-250v512h370v-392zm-121.015625 268.972656c-15.359375 0-30.722656-5.847656-42.414063-17.542968-23.390624-23.386719-23.390624-61.441407 0-84.828126l42.410157-42.414062c11.332031-11.328125 26.394531-17.570312 42.417969-17.570312 16.023437 0 31.085937 6.242187 42.414062 17.570312l-21.210938 21.210938c-5.664062-5.664063-13.195312-8.78125-21.203124-8.78125-8.011719 0-15.539063 3.121093-21.203126 8.78125l-42.414062 42.414062c-11.691406 11.691406-11.691406 30.714844 0 42.40625 11.691406 11.6875 30.714844 11.6875 42.40625 0l21.210938 21.210938c-11.691407 11.695312-27.050782 17.542968-42.414063 17.542968zm148.445313-123.574218-42.410157 42.414062c-11.328125 11.328125-26.394531 17.570312-42.414062 17.570312-16.023438 0-31.085938-6.242187-42.417969-17.570312l21.210938-21.210938c5.664062 5.660157 13.195312 8.78125 21.203124 8.78125 8.011719 0 15.539063-3.121093 21.203126-8.78125l42.414062-42.414062c11.6875-11.691406 11.6875-30.714844 0-42.40625-5.664062-5.664062-13.195312-8.78125-21.203125-8.78125-8.011719 0-15.539063 3.121094-21.203125 8.78125l-21.210938-21.210938c11.328126-11.332031 26.390626-17.570312 42.414063-17.570312s31.085937 6.238281 42.414063 17.570312c23.386718 23.386719 23.386718 61.441407 0 84.828126zm0 0"/>
                                    </g>
                                </svg>
                            </md-icon>
                        </button>`
                break;
            case "geo":
                html = `<button geojson="${url}" class="md-icon-button primary md-button md-ink-ripple" type="button">
                            <md-icon>
                                <svg xmlns="http://www.w3.org/2000/svg" fit="" height="100%" width="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24" focusable="false">
                                    <g id="place">
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path>
                                    </g>
                                </svg>
                            </md-icon>
                        </button>`
                break;
            default:
                break;
        }

        return html;
    }

}