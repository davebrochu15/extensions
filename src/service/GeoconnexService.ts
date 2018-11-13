import Axios, { AxiosResponse } from "axios";
import { Feature } from "../manageExtension/Feature";
import { GeojsonUtils } from "../util/GeojsonUtils";

/**
 * Service for the Geoconnex HTML request
 */
class GeoconnexService {

    constructor(){}
    
    /**
     * Get a list of features from catchments
     * @param url - The url of the request
     */
    public async getFeaturesCatchments(url: string): Promise<Feature<CatchmentsProperties>[]> {
        try {
            const response: AxiosResponse = await Axios.get(url);
            const feature: Feature<CatchmentsProperties>[] = GeojsonUtils.getFeaturesFromGeoJSON(response.data);
            return feature;
        } catch (error) {
            throw new Error("File not found");
        }
    }

    public async getLinkedDataObjs(url: string): Promise<LinkedDataObj[]> {
        try {
            const response: AxiosResponse = await Axios.get(url);
            const linkedDataObjs: LinkedDataObj[] = await this.convertGraphToLinkedDataObjs(response.data, url);
            return linkedDataObjs;
        } catch (error) {
            throw new Error("File not found");
        }
    }

    private async getLinkedDataGraph(url: string): Promise<LinkedDataGraph> {
        try {
            const response: AxiosResponse = await Axios.get(url);
            return response.data;
        } catch (error) {
            throw new Error("File not found");
        }
    }

    private async convertGraphToLinkedDataObjs(json: LinkedDataGraph, url: string): Promise<any[]> {

        let linkedDataObjs: LinkedDataObj[] = [];
        let obj: LinkedDataObj[] = [];

        const linkedDataJson: LinkedDataJson = this.getSectionDataFromGraph(json, url);

        obj = await this.getLinkedDataObjsByType("@id", linkedDataJson);
        linkedDataObjs = linkedDataObjs.concat(obj);
        
        obj = await this.getLinkedDataObjsByType("contains", linkedDataJson);
        linkedDataObjs = linkedDataObjs.concat(obj);

        obj = await this.getLinkedDataObjsByType("mesures", linkedDataJson);
        linkedDataObjs = linkedDataObjs.concat(obj);

        obj = await this.getLinkedDataObjsByType("near", linkedDataJson);
        linkedDataObjs = linkedDataObjs.concat(obj);

        obj = await this.getLinkedDataObjsByType("inside", linkedDataJson);
        linkedDataObjs = linkedDataObjs.concat(obj);

        obj = await this.getLinkedDataObjsByType("drains", linkedDataJson);
        linkedDataObjs = linkedDataObjs.concat(obj);

        obj = await this.getLinkedDataObjsByType("drains-into", linkedDataJson);
        linkedDataObjs = linkedDataObjs.concat(obj);
    
        obj = await this.getLinkedDataObjsByType("overlaps", linkedDataJson);
        linkedDataObjs = linkedDataObjs.concat(obj);

        return linkedDataObjs;
    }

    private async getLinkedDataObjsByType(type: string, data: LinkedDataJson) {
        let linkedDataObjs: LinkedDataObj[] = [];

        if(!data[type]) {
            return [];
        }

        let length = data[type] instanceof Array ? data[type].length: 1;
        for(let i = 0; i < length; i++) {
            let uri = data[type] instanceof Array ? data[type][i]: data[type];
            const json: LinkedDataGraph = await this.getLinkedDataGraph(uri);

            let dataUris: string[] = [];
            const linkedDataJson: LinkedDataJson = this.getSectionDataFromGraph(json, uri);
   
            const name = linkedDataJson.label[0]["@value"];
            if(linkedDataJson.seeAlso instanceof Array) {
                linkedDataJson.seeAlso.forEach ( (uri: string) => {
                    dataUris.push(`${uri}?f=geojson`);
                });
            } else {
                dataUris.push(`${linkedDataJson.seeAlso}?f=geojson`);
            }

            linkedDataObjs.push ({
                type: type,
                name: name,
                uri: uri,
                dataUris: dataUris
            });
        }
        return linkedDataObjs;
    }

    private getSectionDataFromGraph(json: LinkedDataGraph, id: string): LinkedDataJson {
        let linkedData: LinkedDataJson = null;
        json["@graph"].forEach( (data: LinkedDataJson) => {
            if(data["@id"] === id) {
                linkedData = data;
            }
        });
        return linkedData;
    }

}

export interface LinkedDataObj {
    type: string,
    name: string,
    uri: string,
    dataUris: string[];
};

export interface LinkedDataGraph {
    "@graph": LinkedDataJson[]
};

export interface LinkedDataJson {
    "@id": string,
            "@type": string[],
            "contains": string[],
            "drains": string[],
            "drains-into": string[],
            "inside": string[],
            "overlaps": string,
            "mesures": string,
            "near": string[],
            "name": string,
            "label": {
                "@language": string,
                "@value": string
            }[],
            "seeAlso": string | string[],
            "sameAs": string | string[]
}

export interface CatchmentsProperties {
    uri: string,
    type: string,
    id: string,
    name: string,
    legal: string,
    "drains-to": string
};

export let geoconnexService: GeoconnexService = new GeoconnexService();