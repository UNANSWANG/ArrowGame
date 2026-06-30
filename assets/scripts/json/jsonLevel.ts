import { _decorator, Component, Node } from 'cc';
import { jsonBase } from './jsonBase';
const { ccclass, property } = _decorator;

@ccclass('jsonLevel')
export class jsonLevel extends jsonBase {
    /** 表格名称 */
    tableName: string = "levelTable";
    jsonPath: string = "json/levelTable";
    tableUrl1: string = "https://cdn.taozigame.com/lt/config/2/levelTable1.json";
    tableUrl2: string = "https://cdn.taozigame.com/lt/config/2/levelTable2.json";

    get tableData() : JsonLevelData[]{
        return this.data;
    }
}
export let levelConfig = new jsonLevel();

interface JsonLevelData {
    /**关卡数据 */
    levelData: string;
    /**生命值数量 */
    lifeNum: number;
    /**关卡时间（秒） */
    levelTime: number;
    /**彩色箭头数量 */
    colorNum?: number;
    /**是否为冲刺关卡 */
    isSprint?: number;
}