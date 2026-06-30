import { _decorator, Component, Node } from 'cc';
import { jsonBase } from './jsonBase';
const { ccclass, property } = _decorator;

@ccclass('jsonAchive')
export class jsonAchive extends jsonBase {
    /** 表格名称 */
    tableName: string = "achiveTable";
    jsonPath: string = "json/achiveTable";
    tableUrl1: string = "https://cdn.taozigame.com/lt/config/2/achiveTable.json";

    achiveTypeData = {};

    /**初始化分类型数据 */
    initTypeData(){
        for (let i = 0; i < this.data.length; i++) {
            let data = this.data[i];
            if(this.achiveTypeData.hasOwnProperty(data.type)){
                this.achiveTypeData[data.type].push(data);
            }else{
                this.achiveTypeData[data.type] = [data];
            }
        }
        // console.log("初始化成就分类型数据:",this.achiveTypeData);
    }

    /**获取类型数据 */
    getTypeData(type){
        return this.achiveTypeData[type];
    }

    /**表格处理 */
    processTableData() {
        super.processTableData();
        for (let i = 0; i < this.data.length; i++) {
            let data = this.data[i];
            if(!data.rewards){
                continue;
            }
            data.rewards = JSON.parse(data.rewards);
        }
        this.initTypeData();
    }

    get tableData(): JsonAchiveData[] {
        return this.data;
    }
}
export let achiveConfig = new jsonAchive();

export interface JsonAchiveData {
    /**类型 */
    type: number;
    /**成就名 */
    name: string;
    /**条件 */
    conditions: number;
    /**奖励 */
    rewards: any;
}
