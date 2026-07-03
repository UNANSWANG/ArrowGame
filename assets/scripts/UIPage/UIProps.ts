import { _decorator, Component, Node, Animation, Prefab, instantiate, Label } from 'cc';
import { UIBase } from './UIBase';
import { UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { zoomButton } from '../extention/zoomButton';
import { gm } from '../manager/gm';
import { GameEvent, PropsName } from '../manager/configData';
import { pData } from '../manager/playerData';
import { ccTools } from '../extention/generalTools';
import { rewardItem, rewardItemData } from '../controller/rewardItem';
import { videoMgr } from '../manager/videoManager';
const { ccclass, property } = _decorator;

@ccclass('UIProps')
export class UIProps extends UIBase {
    @property(Node)
    closeBtn: Node;

    @property(Label)
    powerNumLab: Label;

    @property([Node])
    pageList: Node[] = [];

    /**0：体力、1：提示、2：辅助线 */
    pageIdx = 0;

    closeCall = null;

    protected onLoad(): void {
        this.bindBtn();
    }

    onUI_Open(data?) {
        let anim = this.getComponent(Animation);
        anim.play();
        this.initData(data);
    }

    initData(data?) {
        if (data && data.pageIdx != null) {
            this.pageIdx = data.pageIdx;
        } else {
            this.pageIdx = 0;
        }

        if (data && data.call != null) {
            this.closeCall = data.call;
        } else {
            this.closeCall = null;
        }

        this.powerNumLab.string = pData.getPropsNum(PropsName.power).toString();
        this.refreshPage();
        this.SDKAdReport();
    }

    bindBtn() {
        this.closeBtn.addComponent(zoomButton).onClick = this.clickCloseBtn.bind(this);
        this.node.getChildByName("mask").on(Node.EventType.TOUCH_END, this.clickCloseBtn.bind(this));
        for (let i = 0; i < this.pageList.length; i++) {
            let pageNode = this.pageList[i];
            let getBtn = pageNode.getChildByName("getBtn");
            let btnComp = getBtn.addComponent(zoomButton);
            if (i == 0) {
                btnComp.onClick = this.clickPowerGetBtn.bind(this);
            }
            else if (i == 1) {
                btnComp.onClick = this.clickTpsGetBtn.bind(this);
            }
            else {
                btnComp.onClick = this.clickAuxGetBtn.bind(this);
            }
        }
    }

    /**广告点上报 */
    SDKAdReport() {
        videoMgr.SDKAdShow(2);
        videoMgr.SDKAdShow(27);
    }

    /**切换页面 */
    refreshPage() {
        ccTools.showArrayByIdx(this.pageList, this.pageIdx);
    }

    ///
    ///点击事件
    ///

    /**点击关闭 */
    clickCloseBtn() {
        this.onClose();
    }

    /**点击体力的领取按钮 */
    clickPowerGetBtn() {
        //领取2点体力
        videoMgr.watchVideo(2, () => {
            this.onClose();
            pData.changePower(2);
            this.closeCall && this.closeCall();
        });
    }

    /**点击提示的领取按钮 */
    clickTpsGetBtn() {
        videoMgr.watchVideo(27, () => {
            this.onClose();
            gm.Event.emit(GameEvent.useTipsProps);
        });
    }

    /**点击辅助线的领取按钮 */
    clickAuxGetBtn() {
        gm.API.shareAppMessage(() => {
            this.onClose();
            gm.Event.emit(GameEvent.useAuxiliaryProps);
        });
    }

    onClose() {
        uiMgr.closePage(UIPath.UIProps);
    }
}