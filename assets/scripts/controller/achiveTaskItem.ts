import { _decorator, Component, instantiate, Label, Node, Prefab, Sprite } from 'cc';
import { ccStorageTools } from '../extention/storageTools';
import { AchiveTaskType, GameEvent, SaveKey } from '../manager/configData';
import { ccTools } from '../extention/generalTools';
import { achiveConfig, JsonAchiveData } from '../json/jsonAchive';
import { rewardItem } from './rewardItem';
import { imgPath, UIPath } from '../manager/pathConfig';
import { pData } from '../manager/playerData';
import { uiMgr } from '../manager/UIManager';
import { gm } from '../manager/gm';
import { ccTimeTools } from '../extention/timeTools';
const { ccclass, property } = _decorator;

@ccclass('achiveTaskItem')
export class achiveTaskItem extends Component {
    @property(Prefab)
    taskRewardPrefab: Prefab;

    /**任务类型 */
    taskType: number = 0;
    /**当前的任务进度 */
    currentProgress: number = -1;
    /**是否可以领取奖励 */
    canGet: boolean = false;
    /**当前的数据 */
    currentData: JsonAchiveData = null;

    nameLab: Label = null;
    conditionLab: Label = null;
    getLab: Node = null;
    red: Node = null;
    finishNode: Node = null;
    rewardLayout: Node = null;
    progressBar: Sprite = null;
    badge: Sprite = null;
    logo: Sprite = null;
    percetLab: Label = null;

    protected onLoad(): void {
        this.nameLab = this.node.getChildByName("nameLab").getComponent(Label);
        this.conditionLab = this.node.getChildByName("conditionLab").getComponent(Label);
        this.getLab = this.node.getChildByName("getLab");
        this.red = this.node.getChildByName("red");
        this.rewardLayout = this.node.getChildByName("rewardLayout");
        this.progressBar = this.node.getChildByName("progressBar").getComponent(Sprite);
        this.badge = this.node.getChildByName("badge").getComponent(Sprite);
        this.logo = this.node.getChildByName("logo").getComponent(Sprite);
        this.percetLab = this.node.getChildByName("percetLab").getComponent(Label);
        this.finishNode = this.node.getChildByName("finishNode");
    }

    protected onEnable(): void {
        this.addListener();
    }

    protected onDisable(): void {
        this.removeListener();
    }

    /**增加监听 */
    addListener() {
        this.node.on(Node.EventType.TOUCH_END, this.onClick, this);
    }

    /**移除监听 */
    removeListener() {
        this.node.off(Node.EventType.TOUCH_END, this.onClick, this);
    }

    /**初始化任务 */
    initTask(type) {
        this.taskType = type;
        this.refreshStatus();
    }

    /**刷新状态 */
    refreshStatus() {
        let taskKey = SaveKey.achiveRecord + this.taskType;
        //获取已完成的任务数
        let finishNum = ccStorageTools.getNumberData(taskKey);
        let targetNum = achiveConfig.getTypeData(this.taskType).length;
        let isFinish = finishNum >= targetNum;
        if (isFinish) {
            ccTools.destoryAllChild(this.rewardLayout);
            finishNum = targetNum - 1;
        }

        this.currentData = achiveConfig.getTypeData(this.taskType)[finishNum];
        if (this.currentProgress != finishNum) {
            this.currentProgress = finishNum;

            this.nameLab.string = this.currentData.name;
            this.conditionLab.string = ccTools.getStrByType(this.taskType - 1, this.currentData.conditions);
            let logoUrl = imgPath.achiveLogo + this.taskType;
            let badgeUrl = imgPath.badge + (finishNum + 1);

            ccTools.loadImg(this.logo, logoUrl);
            ccTools.loadImg(this.badge, badgeUrl);

            if (!isFinish) {
                this.generateReward();
            }
        }

        let curProgress = pData.getTaskProgress(this.taskType);
        this.canGet = false;
        if (curProgress >= this.currentData.conditions && !isFinish) {
            this.canGet = true;
            // curProgress = this.currentData.conditions;
        }

        this.finishNode.active = isFinish;

        this.setCanGet();
        this.percetLab.string = `${(curProgress)}/${this.currentData.conditions}`;
        this.progressBar.fillRange = curProgress / this.currentData.conditions;
    }

    /**生成奖励 */
    generateReward() {
        ccTools.destoryAllChild(this.rewardLayout);

        for (let i = 0; i < this.currentData.rewards.length; i++) {
            let item = instantiate(this.taskRewardPrefab);
            this.rewardLayout.addChild(item);
            let comp: rewardItem = item.getComponent(rewardItem);
            comp.initData(this.currentData.rewards[i]);
        }
    }

    /**设置奖励是否可领取 */
    setCanGet() {
        this.getLab.active = this.canGet;
        this.red.active = this.canGet;
        for (let i = 0; i < this.rewardLayout.children.length; i++) {
            let item = this.rewardLayout.children[i];
            let comp: rewardItem = item.getComponent(rewardItem);
            comp.setLight(this.canGet);
        }
    }

    /**获取奖励 */
    getReward() {
        if (!this.canGet) {
            return;
        }
        uiMgr.openPage(UIPath.UIReward, { rewardData: this.currentData.rewards });
    }

    /**点击 */
    onClick() {
        if (this.canGet) {
            this.getReward();

            let taskKey = SaveKey.achiveRecord + this.taskType;
            //获取已完成的任务数
            let finishNum = ccStorageTools.getNumberData(taskKey);
            //完成了这个成就徽章添加我的成就红点
            ccStorageTools.setData(SaveKey.myAchiveRed, 1);
            //添加临时数据
            pData.tempAchiveData.push(this.taskType);
            //添加时间
            let timeKey = SaveKey.myAchiveTime + this.taskType + "_" + finishNum;
            ccStorageTools.setData(timeKey, ccTimeTools.getCurrentDateFormatted());

            finishNum++;
            ccStorageTools.setData(taskKey, finishNum);

            //未全部完成任务
            if(finishNum < achiveConfig.getTypeData(this.taskType).length){
                //连续挑战天数需要在领取成功后归0
                if (this.taskType == AchiveTaskType.challengeDayDay) {
                    let continuousDayNum = ccStorageTools.getNumberData(SaveKey.continuousDayNum);
                    continuousDayNum -= this.currentData.conditions;
                    if(continuousDayNum < 0){
                        continuousDayNum = 0;
                    }
                    ccStorageTools.setData(SaveKey.continuousDayNum, continuousDayNum);
                }
            }

            gm.Event.emit(GameEvent.refreshRed);
            this.refreshStatus();
        }
    }
}


