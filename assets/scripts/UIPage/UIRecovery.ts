import { _decorator, Animation, Node } from 'cc';
import { ccTools } from '../extention/generalTools';
import { zoomButton } from '../extention/zoomButton';
import { UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { UIBase } from './UIBase';
import { pData } from '../manager/playerData';
import { ccStorageTools } from '../extention/storageTools';
import { SaveKey } from '../manager/configData';
const { ccclass, property } = _decorator;

@ccclass('UIRecovery')
export class UIRecovery extends UIBase {
    @property([Node])
    pageList: Node[] = [];

    /**0：恢复提示，1：警告 */
    pageIdx = 0;

    protected onLoad(): void {
        this.bindBtn();
    }

    onUI_Open(data?) {
        let anim = this.getComponent(Animation);
        anim.play();
        this.initData();
    }

    initData() {
        this.pageIdx = 0;

        this.refreshPage();
    }

    bindBtn() {
        for(let i = 0; i < this.pageList.length; i++){
            let recoveryBtn = this.pageList[i].getChildByName("recoveryBtn");
            recoveryBtn.addComponent(zoomButton).onClick = this.clickRecoveryBtn.bind(this);

            let noRecoveryBtn = this.pageList[i].getChildByName("noRecoveryBtn");
            noRecoveryBtn.addComponent(zoomButton).onClick = this.clickNoRecoveryBtn.bind(this);
        }
    }

    /**切换页面 */
    refreshPage() {
        ccTools.showArrayByIdx(this.pageList, this.pageIdx);
    }

    ///
    ///点击事件
    ///

    /**点击恢复按钮 */
    clickRecoveryBtn() {
        pData.level = pData.onlinLevel;
        //恢复后存储线上关卡
        ccStorageTools.setData(SaveKey.level, pData.level);
        this.onClose();
        uiMgr.closeGame();
    }

    /**点击不恢复按钮 */
    clickNoRecoveryBtn() {
        if(this.pageIdx == 0){
            this.pageIdx = 1;
            this.refreshPage();
        }else{
            this.onClose();
        }
    }

    onClose() {
        uiMgr.closePage(UIPath.UIRecovery);
    }
}


