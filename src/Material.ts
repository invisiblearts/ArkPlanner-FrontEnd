import * as data from './assets/material_list.json';

export const enum MaterialType {
    传说材料,
    RMA,
    酮类,
    酯类,
    醇类,
    糖类,
    异铁,
    装置,
    源岩,
    研磨石,
    锰矿,
}

export const enum Legendary {
    D32钢,
    双极纳米片,
    聚合剂,
}

export class Material {
    constructor(
        public id: number,
        public sortId: number,
        public name: string,
        public rarity: number,
        public type: MaterialType,
        public iconPath: string = '',
        public owned: number = 0,
        public required: number = 0,
    ) {}
    public isRequiredType(requiredType: MaterialType): boolean {
        return requiredType === this.type;
    }
    public isRequiredRarity(requiredRarity: number): boolean {
        return requiredRarity === this.rarity;
    }
}

export default function getMaterialsList(): Material[] {
    const materialsList = new Array<Material>();
    const dataMain = (data as any).default;
    for (const key in dataMain) {
        if (dataMain[key]) {
            const dataObj = dataMain[key];
            const material = new Material(dataObj.id, dataObj.sortId, dataObj.name, dataObj.rarity, dataObj.type as MaterialType,
                require('./assets/img/' + dataObj.id.toString() + '_icon.png'));
            materialsList.push(material);
        }
    }
    return materialsList;
}


