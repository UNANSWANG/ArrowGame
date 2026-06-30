import { _decorator, Button, Component, EventKeyboard, input, Input, KeyCode, Label, Node, NodeEventType } from 'cc';
import { gamePath, UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { UIBase } from './UIBase';
import { zoomButton } from '../extention/zoomButton';
import { pData } from '../manager/playerData';
import { AchiveTaskType, GameEvent, PropsName, SaveKey } from '../manager/configData';
import { achiveConfig } from '../json/jsonAchive';
import { gm, PlatType } from '../manager/gm';
import { ccStorageTools } from '../extention/storageTools';
import { TTManager } from '../sdk/plat/tt/TTManager';
import { loopAnimation } from '../controller/loopAnimation';
import { userMgr } from '../manager/userManager';
import { WXManager } from '../sdk/plat/wx/WXManager';
const { ccclass, property } = _decorator;

@ccclass('UIMain')
export class UIMain extends UIBase {
    @property(Node)
    startBtn: Node = null;

    @property(Node)
    setBtn: Node = null;

    @property(Node)
    signBtn: Node = null;

    @property(Node)
    gameCircleBtn: Node = null;

    @property(Node)
    achievementsBtn: Node = null;

    @property(Node)
    skinBtn: Node = null;

    @property(Node)
    rankBtn: Node = null;

    @property(Node)
    revisitBtn: Node = null;

    @property(Label)
    levelLab: Label = null;

    /**是否展示过复访按钮 */
    isShowRevisit = false;

    onLoad() {
        this.bindBtn();
    }

    onUI_Open(data?: any): void {
        this.addListener();
        this.initData();
    }

    onUI_Close(data?: any): void {
        this.removeListener();
    }

    /**初始化数据 */
    initData() {
        this.levelLab.string = `第${pData.level + 1}关`;

        this.refreshRed();
        this.checkRevisitBtn();
    }

    bindBtn() {
        this.startBtn.addComponent(zoomButton).onClick = this.cliskStartBtn.bind(this);
        this.setBtn.addComponent(zoomButton).onClick = this.cliskSetBtn.bind(this);
        this.signBtn.addComponent(zoomButton).onClick = this.clickSignBtn.bind(this);
        this.gameCircleBtn.addComponent(zoomButton).onClick = this.clickGameCircleBtn.bind(this);
        this.achievementsBtn.addComponent(zoomButton).onClick = this.clickAchievementsBtn.bind(this);
        this.skinBtn.addComponent(zoomButton).onClick = this.clickSkinBtn.bind(this);
        this.rankBtn.addComponent(zoomButton).onClick = this.clickRankBtn.bind(this);
        this.revisitBtn.addComponent(zoomButton).onClick = this.clickRevisitBtn.bind(this);
    }

    /**添加监听 */
    addListener() {
        // 监听键盘按下
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        // 监听刷新红点事件
        gm.Event.on(GameEvent.refreshRed, this.refreshRed, this);
    }

    /**删除监听 */
    removeListener() {
        // 监听键盘按下
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        // 监听刷新红点事件
        gm.Event.off(GameEvent.refreshRed, this.refreshRed, this);
    }

    /**刷新红点 */
    refreshRed() {
        let hasAchiveReward = pData.hasCanGetTask();
        //有奖励或者成就那有红点
        this.achievementsBtn.getChildByName("red").active = hasAchiveReward || ccStorageTools.getNumberData(SaveKey.myAchiveRed) == 1;
    }

    /**检测复访按钮 */
    checkRevisitBtn() {
        this.revisitBtn.active = gm.platType == PlatType.tt;
        //抖音平台
        if (gm.platType == PlatType.tt && !this.isShowRevisit) {
            let isGetted = ccStorageTools.getLimitTimeData(SaveKey.isGetRevisit) == 1;
            let TTMgr = gm.API as TTManager;
            let canGet = TTMgr.checkCanGetGift();
            if (canGet && !isGetted) {
                this.isShowRevisit = true;
                this.clickRevisitBtn();
            }
        }
    }

    ///
    ///点击事件
    ///

    /**开始游戏 */
    cliskStartBtn() {
        if (pData.getPropsNum(PropsName.power) > 0) {
            pData.changePower(-1);
            uiMgr.startGame();
        } else {
            uiMgr.openPage(UIPath.UIProps, { pageIdx: 0, call: this.cliskStartBtn.bind(this) });
        }
    }

    /**监听按钮点击事件 */
    onKeyDown(event: EventKeyboard) {
        switch (event.keyCode) {
            case KeyCode.KEY_L:
                //增加体力
                pData.changePower(5);
                break;
        }
    }

    /**点击设置 */
    cliskSetBtn() {
        uiMgr.openPage(UIPath.UISetting, { mode: 0 });
    }

    /**点击复访 */
    clickRevisitBtn() {
        uiMgr.openPage(UIPath.UIRevisit);
    }

    /**点击签到 */
    clickSignBtn() {
        uiMgr.openPage(UIPath.UISign);
    }

    /**点击游戏圈 */
    clickGameCircleBtn() {
        // uiMgr.showTips("打开游戏圈界面");
        //TODO 测试提示
        // uiMgr.showAchiveTips(AchiveTaskType.removeColorArrow);
    }

    /**点击成就 */
    clickAchievementsBtn() {
        uiMgr.openPage(UIPath.UIAchive);
    }

    /**点击皮肤 */
    clickSkinBtn() {
        uiMgr.showTips("打开皮肤界面");
        // pData.changePower(-1);
        //TODO 测试奖励
        // uiMgr.openPage(UIPath.UIReward, { rewardData: [{ type: 0, num: 2 }, { type: 1, num: 3 }, { type: 2, num: 4 }] });
        // pData.fixPropsNum(PropsName.power, 2);
    }

    /**点击排行榜 */
    clickRankBtn() {
        //有昵称和授权或者h5平台才直接打开排行榜
        if ((gm.API.isAuthorize && userMgr.nickName) || gm.platType == PlatType.h5) {
            uiMgr.openPage(UIPath.UIRank);
        } else {
            let getUserInfo = () => {
                let wxMgr = gm.API as WXManager;
                wxMgr.getUserProfile(() => {
                    uiMgr.openPage(UIPath.UIRank);
                }, () => {
                    uiMgr.openPage(UIPath.UIRank);
                });
            }

            if (!gm.API.isAuthorize) {
                //没有授权
                gm.API.requirePrivacyAuthorize(() => {
                    console.log("授权成功");
                    if (!userMgr.nickName) {
                        getUserInfo();
                    } else {
                        uiMgr.openPage(UIPath.UIRank);
                    }
                }, () => {
                    console.log("授权失败");
                    uiMgr.openPage(UIPath.UIRank);
                });
            } else {
                //有授权但是没有昵称
                getUserInfo();
            }
        }
    }

    /**点击体力按钮 */
    clickPowerBtn() {
        uiMgr.showTips("打开体力界面");
    }
}


