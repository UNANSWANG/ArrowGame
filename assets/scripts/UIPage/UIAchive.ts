import { _decorator, Component, Node, Animation, tween, Vec3, Widget, view, ScrollView, Prefab, instantiate, Label, Tween } from 'cc';
import { UIBase } from './UIBase';
import { UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { zoomButton } from '../extention/zoomButton';
import { achiveTaskItem } from '../controller/achiveTaskItem';
import { achiveConfig } from '../json/jsonAchive';
import { ccTimeTools } from '../extention/timeTools';
import { ccTools } from '../extention/generalTools';
import { ccStorageTools } from '../extention/storageTools';
import { GameEvent, SaveKey } from '../manager/configData';
import { achiveItem } from '../controller/achiveItem';
import { gm } from '../manager/gm';
import { pData } from '../manager/playerData';
const { ccclass, property } = _decorator;

@ccclass('UIAchive')
export class UIAchive extends UIBase {
    @property(Node)
    closeBtn: Node;

    @property(Label)
    complateNumLab: Label;

    @property(ScrollView)
    taskScrol: ScrollView;

    @property(ScrollView)
    achiveScrol: ScrollView;

    @property(Node)
    myAchivePage: Node;

    @property(Node)
    milestoneNode: Node;

    @property(Node)
    bgNode: Node;

    @property(Prefab)
    taskItemPrefab: Prefab;

    @property(Prefab)
    achiveItemPrefab: Prefab;

    @property([Node])
    btnArr: Node[] = [];


    /**遮罩节点 */
    maskNode: Node = null;
    /**当前页面索引 */
    pageIdx = 0;
    /**徽章种类最大的数量 */
    maxAchiveTypeNum = 0;
    /**总徽章数 */
    totalAchiveNum = 0;

    /**背景节点初始位置 */
    rootPos = new Vec3(0, 0, 0);
    /**成就数据（用来排序） */
    achiveData = {};

    protected onLoad(): void {
        this.maskNode = this.node.getChildByName("mask");
        this.bindBtn();
        this.bgNode.getComponent(Widget).updateAlignment();
        this.rootPos = new Vec3(this.bgNode.position);
    }

    protected onEnable(): void {
        this.addListener();
    }

    protected onDisable(): void {
        this.removeListener();
    }

    onUI_Open() {
        this.playStartAnim();
        this.initData();
    }

    initData() {
        this.refreshPage();
    }

    bindBtn() {
        this.closeBtn.addComponent(zoomButton).onClick = this.clickCloseBtn.bind(this);
        this.maskNode.on(Node.EventType.TOUCH_END, this.clickCloseBtn, this);
        for (let i = 0; i < this.btnArr.length; i++) {
            this.btnArr[i].on(Node.EventType.TOUCH_END, this.clickPageBtn.bind(this, i), this);
        }
    }

    /**添加监听 */
    addListener() {
        gm.Event.on(GameEvent.refreshRed, this.refreshRed.bind(this), this);
    }

    /**移除监听 */
    removeListener() {
        gm.Event.off(GameEvent.refreshRed, this.refreshRed.bind(this), this);
    }

    /**播放开场动画 */
    playStartAnim() {
        let sceneHeight = view.getVisibleSize().height;
        this.maskNode.active = true;
        Tween.stopAllByTarget(this.bgNode);
        tween(this.bgNode)
            .set({ position: new Vec3(0, -sceneHeight / 2, 0) })
            .to(0.3, { position: this.rootPos })
            .start();
    }

    /**播放离场动画 */
    playEndAnim() {
        let sceneHeight = view.getVisibleSize().height;
        this.maskNode.active = false;
        Tween.stopAllByTarget(this.bgNode);
        tween(this.bgNode)
            .to(0.3, { position: new Vec3(0, -sceneHeight / 2, 0) })
            .call(() => {
                this.onClose();
            })
            .start();
    }

    /**初始化成就任务页面 */
    initAchiveTaskPage() {
        ccTools.destoryAllChild(this.taskScrol.content);

        for (let key in achiveConfig.achiveTypeData) {
            let data = achiveConfig.getTypeData(key);
            
            let item = instantiate(this.taskItemPrefab);
            this.taskScrol.content.addChild(item);

            let comp: achiveTaskItem = item.getComponent(achiveTaskItem);
            comp.initTask(data[0].type);
        }
    }

    /**显示成就任务界面 */
    showTaskPage() {
        //没有就初始化
        if (this.taskScrol.content.children.length == 0) {
            this.initAchiveTaskPage();
        }

        for (let i = 0; i < this.taskScrol.content.children.length; i++) {
            let item = this.taskScrol.content.children[i];
            item.getComponent(achiveTaskItem).refreshStatus();
        }
    }

    /**初始化我的成就页面 */
    initAchivePage() {
        ccTools.destoryAllChild(this.achiveScrol.content);
        this.achiveData = {};

        for (let key in achiveConfig.achiveTypeData) {
            let data = achiveConfig.getTypeData(key);
            let type = data[0].type;

            let finishNum = ccStorageTools.getNumberData(SaveKey.achiveRecord + type);

            for (let j = 0; j < finishNum; j++) {
                let item = instantiate(this.achiveItemPrefab);
                this.achiveScrol.content.addChild(item);
                // let comp: achiveItem = item.getComponent(achiveItem);
                // comp.initData(type, j);

                if (!this.achiveData.hasOwnProperty(type)) {
                    this.achiveData[type] = [item];
                } else {
                    this.achiveData[type].push(item);
                }

                this.totalAchiveNum++;

                //刷新最大徽章种类数量
                if (this.achiveData[type].length > this.maxAchiveTypeNum) {
                    this.maxAchiveTypeNum = this.achiveData[type].length;
                }
            }
        }
        //初始化的时候清空暂存数据
        if (pData.tempAchiveData.length > 0) {
            pData.tempAchiveData = [];
        }
    }

    /**检测是否有新的成就 */
    checkNewAchive() {
        if (pData.tempAchiveData.length == 0) {
            return;
        }

        for (let i = 0; i < pData.tempAchiveData.length; i++) {
            let type = pData.tempAchiveData[i];
            let item = instantiate(this.achiveItemPrefab);
            if (!this.achiveData.hasOwnProperty(type)) {
                this.achiveData[type] = [item];
            } else {
                this.achiveData[type].push(item);
            }

            this.totalAchiveNum++;

            //刷新最大徽章种类数量
            if (this.achiveData[type].length > this.maxAchiveTypeNum) {
                this.maxAchiveTypeNum = this.achiveData[type].length;
            }
        }

        //使用完后清空临时数据
        pData.tempAchiveData = [];
    }

    /**刷新我的成就，排序 */
    refreshAchivePage() {
        this.achiveScrol.content.removeAllChildren();
        //从后往前遍历，按照徽章的等级排序
        for (let i = this.maxAchiveTypeNum - 1; i >= 0; i--) {
            for (let type in this.achiveData) {
                let item = this.achiveData[type][i];
                if (item) {
                    this.achiveScrol.content.addChild(item);
                    let comp: achiveItem = item.getComponent(achiveItem);
                    comp.initData(type, i);
                }
            }
        }
    }

    /**显示我的成就 */
    showMyAchivePage() {
        if (this.achiveScrol.content.children.length == 0) {
            this.initAchivePage();
        }
        this.checkNewAchive();

        this.complateNumLab.string = `已获得勋章数目  ${this.totalAchiveNum}`;
        this.refreshAchivePage();
    }

    /**切换页面 */
    refreshPage() {
        this.taskScrol.node.active = this.pageIdx == 0;
        this.myAchivePage.active = this.pageIdx == 1;
        this.milestoneNode.active = this.pageIdx == 2;

        for (let i = 0; i < this.btnArr.length; i++) {
            this.btnArr[i].getChildByName("select").active = i == this.pageIdx;
        }


        if (this.pageIdx == 0) {
            this.showTaskPage();
        } else if (this.pageIdx == 1) {
            //打开这个界面默认清除红点
            ccStorageTools.setData(SaveKey.myAchiveRed, 0);
            gm.Event.emit(GameEvent.refreshRed);
            this.showMyAchivePage();
        }

        this.refreshRed();
    }

    /**刷新红点 */
    refreshRed() {
        //成就任务（未领取）
        this.btnArr[0].getChildByName("red").active = pData.hasCanGetTask();

        //我的成就
        this.btnArr[1].getChildByName("red").active = ccStorageTools.getNumberData(SaveKey.myAchiveRed) == 1;

        //里程碑
        this.btnArr[2].getChildByName("red").active = false;
    }

    ///
    ///点击事件
    ///

    /**点击关闭 */
    clickCloseBtn() {
        this.playEndAnim();
    }

    /**点击页面选项按钮 */
    clickPageBtn(index: number) {
        if(index == 2){
            //里程碑界面
            uiMgr.showTips("未开放");
            return;
        }
        this.pageIdx = index;
        this.refreshPage();
    }

    onClose() {
        uiMgr.closePage(UIPath.UIAchive);
    }
}