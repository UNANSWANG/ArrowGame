import { _decorator, Component, Node } from 'cc';
import { ccResTools } from '../extention/resTools';
import { uiMgr } from './UIManager';
import { levelConfig } from '../json/jsonLevel';
import { gm } from './gm';
import { GameEvent } from './configData';
import { achiveConfig } from '../json/jsonAchive';
const { ccclass, property } = _decorator;

@ccclass('jsonManager')
export class jsonManager  {
    /**表格数量 */
    tableNum = 2;
    /**已加载的表格数量 */
    tableLoadNum = 0;

    async load(){
        gm.Event.on(GameEvent.loadTable, this.loadCall, this);
        levelConfig.initTable();
        achiveConfig.initTable();
    }

    loadCall(name: string){
        this.tableLoadNum++;
        if(this.tableLoadNum == this.tableNum){
            gm.Event.emit(GameEvent.tableLoadComplete);
        }
    }
}

export let jsonMgr = new jsonManager();



