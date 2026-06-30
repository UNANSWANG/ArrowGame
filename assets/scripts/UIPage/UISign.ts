import { _decorator, Component, Node, Animation, Label, instantiate, Prefab } from 'cc';
import { UIBase } from './UIBase';
import { UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { zoomButton } from '../extention/zoomButton';
import { ccTimeTools } from '../extention/timeTools';
import { ccStorageTools } from '../extention/storageTools';
import { GameEvent, SaveKey } from '../manager/configData';
import { ccTools } from '../extention/generalTools';
import { rewardItem } from '../controller/rewardItem';
import { gm } from '../manager/gm';
const { ccclass, property } = _decorator;

@ccclass('UISign')
export class UISign extends UIBase {
    @property(Node)
    closeBtn: Node;

    @property(Node)
    signBtn: Node;

    @property(Node)
    complateNode: Node;

    @property(Node)
    signItemList: Node;

    @property(Node)
    lastSignItem: Node;

    @property(Prefab)
    itemPrefab: Prefab;

    /**已签到天数 */
    signNum: number = 0;
    /**是否签到 */
    isSign: boolean = false;
    /**是否初始化页面 */
    isInitPage: boolean = false;

    signData: any = [{ type: 2, num: 2 }, { type: 1, num: 3 }, { type: 0, num: 4 }, { type: 1, num: 3 }, { type: 1, num: 3 }, { type: 1, num: 3 }, [{ type: 0, num: 3 }, { type: 1, num: 3 }, { type: 2, num: 3 }]];

    protected onLoad(): void {
        this.bindBtn();
    }

    protected onEnable(): void {
        this.addListener();
    }

    protected onDisable(): void {
        this.removeListener();
    }

    addListener() {
        gm.Event.on(GameEvent.closeRewardPage, this.onClose, this);
    }

    removeListener() {
        gm.Event.off(GameEvent.closeRewardPage, this.onClose, this);
    }

    onUI_Open() {
        let anim = this.getComponent(Animation);
        anim.play();
        this.initData();
    }

    initData() {
        this.isSign = ccStorageTools.getLimitTimeData(SaveKey.isSign) == 1;
        this.signNum = ccStorageTools.getNumberData(SaveKey.signDay);

        this.refreshBtn();
        this.initPage();
    }

    bindBtn() {
        this.closeBtn.addComponent(zoomButton).onClick = this.clickCloseBtn.bind(this);
        this.signBtn.addComponent(zoomButton).onClick = this.clickSignBtn.bind(this);
        this.node.getChildByName("mask").on(Node.EventType.TOUCH_END, this.clickCloseBtn.bind(this));
    }

    /**刷新按钮 */
    refreshBtn() {
        this.signBtn.active = !this.isSign;
        this.complateNode.active = this.isSign;
    }

    /**初始化页面 */
    initPage() {
        if (this.isInitPage) {
            this.refreshPage();
            return;
        }
        for (let i = 0; i < this.signItemList.children.length; i++) {
            let item = this.signItemList.children[i];
            let titleLab = item.getChildByName("titleLab").getComponent(Label);
            titleLab.string = `第${ccTools.getChineseNum(i + 1)}天`;
            let curData = this.signData[i];
            let rewardNode = item.getChildByName("rewardNode");
            this.generateRewardItem(rewardNode, curData);
        }

        let lastSignRewardNode = this.lastSignItem.getChildByName("rewardNode");
        this.generateRewardItem(lastSignRewardNode, this.signData[6]);
        this.isInitPage = true;

        this.refreshPage();
    }

    /**刷新界面 */
    refreshPage() {
        for (let i = 0; i < this.signItemList.children.length; i++) {
            let item = this.signItemList.children[i];
            let selected = item.getChildByName("selected");
            let getted = item.getChildByName("getted");
            getted.active = i < this.signNum;
            selected.active = i == this.signNum && !this.isSign;
        }
    }

    /**生成奖励在节点下 */
    generateRewardItem(parentNode: Node, rewardData: any) {
        let generateCall = (data: any) => {
            let itemNode = instantiate(this.itemPrefab);
            parentNode.addChild(itemNode);

            let itemController = itemNode.getComponent(rewardItem);
            itemController.initData(data);
        }

        if (Array.isArray(rewardData)) {
            for (let i = 0; i < rewardData.length; i++) {
                let itemData = rewardData[i];
                generateCall(itemData);
            }
        } else {
            generateCall(rewardData);
        }
    }

    ///
    ///点击事件
    ///

    /**点击签到 */
    clickSignBtn() {
        if (this.isSign) {
            uiMgr.showTips("今日已签到");
            return;
        }

        let data = [];
        let curData = this.signData[this.signNum];

        if (Array.isArray(curData)) {
            data = curData;
        } else {
            data.push(curData);
        }

        this.isSign = true;
        ccStorageTools.setLimitTimeData(SaveKey.isSign, 1);
        this.signNum++;
        ccStorageTools.setData(SaveKey.signDay, this.signNum);

        this.refreshBtn();
        this.refreshPage();

        uiMgr.openPage(UIPath.UIReward, { rewardData: data });
    }

    /**点击关闭 */
    clickCloseBtn() {
        this.onClose();
    }

    onClose() {
        uiMgr.closePage(UIPath.UISign);
    }
}


