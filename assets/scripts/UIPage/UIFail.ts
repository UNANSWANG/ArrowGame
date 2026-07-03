import { _decorator, Component, Node, Animation, Label } from 'cc';
import { UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { UIBase } from './UIBase';
import { gm } from '../manager/gm';
import { GameEvent, PropsName } from '../manager/configData';
import { zoomButton } from '../extention/zoomButton';
import { ccTools } from '../extention/generalTools';
import { videoMgr } from '../manager/videoManager';
import { pData } from '../manager/playerData';
const { ccclass, property } = _decorator;

export enum FailType {
    /**时间到 */
    TimeOut = 0,
    /**生命值为0 */
    LifeZero = 1,
}
@ccclass('UIFail')
export class UIFail extends UIBase {
    @property(Node)
    homeBtn: Node;

    @property(Node)
    closeBtn: Node;

    @property(Node)
    resurrectionBtn: Node;

    @property(Node)
    logoNode: Node;

    @property(Node)
    titleNode: Node;

    @property(Label)
    powerNumLab: Label;

    @property(Label)
    addLab: Label;

    /**失败类型 */
    failType: FailType = FailType.TimeOut;

    protected onLoad(): void {
        this.bindBtn();
    }

    onUI_Open(data?: any) {
        let anim = this.getComponent(Animation);
        anim.play();
        this.initData(data);
    }

    initData(data?: any) {
        if (data) {
            this.failType = data.type;
        } else {
            this.failType = FailType.TimeOut;
        }

        this.powerNumLab.string = pData.getPropsNum(PropsName.power).toString();
        this.addLab.string = this.failType == FailType.TimeOut ? "+120" : "+1";
        ccTools.showChildByIdx(this.titleNode, this.failType);
        ccTools.showChildByIdx(this.logoNode, this.failType);

        pData.SDKReportLevelFail();
    }

    bindBtn() {
        this.homeBtn.addComponent(zoomButton).onClick = this.clickHomeBtn.bind(this);
        this.closeBtn.addComponent(zoomButton).onClick = this.clickCloseBtn.bind(this);
        this.resurrectionBtn.addComponent(zoomButton).onClick = this.clickResurrectionBtn.bind(this);
    }

    /**点击复活 */
    clickResurrectionBtn() {
        videoMgr.watchVideo(()=>{
            this.onClose();
            gm.Event.emit(GameEvent.resurrectionGame, this.failType);
        })
    }

    /**点击关闭(返回桌面) */
    clickCloseBtn() {
        this.onClose();
        //上报失败
        pData.reportLevel(false);
        uiMgr.closeGame();
    }

    /**点击返回首页 */
    clickHomeBtn() {
        this.onClose();
        //上报失败
        pData.reportLevel(false);
        uiMgr.closeGame();
    }

    onClose() {
        uiMgr.closePage(UIPath.UIFail);
    }
}