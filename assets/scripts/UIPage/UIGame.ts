import { _decorator, Component, Animation, EditBox, EventKeyboard, EventMouse, EventTouch, Input, input, instantiate, KeyCode, Label, Layout, Node, NodePool, Prefab, ScrollView, Slider, Sprite, Toggle, tween, UITransform, Vec2, Vec3, view, macro, UIOpacity, Tween, Color, ParticleSystem2D } from 'cc';
import { pointController } from '../controller/pointController';
import { arrowController, ArrowType } from '../controller/arrowController';
import { UIManager, uiMgr } from '../manager/UIManager';
import { pData } from '../manager/playerData';
import { UIBase } from './UIBase';
import { UIPath } from '../manager/pathConfig';
import { AchiveTaskType, configData, GameEvent, PropsName, SaveKey, stageColor } from '../manager/configData';
import { gm } from '../manager/gm';
import { ccTimeTools } from '../extention/timeTools';
import { ccStorageTools } from '../extention/storageTools';
import { FailType } from './UIFail';
import { zoomButton } from '../extention/zoomButton';
import { ExternalPropsType, propsController, PropsType } from '../controller/propsController';
import { ccTools } from '../extention/generalTools';
import { videoMgr } from '../manager/videoManager';
import { guideDialogueController } from '../controller/guideDialogueController';
import { drawLineController } from '../controller/drawLineController';
import { poolMgr } from '../manager/poolManager';
const { ccclass, property } = _decorator;

@ccclass('UIGame')
export class UIGame extends UIBase {
    @property(EditBox)
    inputLab: EditBox;

    @property(EditBox)
    levelEditBox: EditBox;

    @property(Node)
    nextBtn: Node;

    @property(Node)
    skipBtn: Node;

    @property(Node)
    testBtn: Node;

    @property(Node)
    setBtn: Node;

    @property(Label)
    levelLab: Label;

    @property(Label)
    countDownLab: Label;

    @property(Node)
    tipsBtn: Node;

    @property(Node)
    auxiliaryBtn: Node;

    @property(Node)
    inputBtn: Node;

    @property(Node)
    addScaleBtn: Node;

    @property(Node)
    decScaleBtn: Node;

    @property(Node)
    switchBtn: Node;

    @property(Node)
    noTouchNode: Node;

    @property(ScrollView)
    scroll: ScrollView;

    @property(Node)
    gameNode: Node;

    @property(Node)
    gameLayoutNode: Node;

    @property(Node)
    drawList: Node;

    @property(Node)
    lineList: Node;

    @property(Node)
    propsPath: Node;

    @property(Node)
    consoleNode: Node;

    @property(Node)
    lifeNode: Node;

    @property(Node)
    timeNode: Node;

    @property(Node)
    sprintOpenNode: Node;

    @property(Slider)
    scaleSlider: Slider;

    @property(Prefab)
    lifeItemPrefab: Prefab;

    @property(Prefab)
    drawItemPrefab: Prefab;

    @property(Prefab)
    drawLineItemPrefab: Prefab;

    @property(Prefab)
    pointPrefab: Prefab;

    @property(guideDialogueController)
    guideDialogueComp: guideDialogueController;

    @property([Prefab])
    externalPropsPrefabs: Prefab[] = [];

    @property([Prefab])
    propsPrefabs: Prefab[] = [];

    @property([Node])
    guidePageList: Node[] = [];

    /**最大缩放 */
    maxScale = 1.5;
    /**最小缩放 */
    minScale = 1;
    /**当前缩放 */
    curScale = 1;
    /**单次修改的缩放(按钮点击) */
    scaleStep = 0.1;
    /**单次修改的缩放(鼠标滚动) */
    mouseScaleStep = 0.02;
    /**基础游戏区域大小 */
    baseGameSize = new Vec2(0, 0);
    /**当前宽高 */
    curSize = new Vec2(0, 0);
    /**绘图路径 */
    drawPath: pointController[] = [];
    /**点位地图 */
    pointMap: Map<string, pointController> = new Map();
    /**剩余倒计时时间 */
    countDownTime = 0;
    /**是否开始倒计时 */
    isCountDownStart = false;
    /**顺时针的边缘点位(左上,右上,右下,左下) */
    roundPosArr: Vec3[] = [];
    /**边缘道具节点数组 */
    roundPropsArr: Node[] = [];
    /**当前触摸点距离 */
    touchDistance = 0;
    /**当前触摸点数量 */
    touchNum = 0;
    /**是否需要删除辅助线计数器 */
    isDeleteAuxiliaryLineTimer = false;
    /**第一关已引导的数量 */
    firstGuideNum = 0;
    /**是否分帧生成 */
    isFrameGenerate = false;
    /** 添加一个当前索引的私有变量*/
    private currentIndex: number[] = [0, 0];
    /** 每批处理的元素数量 */
    private batchSize = 200;
    /** 处理的已经处理数量 */
    private createProcessedNum = 0;
    /** 批处理总共需要处理的元素数量 */
    private createTotalNum = 0;
    /**游戏区域宽高（位置） */
    private gameAreaSize = new Vec2(0, 0);
    /**帧生成回调 */
    frameCall = null;
    /**是否正在切换主题 */
    isSwitchTheme = false;
    /**当前冲刺进度 */
    curSprintStage = 0;
    /**冲刺减少进度数组 */
    sprintDecNumArr = [0.025, 0.04, 0.06, 0.07];
    //是否可以缩减冲刺进度条
    canSprintUpdate = false;

    //赋值节点
    topSprintNode: Node;
    topSprintMask: Node;
    bottomSprintNode: Node;
    bottomSprintMask: Node;

    protected onLoad(): void {
        this.bindBtn();

        this.topSprintNode = this.node.getChildByName("topNode").getChildByName("sprintNode");
        this.topSprintMask = this.topSprintNode.getChildByName("mask");
        this.bottomSprintNode = this.node.getChildByName("bottomNode").getChildByName("sprintNode");
        this.bottomSprintMask = this.bottomSprintNode.getChildByName("mask");
        let openAnim = this.sprintOpenNode.getChildByName("openAnim").getComponent(Animation);
        openAnim.on(Animation.EventType.FINISHED, () => {
            this.sprintOpenNode.active = false;
        }, this);
    }

    onUI_Open(data?: any): void {
        this.addListener();
        this.initData(data);
    }

    onUI_Close(): void {
        this.removeListener();
    }

    /**添加监听 */
    addListener() {
        gm.Event.on(GameEvent.refreshGameLevel, this.initData, this);
        gm.Event.on(GameEvent.resurrectionGame, this.resurrectionGame, this);
        gm.Event.on(GameEvent.refreshLife, this.refreshLife, this);
        gm.Event.on(GameEvent.refreshProps, this.refreshPropsNum, this);
        gm.Event.on(GameEvent.useTipsProps, this.useTipsProps, this);
        gm.Event.on(GameEvent.useAuxiliaryProps, this.useAuxiliaryProps, this);
        gm.Event.on(GameEvent.refreshSprintStage, this.refreshSprintStage, this);
        // 监听键盘按下
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);

        // 监视图听触摸事件
        this.scroll.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.scroll.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.scroll.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.scroll.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    /**删除监听 */
    removeListener() {
        gm.Event.off(GameEvent.refreshGameLevel, this.initData, this);
        gm.Event.off(GameEvent.resurrectionGame, this.resurrectionGame, this);
        gm.Event.off(GameEvent.refreshLife, this.refreshLife, this);
        gm.Event.off(GameEvent.refreshProps, this.refreshPropsNum, this);
        gm.Event.off(GameEvent.useTipsProps, this.useTipsProps, this);
        gm.Event.off(GameEvent.useAuxiliaryProps, this.useAuxiliaryProps, this);
        gm.Event.off(GameEvent.refreshSprintStage, this.refreshSprintStage, this);
        // 监听键盘按下
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    bindBtn() {
        this.inputBtn.addComponent(zoomButton).onClick = this.clickInputBtn.bind(this);
        this.addScaleBtn.addComponent(zoomButton).onClick = this.clickAddScaleBtn.bind(this);
        this.decScaleBtn.addComponent(zoomButton).onClick = this.clickDecScaleBtn.bind(this);
        this.setBtn.addComponent(zoomButton).onClick = this.clickSetBtn.bind(this);
        this.tipsBtn.addComponent(zoomButton).onClick = this.clickTipsBtn.bind(this);
        this.auxiliaryBtn.addComponent(zoomButton).onClick = this.clickAuxiliaryBtn.bind(this);
        this.scaleSlider.node.on('slide', this.onScaleChange, this);
        this.nextBtn.addComponent(zoomButton).onClick = this.clickNextBtn.bind(this);
        this.skipBtn.addComponent(zoomButton).onClick = this.clickSkipBtn.bind(this);
        this.testBtn.addComponent(zoomButton).onClick = this.clickTestBtn.bind(this);
        this.switchBtn.on(Node.EventType.TOUCH_END, this.clickSwitchBtn.bind(this), this);
        this.guidePageList[2].getChildByName("closeBtn").addComponent(zoomButton).onClick = this.closeAllGuide.bind(this);

        (this.scroll as any)._onMouseWheel = this.onMouseWheel.bind(this);
        this.scroll.node.on(Input.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
    }

    initData(data?) {
        pData.levelInit();

        // if (this.isFrameGenerate) {
        //     uiMgr.openPage(UIPath.loadTips);
        // }

        //默认不分帧生成
        this.isFrameGenerate = false;
        if (data) {
            if (data.inputData) {
                pData.levelData = data.inputData;
                pData.maxArrowNum = pData.levelData.arrowData.length + pData.levelData.bigArrowData.length;
                pData.curArrowNum = 0;
            }
            if (data.isFrameGenerate) {
                this.isFrameGenerate = data.isFrameGenerate;
            }
        }

        /**清除数据 */
        this.clearData();

        //TODO 测试场外道具
        // pData.levelData.externalPropsData = [[0, 49, 31, 0]];
        // pData.levelData.externalPropsData = [];
        // pData.levelData.externalPropsData.push([0, -2, -2, 0]);
        // pData.levelData.externalPropsData.push([1, -2, 10, 0]);
        // pData.levelData.externalPropsData.push([2, 15, -2, 0]);

        this.levelLab.string = `关卡${pData.level + 1}`;

        this.checkStartAchiveProgress();

        this.initLife();

        this.noTouchNode.active = true;

        //创建游戏区域
        this.createGame(pData.levelData.width, pData.levelData.height, () => {
            //创建箭头
            this.createArrow(pData.levelData.arrowData);
            //创建大箭头
            this.createBigArrow(pData.levelData.bigArrowData);
            //创建边缘道具
            this.createOutsidePropsArea(pData.levelData.externalPropsData);
            //创建内部道具
            this.createInsideProps(pData.levelData.propsData);
            //重置游戏区域位置
            this.node.position = Vec3.ZERO;
            //关闭加载动画
            if (this.isFrameGenerate) {
                uiMgr.closePage(UIPath.UIMain);
                this.isFrameGenerate = false;
                uiMgr.closePage(UIPath.loadTips);
            }

            //开始动画
            this.startAnim();
        });
        //初始化主题模式
        this.initThemeMode();
        //刷新道具数量
        this.refreshPropsNum();
        //倒计时
        this.initCountDown();
    }

    clearData() {
        this.unscheduleAllCallbacks();
        this.curScale = 1;
        this.firstGuideNum = 0;
        this.curSprintStage = 0;
        this.canSprintUpdate = false;
        this.sprintOpenNode.active = false;

        this.closeSrpint();

        this.drawPath = [];
        this.pointMap.clear();
        //回收点位到对象池
        this.addPointNodeToPool();
        //回收画笔到对象池
        this.addDrawNodeToPool();
        // ccTools.destoryAllChild(this.gameLayoutNode);
        // ccTools.destoryAllChild(this.drawList);
        // ccTools.destoryAllChild(this.lineList);
        ccTools.destoryAllChild(this.propsPath);
        //未开始倒计时
        this.isCountDownStart = false;
        //是否正在切换主题
        this.isSwitchTheme = false;
        //关闭所有引导
        this.closeAllGuide();
    }

    /**创建游戏 */
    createGame(width: number, height: number, call?) {
        this.curSize.x = width;
        this.curSize.y = height;

        //计算游戏区域的宽度和高度
        let fixWidthLen = width * configData.pointWidth;
        let fixHeightLen = height * configData.pointWidth;
        let gameLayout = this.gameLayoutNode.getComponent(Layout);

        gameLayout.getComponent(UITransform).width = fixWidthLen;

        let baseGameSizeX = fixWidthLen;
        let baseGameSizeY = fixHeightLen;
        // let screwUitrans = this.scroll.node.getComponent(UITransform);
        let minSize = view.getVisibleSize();
        let minWid = minSize.x * 0.85;
        //限定最小宽高
        if (baseGameSizeX < minWid) {
            baseGameSizeX = minSize.x;
        } else {
            baseGameSizeX = baseGameSizeX / 0.7;
        }
        // if (baseGameSizeY < minSize.y) {
        //     baseGameSizeY = minSize.y;
        // }

        //455是顶部和底部的高度，算出需要偏移的宽高
        let sceneScale = 550 / minSize.y;
        baseGameSizeY *= (sceneScale + 1);

        let widthScale = minSize.x / baseGameSizeX;
        let heightScale = minSize.y / baseGameSizeY;

        this.minScale = Math.min(widthScale, heightScale);

        this.baseGameSize.set(baseGameSizeX, baseGameSizeY);

        this.scroll.enabled = true;

        if (this.isFrameGenerate) {
            //分帧生成
            this.currentIndex = [0, 0];
            this.createProcessedNum = 0;
            this.createTotalNum = width * height;
            this.gameAreaSize.set(width, height);

            this.frameCall = call;
            //先注释掉这部分（超过1000个依旧会卡顿）
            //先跑一遍已有的点位，初始化数据，再将剩下的分帧生成
            // let idx_i = this.currentIndex[0];
            // let idx_j = this.currentIndex[1];
            // let finishFlag = false;
            // for (; idx_i < height; idx_i++) {
            //     for (; idx_j < width; idx_j++) {
            //         let pointNode = this.gameLayoutNode.children[this.createProcessedNum];
            //         if (!pointNode) {
            //             finishFlag = true;
            //             break;
            //         }

            //         let pointComp = pointNode.getComponent(pointController);
            //         pointComp.clearData();
            //         pointComp.initData(this, new Vec2(idx_i, idx_j));
            //         pointComp.setThemeColor();

            //         let pointKey = idx_i + "," + idx_j;
            //         this.pointMap.set(pointKey, pointComp);
            //         this.createProcessedNum++;
            //     }
            //     if (finishFlag) {
            //         break;
            //     }
            //     idx_j = 0;
            // }

            // this.currentIndex = [idx_i, idx_j];

            this.schedule(this.createItemsPerFrame, 0.02, macro.REPEAT_FOREVER, 0);
        } else {
            let curPointIdx = 0;
            for (let i = 0; i < height; i++) {
                for (let j = 0; j < width; j++) {
                    let pointNode = this.gameLayoutNode.children[curPointIdx++];
                    if (!pointNode) {
                        pointNode = poolMgr.pointNodePool.get();
                        if (!pointNode) {
                            pointNode = instantiate(this.pointPrefab);
                        }
                        pointNode.active = true;
                        this.gameLayoutNode.addChild(pointNode);
                    }

                    let pointComp = pointNode.getComponent(pointController);
                    pointComp.clearData();
                    pointComp.initData(this, new Vec2(i, j));
                    pointComp.setThemeColor();

                    let pointKey = i + "," + j;
                    this.pointMap.set(pointKey, pointComp);
                }
            }

            gameLayout.updateLayout();

            call && call();
        }
    }

    private createItemsPerFrame() {
        let hasIdx = 0;
        let width = this.gameAreaSize.x;
        let height = this.gameAreaSize.y;

        let idx_i = this.currentIndex[0];
        let idx_j = this.currentIndex[1];
        for (; idx_i < height; idx_i++) {
            for (; idx_j < width; idx_j++) {
                let pointNode = this.gameLayoutNode.children[this.createProcessedNum];
                //已有的情况下一帧加载400个，没有的情况下一帧加载200个
                this.batchSize = pointNode ? 400 : 200;
                if (!pointNode) {
                    pointNode = poolMgr.pointNodePool.get();
                    if (!pointNode) {
                        pointNode = instantiate(this.pointPrefab);
                    }
                    pointNode.active = true;
                    this.gameLayoutNode.addChild(pointNode);
                }

                let pointComp = pointNode.getComponent(pointController);
                pointComp.clearData();
                pointComp.initData(this, new Vec2(idx_i, idx_j));
                pointComp.setThemeColor();

                let pointKey = idx_i + "," + idx_j;
                this.pointMap.set(pointKey, pointComp);
                hasIdx++;
                this.createProcessedNum++;
                if (hasIdx >= this.batchSize) {
                    idx_j++;
                    break;
                }
            }
            if (hasIdx >= this.batchSize) {
                break;
            }
            idx_j = 0;
        }

        this.currentIndex = [idx_i, idx_j]; // 更新当前索引
        let isFinish = this.createProcessedNum >= this.createTotalNum;
        // 如果已经处理完所有元素，则取消调度
        if (isFinish) {
            this.unschedule(this.createItemsPerFrame);

            let gameLayout = this.gameLayoutNode.getComponent(Layout);
            gameLayout.updateLayout();

            this.frameCall && this.frameCall();
        }
    }

    /**关闭所有引导 */
    closeAllGuide() {
        for (let i = 0; i < this.guidePageList.length; i++) {
            this.guidePageList[i].active = false;
        }
        this.guideDialogueComp.closeDialogue();
    }

    /**检测引导 */
    checkGuide() {
        if (pData.level == 0) {
            this.guideDialogueComp.showDialogue("点击箭头移动");
            this.guidePageList[0].active = true;
            this.guidePageList[0].getChildByName("finger").getComponent(Animation).play();
            this.guidePageList[0].getChildByName("finger").position = new Vec3(110, 50, 0);
        }
        else if (pData.level == 1) {
            this.guideDialogueComp.showDialogue("双指外拨进行缩放");
            this.guidePageList[1].active = true;
            this.guidePageList[1].getChildByName("finger").getComponent(Animation).play();
        }
        else if (pData.level == 2) {
            this.guidePageList[2].active = true;
        }
    }

    /**点位加入对象池 */
    addPointNodeToPool() {
        let targetNum = pData.levelData.height * pData.levelData.width;
        console.log("目标点位数", targetNum, "当前已在屏幕中的点位数", this.gameLayoutNode.children.length, "对象池中点位数", poolMgr.pointNodePool.size());
        //目标数大于或者等于当前点位数，不加入对象池
        if (targetNum >= this.gameLayoutNode.children.length) {
            return;
        }

        for (let i = this.gameLayoutNode.children.length - 1; i >= targetNum; i--) {
            let node = this.gameLayoutNode.children[i];
            node.removeFromParent();
            node.active = false;
            poolMgr.pointNodePool.put(node);
        }

        console.log("加入对象池后，当前还在屏幕中的点位数", this.gameLayoutNode.children.length);
    }

    /**画笔加入对象池 */
    addDrawNodeToPool() {
        let targetNum = pData.levelData.arrowData.length;
        if (targetNum < this.drawList.children.length) {
            for (let i = this.drawList.children.length - 1; i >= targetNum; i--) {
                let node = this.drawList.children[i];
                let arrowComp = node.getComponent(arrowController);
                arrowComp.clearData();
                node.removeFromParent();
                node.active = false;
                poolMgr.drawNodePool.put(node);
            }
        }

        if (targetNum < this.lineList.children.length) {
            for (let j = this.lineList.children.length - 1; j >= targetNum; j--) {
                let node = this.lineList.children[j];
                let drawLineComp = node.getComponent(drawLineController);
                drawLineComp.clearData();
                node.removeFromParent();
                node.active = false;
                poolMgr.drawLineNodePool.put(node);
            }
        }
    }

    /**单个增加画笔进入对象池 */
    addDrawNodeToPoolOnece(arrowComp: arrowController) {
        // let drawNode = arrowComp.node;
        // let drawLineNode = arrowComp.drawLineComp.node;

        arrowComp.drawLineComp.clearData();
        arrowComp.clearData();

        // drawNode.removeFromParent();
        // drawNode.active = false;
        // poolMgr.drawNodePool.put(drawNode);

        // drawLineNode.removeFromParent();
        // drawLineNode.active = false;
        // poolMgr.drawLineNodePool.put(drawLineNode);
    }

    /**创建箭头 */
    createArrow(arrowData: number[][][]) {
        let colorArr = [];
        //规定每个箭头的颜色索引
        if (pData.colorArrowNum > 0) {
            let tempArr = Array.from({ length: arrowData.length }, (_, j) => j);
            for (let i = 0; i < pData.colorArrowNum; i++) {
                if (tempArr.length <= 0) {
                    return;
                }
                let random = Math.floor(Math.random() * tempArr.length);
                colorArr.push(tempArr[random]);
                tempArr.splice(random, 1);
            }
        }

        for (let i = 0; i < arrowData.length; i++) {
            let arrowDrawItem = this.drawList.children[i];
            if(!arrowDrawItem){
                //创建画笔
                arrowDrawItem = poolMgr.drawNodePool.get();
    
                if (!arrowDrawItem) {
                    arrowDrawItem = instantiate(this.drawItemPrefab);
                }
                arrowDrawItem.active = true;
                this.drawList.addChild(arrowDrawItem);
            }

            let drawLineItem = this.lineList.children[i];
            if(!drawLineItem){
                //创建辅助线画笔
                drawLineItem = poolMgr.drawLineNodePool.get();
                if (!drawLineItem) {
                    drawLineItem = instantiate(this.drawLineItemPrefab);
                }
    
                drawLineItem.active = true;
    
                this.lineList.addChild(drawLineItem);
            }

            let drawComp: arrowController = arrowDrawItem.getComponent(arrowController);
            drawComp.clearData();
            drawComp.gameComp = this;
            let drawLineComp = drawLineItem.getComponent(drawLineController);
            drawLineComp.clearData();
            drawComp.drawLineComp = drawLineComp;

            if (colorArr.indexOf(i) >= 0) {
                drawComp.isColorArrow = true;
            }

            let pointArr = [];
            for (let j = 0; j < arrowData[i].length; j++) {
                let pointPos = arrowData[i][j];
                let key = pointPos[0] + "," + pointPos[1];
                let comp: pointController = this.pointMap.get(key);
                comp.arrowComp = drawComp;
                pointArr.push(comp);
            }
            drawComp.drawByPoints(pointArr);
        }
    }

    /**创建大箭头 */
    createBigArrow(arrowData: number[][][]) {
        for (let i = 0; i < arrowData.length; i++) {
            //创建画笔
            let arrowDrawItem = poolMgr.drawNodePool.get();

            if (!arrowDrawItem) {
                arrowDrawItem = instantiate(this.drawItemPrefab);
            }
            arrowDrawItem.active = true;

            //创建辅助线画笔
            let drawLineItem = poolMgr.drawLineNodePool.get();
            if (!drawLineItem) {
                drawLineItem = instantiate(this.drawLineItemPrefab);
            }

            drawLineItem.active = true;

            this.drawList.addChild(arrowDrawItem);
            this.lineList.addChild(drawLineItem);
            let drawComp = arrowDrawItem.getComponent(arrowController);
            drawComp.clearData();
            drawComp.gameComp = this;
            let drawLineComp = drawLineItem.getComponent(drawLineController);
            drawLineComp.clearData();
            drawComp.drawLineComp = drawLineComp;

            //设置成大箭头类型
            drawComp.setArrowType(ArrowType.big);
            let arrowPoints = [];
            for (let j = 0; j < arrowData[i].length; j++) {
                let pointPos = arrowData[i][j];
                let key = pointPos[0] + "," + pointPos[1];
                let comp: pointController = this.pointMap.get(key);
                arrowPoints.push(comp);
            }
            drawComp.drawByPoints(arrowPoints);
            drawComp.setPointPathTouch(true);
        }
    }

    /**创建边缘道具 */
    createOutsidePropsArea(propsData: number[][]) {
        this.roundPosArr = [];
        if (!propsData || propsData.length <= 0) {
            return;
        }

        //先生成区域
        let rootNode = this.pointMap.get("0,0");
        //左上角的点要往左上移动两个单位
        let leftPos = new Vec3(rootNode.node.position.x - configData.pointWidth * 2, rootNode.node.position.y + configData.pointWidth * 2, 0);

        let offsetX = configData.pointWidth * (pData.levelData.width + 3);
        let offsetY = configData.pointWidth * (pData.levelData.height + 3);
        //先顺时针生成周围四个点
        //左上
        this.roundPosArr.push(leftPos);
        //右上
        this.roundPosArr.push(new Vec3(leftPos.x + offsetX, leftPos.y, 0));
        //右下
        this.roundPosArr.push(new Vec3(leftPos.x + offsetX, leftPos.y - offsetY, 0));
        //左下
        this.roundPosArr.push(new Vec3(leftPos.x, leftPos.y - offsetY, 0));

        //生成水平方向的点数量
        let horizontalNum = pData.levelData.width + 3;
        //生成垂直方向的点数量
        let verticalNum = pData.levelData.height + 3;

        //生成左上的一行
        for (let i = 0; i < horizontalNum; i++) {
            let posNode = instantiate(this.pointPrefab);

            this.propsPath.addChild(posNode);
            let pointComp = posNode.getComponent(pointController);
            pointComp.initOutsidePoint();
            posNode.setPosition(new Vec3(this.roundPosArr[0].x + i * configData.pointWidth, this.roundPosArr[0].y, this.roundPosArr[0].z));
        }


        //生成右上的一列
        for (let i = 0; i < verticalNum; i++) {
            let posNode = instantiate(this.pointPrefab);

            this.propsPath.addChild(posNode);
            let pointComp = posNode.getComponent(pointController);
            pointComp.initOutsidePoint();
            posNode.setPosition(new Vec3(this.roundPosArr[1].x, this.roundPosArr[1].y - i * configData.pointWidth, this.roundPosArr[1].z));
        }

        //生成右下的一行
        for (let i = 0; i < horizontalNum; i++) {
            let posNode = instantiate(this.pointPrefab);

            this.propsPath.addChild(posNode);
            let pointComp = posNode.getComponent(pointController);
            pointComp.initOutsidePoint();
            posNode.setPosition(new Vec3(this.roundPosArr[2].x - i * configData.pointWidth, this.roundPosArr[2].y, this.roundPosArr[2].z));
        }

        //生成左下的一列
        for (let i = 0; i < verticalNum; i++) {
            let posNode = instantiate(this.pointPrefab);

            this.propsPath.addChild(posNode);
            let pointComp = posNode.getComponent(pointController);
            pointComp.initOutsidePoint();
            posNode.setPosition(new Vec3(this.roundPosArr[3].x, this.roundPosArr[3].y + i * configData.pointWidth, this.roundPosArr[3].z));
        }

        //生成道具
        this.createOutsideProps(propsData);
    }

    /**生成边缘道具 */
    createOutsideProps(propsData: number[][]) {
        this.roundPropsArr = [];
        if (!propsData || propsData.length <= 0) {
            return;
        }
        for (let i = 0; i < propsData.length; i++) {
            //道具信息[道具类型,道具点位x,道具点位y,角度]
            let data = propsData[i];
            //0:糖豆人，1：生命值，2：时间
            let props = instantiate(this.externalPropsPrefabs[data[0]]);
            let propsComp = props.getComponent(propsController);
            this.propsPath.addChild(props);
            this.roundPropsArr.push(props);

            let pos = [data[1], data[2]];
            let offsetY = 0;
            //行
            if (pos[0] < 0) {
                offsetY = configData.pointWidth * (-pos[0]);
                pos[0] = 0;
            } else if (pos[0] >= pData.levelData.height) {
                offsetY = configData.pointWidth * (pos[0] - pData.levelData.height + 1) * -1;
                pos[0] = pData.levelData.height - 1;
            }

            let offsetX = 0;
            //列
            if (pos[1] < 0) {
                offsetX = configData.pointWidth * pos[1];
                pos[1] = 0;
            } else if (pos[1] >= pData.levelData.width) {
                offsetX = configData.pointWidth * (pos[1] - pData.levelData.width + 1);
                pos[1] = pData.levelData.width - 1;
            }

            let referenceNode = this.pointMap.get(pos[0] + "," + pos[1]);
            let rootPos = new Vec3(referenceNode.node.x + offsetX, referenceNode.node.y + offsetY, 0);
            props.setPosition(rootPos);

            let idx = 0;
            let angle = 0;
            //判断象限
            if (data[1] == -2 && data[2] <= pData.levelData.width) {
                //左上
                angle = 0;
                idx = 1;
            } else if (data[2] == pData.levelData.width + 1 && data[1] <= pData.levelData.height) {
                //右上
                angle = -90;
                idx = 2;
            } else if (data[1] == pData.levelData.height + 1 && data[2] > -2) {
                //右下
                angle = -180;
                idx = 3;
            } else {
                //左下
                angle = -270;
                idx = 0;
            }

            /**糖豆人需要增加旋转 */
            if (data[0] == ExternalPropsType.pac) {
                propsComp.imgNode.angle = angle;
            }

            this.animatePropsInLoop(props, idx, data[0] == ExternalPropsType.pac);
        }
    }

    /**道具循环动画 */
    animatePropsInLoop(propsNode, quadrant, isRotate = false) {
        // 确定起始点索引
        let startIndex = quadrant;

        // 首先从当前道具位置移动到起始角点
        const firstDistance = ccTools.calculateDistance(new Vec3(propsNode.position), new Vec3(this.roundPosArr[startIndex]));
        const firstDuration = firstDistance / configData.propsMoveSpeed;

        //先移动到第一个点位后进行循环
        let firstTween = tween()
            .to(firstDuration, { position: new Vec3(this.roundPosArr[startIndex]) })
            .call(() => {
                if (isRotate) {
                    propsNode.getComponent(propsController).imgNode.angle = (propsNode.getComponent(propsController).imgNode.angle - 90) % 360;
                }
            });

        // 创建循环路径的tween
        let loopTween = tween();

        // 构建循环路径
        for (let i = 0; i < 4; i++) {
            const fromIndex = (startIndex + i) % 4;
            const toIndex = (fromIndex + 1) % 4;

            // 计算两点间的距离
            const distance = ccTools.calculateDistance(this.roundPosArr[fromIndex], this.roundPosArr[toIndex]);
            const duration = distance / configData.propsMoveSpeed;

            // 添加到tween序列
            loopTween = loopTween
                .to(duration, { position: new Vec3(this.roundPosArr[toIndex]) })
                .call(() => {
                    if (isRotate) {
                        propsNode.getComponent(propsController).imgNode.angle = (propsNode.getComponent(propsController).imgNode.angle - 90) % 360;
                    }
                });
        }

        // 创建无限循环
        const finalTween = tween(propsNode)
            .then(firstTween)
            .call(() => {
                tween(propsNode)
                    .then(loopTween)
                    .repeatForever() // 重复执行路径
                    .start();
            })

        finalTween.start();
    }

    /**创建道具 */
    createInsideProps(propsData: number[][]) {
        if (!propsData || propsData.length <= 0) {
            return;
        }
        console.log("创建道具", propsData);
        for (let i = 0; i < propsData.length; i++) {
            let propsDataItem = propsData[i];
            let type = propsDataItem[0];
            let propsItem = instantiate(this.propsPrefabs[type]);
            let pos = [propsDataItem[1], propsDataItem[2]];
            let comp = this.pointMap.get(pos[0] + "," + pos[1]);
            this.propsPath.addChild(propsItem);

            let worldPos = comp.node.worldPosition;
            let localPos = this.propsPath.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
            propsItem.setPosition(localPos);
            comp.addProps(propsItem);
            let propsComp = propsItem.getComponent(propsController);
            propsComp.pointComp = comp;
            //管道需要旋转
            if (type == PropsType.pipe) {
                propsComp.setAngle(propsDataItem[3]);
            }
            propsComp.setNum(propsDataItem[4]);
        }
    }

    /**停止倒计时 */
    stopCountDown() {
        this.unschedule(this.updateCountDown);
    }

    /**初始化倒计时 */
    initCountDown() {
        this.countDownTime = pData.levelTime;
        this.countDownLab.string = ccTimeTools.formatTime(this.countDownTime);
        this.stopCountDown();
    }

    /**开始倒计时 */
    startCountDown() {
        this.stopCountDown();
        //此时已经归0了，直接回调
        if (this.countDownTime <= 0) {
            this.timeOutCall();
            return;
        }
        this.schedule(this.updateCountDown, 1);
    }

    /**倒计时更新 */
    updateCountDown() {
        this.countDownTime--;
        this.countDownLab.string = ccTimeTools.formatTime(this.countDownTime);
        if (this.countDownTime <= 0) {
            this.countDownTime = 0;
            //倒计时结束
            this.timeOutCall();
        }
    }

    /**时间结束回调 */
    timeOutCall() {
        this.stopCountDown();
        uiMgr.openPage(UIPath.UIFail, { type: FailType.TimeOut });
    }

    /**增加倒计时 */
    addCountDownTime(num: number) {
        this.countDownTime += num;
        if (this.countDownTime < 0) {
            this.countDownTime = 0;
        }
        this.countDownLab.string = ccTimeTools.formatTime(this.countDownTime);
        this.startCountDown();
    }

    /**刷新生命值 */
    refreshLife() {
        for (let i = 0; i < pData.maxLife; i++) {
            let lifeItem = this.lifeNode.children[i];
            let normal = lifeItem.getChildByName("normal");
            normal.active = i < pData.currentLife;
        }
    }

    /**初始化生命值 */
    initLife() {
        this.lifeNode.removeAllChildren();
        for (let i = 0; i < pData.maxLife; i++) {
            let lifeItem = instantiate(this.lifeItemPrefab);
            this.lifeNode.addChild(lifeItem);
        }
        this.refreshLife();
    }

    /**开始动画 */
    startAnim() {
        this.curScale = this.maxScale;
        this.fixScale();
        this.gameNode.position = new Vec3(0, -50, 0);
        let scaleObj = { value: this.maxScale };
        let targetScale = (this.maxScale - this.minScale) * 0.15 + this.minScale;
        tween(scaleObj)
            .to(1, { value: targetScale }, {
                onUpdate: (node, ratio) => {
                    this.curScale = scaleObj.value;
                    this.fixScale();
                }
            })
            .call(() => {
                this.noTouchNode.active = false;
                //检测引导
                this.checkGuide();
            })
            .start();
        if (pData.isSprint) {
            this.scheduleOnce(() => {
                this.sprintOpenNode.active = true;
                let openAnim = this.sprintOpenNode.getChildByName("openAnim").getComponent(Animation);
                openAnim.play();
            }, 0.6);
        }
    }

    /**通过大小修改地图缩放 */
    fixScale(num: number = 0) {
        let tempScale = this.curScale + num;
        if (tempScale < this.minScale) {
            tempScale = this.minScale;
        }
        if (tempScale > this.maxScale) {
            tempScale = this.maxScale;
        }

        this.curScale = tempScale;

        // console.log("当前缩放比例", this.curScale, '最小缩放比例', this.minScale);
        let percent = (this.curScale - this.minScale) / (this.maxScale - this.minScale);
        let offsetLenth = 800;//600 * (1.5 - percent);

        let minSize = view.getVisibleSize();
        //x，y不能小于屏幕宽度
        let fixX = Math.max(this.baseGameSize.x * this.curScale, minSize.x) + offsetLenth;
        let fixY = Math.max(this.baseGameSize.y * this.curScale, minSize.y) + offsetLenth;

        this.gameNode.getComponent(UITransform).setContentSize(fixX, fixY);
        this.gameLayoutNode.scale = new Vec3(this.curScale, this.curScale, 1);
        this.drawList.scale = new Vec3(this.curScale, this.curScale, 1);
        this.lineList.scale = new Vec3(this.curScale, this.curScale, 1);
        this.propsPath.scale = new Vec3(this.curScale, this.curScale, 1);

        this.scaleSlider.progress = percent;
    }

    /**判断开始成就进度 */
    checkStartAchiveProgress() {
        //当日关卡数
        let dayLevelNum = ccStorageTools.getLimitTimeData(SaveKey.challengeDayLevelNum) || 0;

        //今天第一次挑战
        if (dayLevelNum == 0) {
            //增加累计挑战天数
            pData.addTaskProgress(AchiveTaskType.challengeDay);

            let lastTime = ccStorageTools.getNumberData(SaveKey.lastChallengeTime);
            let continueNum = ccStorageTools.getNumberData(SaveKey.continuousDayNum);

            //前一天0点的时间戳
            let lastDayTime = ccTimeTools.getDayTime(-1);
            let curTime = ccTimeTools.getCurrentTime();
            //没有记录过或者记录的是前一天的时间戳，说明是连续挑战
            if (lastTime != lastDayTime) {
                continueNum = 0;
            }

            ccStorageTools.setData(SaveKey.lastChallengeTime, curTime);

            continueNum++;
            ccStorageTools.setData(SaveKey.continuousDayNum, continueNum);
            pData.setTaskProgress(AchiveTaskType.challengeDayDay, continueNum);
        }

        let playLevelNumArr = Object.assign({}, ccStorageTools.getData(SaveKey.playLevelNumArr) || {});

        if (!playLevelNumArr.hasOwnProperty(pData.level)) {
            playLevelNumArr[pData.level] = 1;
        } else {
            playLevelNumArr[pData.level]++;
        }

        let maxRepeatLevel = pData.getTaskProgress(AchiveTaskType.repeatChallengeLevel);
        let needCheckRepeat = playLevelNumArr[pData.level] > maxRepeatLevel;

        ccStorageTools.setData(SaveKey.playLevelNumArr, playLevelNumArr);
        pData.setTaskProgress(AchiveTaskType.repeatChallengeLevel, 0, needCheckRepeat);

        dayLevelNum++;
        ccStorageTools.setLimitTimeData(SaveKey.challengeDayLevelNum, dayLevelNum);

        //设置今日挑战多少关
        pData.setTaskProgress(AchiveTaskType.challengeDayLevel, dayLevelNum);
    }

    /**判断结束成就进度 */
    checkEndAchiveProgress() {
        //只剩1滴血的情况下通关
        if (pData.currentLife == 1) {
            pData.addTaskProgress(AchiveTaskType.passIn1Life);
        }

        //不扣血的情况下通关
        if (pData.currentLife >= pData.maxLife) {
            pData.addTaskProgress(AchiveTaskType.noBloodPass);
        }

        //在最后10秒内通关
        if (this.countDownTime <= 10) {
            pData.addTaskProgress(AchiveTaskType.last10Pass);
        }

        //60秒内通关
        if (pData.levelTime - this.countDownTime <= 60) {
            pData.addTaskProgress(AchiveTaskType.passIn60Sec);
        }

        //全程不使用辅助线的情况下通关
        if (!pData.isUseLine) {
            pData.addTaskProgress(AchiveTaskType.noLongPressPass);
        }

        //全程不放大缩小的情况下通关
        if (!pData.isScale) {
            pData.addTaskProgress(AchiveTaskType.noZoomPass);
        }

        //不看广告的情况下通关
        if (!pData.isShowAd) {
            pData.addTaskProgress(AchiveTaskType.noAdPass);
        }
    }

    /**播放结束动画 */
    playEndAnim() {
        //找到地图中心点坐标
        let centerPos = new Vec3(0, 0, 0);
        const distanceMap = new Map<number, any[]>();

        for (let i = 0; i < this.gameLayoutNode.children.length; i++) {
            let comp = this.gameLayoutNode.children[i].getComponent(pointController);
            let distance = Math.floor(Vec3.distance(centerPos, comp.node.position));

            comp.pointImg.active = true;
            // 将节点添加到对应距离的数组中
            if (!distanceMap.has(distance)) {
                distanceMap.set(distance, []);
            }
            distanceMap.get(distance).push(comp);
        }

        // 将距离按升序排列
        const sortedDistances = Array.from(distanceMap.keys()).sort((a, b) => a - b);

        let animationInterval = 1 / sortedDistances.length;
        for (let i = 0; i < sortedDistances.length; i++) {
            const distance = sortedDistances[i];
            const nodesAtDistance = distanceMap.get(distance);
            const delay = i * animationInterval;

            for (const comp of nodesAtDistance) {
                if (comp && comp.playPointAnim) {
                    comp.playPointAnim(delay, true, false); // 延迟播放动画
                }
            }
        }

        let scaleObj = { value: this.curScale };
        tween(scaleObj)
            .to(1, { value: this.minScale }, {
                onUpdate: (node, ratio) => {
                    this.curScale = scaleObj.value;
                    this.fixScale();
                }
            })
            .start();

        this.scheduleOnce(() => {
            uiMgr.openPage(UIPath.UISuccess);
        }, animationInterval * sortedDistances.length + 0.4);
    }

    /**初始化主题模式 */
    initThemeMode() {
        let showTagNode = this.switchBtn.getChildByName("showTagNode");
        let dark = showTagNode.getChildByName("dark").getComponent(UIOpacity);
        let bgDark = this.node.getChildByName("bg").getChildByName("dark").getComponent(UIOpacity);
        let topBgDark = this.node.getChildByName("topNode").getChildByName("dark").getComponent(UIOpacity);
        let bottomNode = this.node.getChildByName("bottomNode");
        let bottomBgDark = bottomNode.getChildByName("dark").getComponent(UIOpacity);
        let sliderBgDark = bottomNode.getChildByName("sliderBg").getChildByName("dark").getComponent(UIOpacity);
        let decScaleDark = this.decScaleBtn.getChildByName("dark").getComponent(UIOpacity);
        let addScaleDark = this.addScaleBtn.getChildByName("dark").getComponent(UIOpacity);

        //暂停动画
        Tween.stopAllByTarget(showTagNode);
        Tween.stopAllByTarget(dark);
        Tween.stopAllByTarget(bgDark);
        Tween.stopAllByTarget(topBgDark);
        Tween.stopAllByTarget(bottomBgDark);
        Tween.stopAllByTarget(sliderBgDark);
        Tween.stopAllByTarget(decScaleDark);
        Tween.stopAllByTarget(addScaleDark);

        let setDark = this.setBtn.getChildByName("dark");
        let switchDark = this.switchBtn.getChildByName("dark");
        let timeDark = this.timeNode.getChildByName("Clock").getChildByName("dark");
        let tipsDark = this.tipsBtn.getChildByName("bg").getChildByName("dark");
        let auxiliaryDark = this.auxiliaryBtn.getChildByName("bg").getChildByName("dark");

        dark.opacity = 0;
        bgDark.opacity = pData.themeMode == 0 ? 0 : 255;
        topBgDark.opacity = pData.themeMode == 0 ? 0 : 255;
        bottomBgDark.opacity = pData.themeMode == 0 ? 0 : 255;
        sliderBgDark.opacity = pData.themeMode == 0 ? 0 : 255;
        decScaleDark.opacity = pData.themeMode == 0 ? 0 : 255;
        addScaleDark.opacity = pData.themeMode == 0 ? 0 : 255;

        setDark.active = pData.themeMode == 1;
        switchDark.active = pData.themeMode == 1;
        timeDark.active = pData.themeMode == 1;
        tipsDark.active = pData.themeMode == 1;
        auxiliaryDark.active = pData.themeMode == 1;
        this.countDownLab.color = new Color(pData.themeMode == 0 ? "#515A77" : "#ffffff");

        let targetPos = new Vec3(pData.themeMode == 0 ? -60 : 60, 0, 0);
        showTagNode.position = targetPos;
    }

    /**切换主题模式 */
    switchThemeMode() {
        this.isSwitchTheme = true;
        pData.themeMode = (pData.themeMode + 1) % 2;

        ccStorageTools.setData(SaveKey.themeMode, pData.themeMode);

        let showTagNode = this.switchBtn.getChildByName("showTagNode");
        let dark = showTagNode.getChildByName("dark").getComponent(UIOpacity);
        let bgDark = this.node.getChildByName("bg").getChildByName("dark").getComponent(UIOpacity);
        let topBgDark = this.node.getChildByName("topNode").getChildByName("dark").getComponent(UIOpacity);
        let bottomNode = this.node.getChildByName("bottomNode");
        let bottomBgDark = bottomNode.getChildByName("dark").getComponent(UIOpacity);
        let sliderBgDark = bottomNode.getChildByName("sliderBg").getChildByName("dark").getComponent(UIOpacity);
        let decScaleDark = this.decScaleBtn.getChildByName("dark").getComponent(UIOpacity);
        let addScaleDark = this.addScaleBtn.getChildByName("dark").getComponent(UIOpacity);

        //暂停动画
        Tween.stopAllByTarget(showTagNode);
        Tween.stopAllByTarget(dark);
        Tween.stopAllByTarget(bgDark);
        Tween.stopAllByTarget(topBgDark);
        Tween.stopAllByTarget(bottomBgDark);
        Tween.stopAllByTarget(sliderBgDark);
        Tween.stopAllByTarget(decScaleDark);
        Tween.stopAllByTarget(addScaleDark);

        let setDark = this.setBtn.getChildByName("dark");
        let switchDark = this.switchBtn.getChildByName("dark");
        let timeDark = this.timeNode.getChildByName("Clock").getChildByName("dark");
        let tipsDark = this.tipsBtn.getChildByName("bg").getChildByName("dark");
        let auxiliaryDark = this.auxiliaryBtn.getChildByName("bg").getChildByName("dark");

        let aniTime = 0.3;

        let rootShowTagPosX = 0;
        let targetShowTagPosX = 0;
        let rootDarkOpacity = 255;
        let targetDarkOpacity = 0;

        let rootOpacity = 0;
        let targetOpacity = 0;

        if (pData.themeMode == 0) {
            rootShowTagPosX = 60;
            targetShowTagPosX = -60;

            rootOpacity = 255;
            targetOpacity = 0;
        } else {
            rootShowTagPosX = -60;
            targetShowTagPosX = 60;

            rootOpacity = 0;
            targetOpacity = 255;
        }

        setDark.active = pData.themeMode == 1;
        switchDark.active = pData.themeMode == 1;
        timeDark.active = pData.themeMode == 1;
        tipsDark.active = pData.themeMode == 1;
        auxiliaryDark.active = pData.themeMode == 1;
        this.countDownLab.color = new Color(pData.themeMode == 0 ? "#515A77" : "#ffffff");

        gm.Event.emit(GameEvent.switchTheme);

        tween(showTagNode)
            .set({ position: new Vec3(rootShowTagPosX, 0, 0) })
            .to(aniTime, { position: new Vec3(targetShowTagPosX, 0, 0) })
            .call(() => {
                this.isSwitchTheme = false;
            })
            .start();
        tween(dark)
            .set({ opacity: rootDarkOpacity })
            .to(aniTime, { opacity: targetDarkOpacity })
            .start();

        //通用函数-播放暗黑动画
        let playDarkAnim = (uiOp: UIOpacity) => {
            tween(uiOp)
                .set({ opacity: rootOpacity })
                .to(aniTime, { opacity: targetOpacity })
                .start();
        }

        playDarkAnim(bgDark);
        playDarkAnim(topBgDark);
        playDarkAnim(bottomBgDark);
        playDarkAnim(sliderBgDark);
        playDarkAnim(decScaleDark);
        playDarkAnim(addScaleDark);
    }

    /**刷新冲刺关卡阶段 */
    refreshSprintStage() {
        if (pData.currentStage < 0) {
            return;
        }

        //当前的颜色
        let color = new Color(stageColor[pData.currentStage]);
        let progressBar = this.topSprintMask.getChildByName("progressBar").getComponent(Sprite);
        let extendAnim = this.topSprintNode.getChildByName("extendAnim");
        progressBar.color = color;
        extendAnim.getComponent(Sprite).color = color;

        let bottomProgressBar = this.bottomSprintMask.getChildByName("progressBar").getComponent(Sprite);
        let bottomExtendAnim = this.bottomSprintNode.getChildByName("extendAnim");
        bottomProgressBar.color = color;
        bottomExtendAnim.getComponent(Sprite).color = color;
    }

    protected update(dt: number): void {
        if (this.canSprintUpdate && this.curSprintStage > 0) {
            this.updateSprintStage(dt);
        }
    }

    /**刷新冲刺关卡阶段 */
    updateSprintStage(dt) {
        let stage = 0;
        if (this.curSprintStage > 0.75) {
            stage = 3;
        } else if (this.curSprintStage > 0.5) {
            stage = 2;
        } else if (this.curSprintStage > 0.25) {
            stage = 1;
        } else {
            stage = 0;
        }

        let decNum = this.sprintDecNumArr[stage];
        this.curSprintStage -= decNum * dt;
        if (this.curSprintStage < 0) {
            this.curSprintStage = 0;
            pData.fixComboNum(-9999);
            this.closeSrpint();
        }
        this.topSprintMask.getComponent(UITransform).width = 1080 * this.curSprintStage;
        this.bottomSprintMask.getComponent(UITransform).width = 1080 * this.curSprintStage;
    }

    /**关闭节点上的组件及其动画 */
    closeSprintByNode(node, maskNode) {
        let arrowLeft = maskNode.getChildByName("arrowLeft");
        let arrowRight = maskNode.getChildByName("arrowRight");
        let redBg = node.getChildByName("redBg");
        let redUiop = redBg.getComponent(UIOpacity);
        let centerLight = node.getChildByName("light");
        let lightUiop = centerLight.getComponent(UIOpacity);
        let extendAnim = node.getChildByName("extendAnim");
        let extendUitrans = extendAnim.getComponent(UITransform);
        Tween.stopAllByTarget(arrowLeft);
        Tween.stopAllByTarget(arrowRight);
        Tween.stopAllByTarget(redUiop);
        Tween.stopAllByTarget(centerLight);
        Tween.stopAllByTarget(lightUiop);
        Tween.stopAllByTarget(extendUitrans);

        centerLight.active = false;
        extendAnim.active = false;

        maskNode.getComponent(UITransform).width = 0;
        redBg.active = false;

        node.active = false;
    }

    /**关闭冲刺关卡相关 */
    closeSrpint() {
        this.closeSprintByNode(this.topSprintNode, this.topSprintMask);
        this.closeSprintByNode(this.bottomSprintNode, this.bottomSprintMask);
    }

    /**播放冲刺节点动画 */
    playSprintAnimByNode(node, maskNode) {
        node.active = true;
        this.canSprintUpdate = true;
        let arrowLeft = maskNode.getChildByName("arrowLeft");
        let arrowRight = maskNode.getChildByName("arrowRight");
        let progressLight = maskNode.getChildByName("progressLight");
        let redBg = node.getChildByName("redBg");
        let redUiop = redBg.getComponent(UIOpacity);
        let centerLight = node.getChildByName("light");
        let lightUiop = centerLight.getComponent(UIOpacity);
        let extendAnim = node.getChildByName("extendAnim");
        let extendUitrans = extendAnim.getComponent(UITransform);
        Tween.stopAllByTarget(arrowLeft);
        Tween.stopAllByTarget(arrowRight);
        Tween.stopAllByTarget(redUiop);
        Tween.stopAllByTarget(centerLight);
        Tween.stopAllByTarget(lightUiop);
        Tween.stopAllByTarget(extendUitrans);
        centerLight.active = false;

        progressLight.getComponent(ParticleSystem2D).resetSystem();

        if (pData.currentStage >= 3) {
            //红底动画
            if (!redBg.active) {
                redBg.active = true;
                tween(redUiop)
                    .set({ opacity: 255 })
                    .to(0.5, { opacity: 180 })
                    .to(0.5, { opacity: 255 })
                    .union()
                    .repeatForever()
                    .start();
            }

            //冲刺最终阶段的光效动画
            centerLight.active = true;
            tween(lightUiop)
                .parallel(
                    tween(centerLight)
                        .set({ scale: new Vec3(0.2, 0.2, 1) }),
                    tween(lightUiop)
                        .set({ opacity: 51 })
                )
                .parallel(
                    tween(centerLight)
                        .to(0.3, { scale: new Vec3(1, 1, 1) }),
                    tween(lightUiop)
                        .to(0.3, { opacity: 255 })
                )
                .to(0.2, { opacity: 0 })
                .call(() => {
                    centerLight.active = false;
                })
                .start();
        } else {
            redBg.active = false;
        }

        //向左移动的箭头动画
        tween(arrowLeft)
            .set({ position: new Vec3(0, 0, 0), scale: new Vec3(1, 1, 1) })
            .to(0.1, { scale: new Vec3(1.3, 1.3, 1) })
            .parallel(
                tween(arrowLeft)
                    .to(0.2, { scale: new Vec3(1, 1, 1) }),
                tween(arrowLeft)
                    .to(1, { position: new Vec3(-540, 0, 0) }),
            )
            .union()
            .repeatForever()
            .start();
        //向右移动的箭头动画
        tween(arrowRight)
            .set({ position: new Vec3(0, 0, 0), scale: new Vec3(1, 1, 1) })
            .to(0.1, { scale: new Vec3(1.3, 1.3, 1) })
            .parallel(
                tween(arrowRight)
                    .to(0.1, { scale: new Vec3(1, 1, 1) }),
                tween(arrowRight)
                    .to(1, { position: new Vec3(540, 0, 0) })
            )
            .union()
            .repeatForever()
            .start();
        //背景延申动画
        extendAnim.active = true;
        tween(extendUitrans)
            .set({ width: 0 })
            .to(0.15, { width: 1080 })
            .call(() => {
                extendAnim.active = false;
            })
            .start();
    }

    /**检测冲刺关卡 */
    checkSprint() {
        if (pData.comboNum == configData.stageArr[0]) {
            this.curSprintStage = 0.25;
        } else if (pData.comboNum > configData.stageArr[0]) {
            this.curSprintStage += 0.1;
        }

        //检测连击的连续消除
        for (let i = 0; i < configData.extraRemoveLimitArr.length; i++) {
            if (pData.comboNum == configData.extraRemoveLimitArr[i]) {
                //移出两个箭头
                this.colorArrowOutCall(2);
                break;
            }
        }

        //限制大小
        if (this.curSprintStage > 1) {
            this.curSprintStage = 1;
        } else if (this.curSprintStage < 0) {
            this.curSprintStage = 0;
        }

        if (this.curSprintStage > 0) {
            this.playSprintAnimByNode(this.topSprintNode, this.topSprintMask);
            this.playSprintAnimByNode(this.bottomSprintNode, this.bottomSprintMask);

            let comboLab = this.topSprintNode.getChildByName("comboLab");

            comboLab.getComponent(Label).string = pData.comboNum.toString() + "连击";
            tween(comboLab)
                .set({ scale: new Vec3(1, 1, 1) })
                .to(0.1, { scale: new Vec3(1.4, 1.4, 1) })
                .to(0.1, { scale: new Vec3(1, 1, 1) })
                .start();
        }
    }

    /**修改箭头完成进度
     * @param isAdd 是否增加(成功移动时增加，撞到障碍物时回退进度)
     */
    fixArrowCompleteProgress(isAdd = true) {
        if (isAdd) {
            pData.curArrowNum++;
        } else {
            pData.curArrowNum--;
        }

        //检测冲刺关卡
        //刷新冲刺关卡阶段
        if (pData.isSprint) {
            pData.fixComboNum(isAdd ? 1 : -1);
            this.checkSprint();
        }

        if (pData.curArrowNum >= pData.maxArrowNum) {
            //通关增加任务进度
            this.checkEndAchiveProgress();

            this.stopCountDown();
            //停止冲刺进度条更新
            this.canSprintUpdate = false;
            this.playEndAnim();
        }
    }

    /**箭头完全移出回调 */
    arrowOutCall() {
        gm.Event.emit(GameEvent.removeArrow);
    }

    /**箭头错误回调 */
    arrowErrorCall() {
        pData.addLife(-1);
        //扣血增加任务进度
        pData.addTaskProgress(AchiveTaskType.blood);

        //只弹出一次游戏结束提示
        if (pData.currentLife == 0) {
            this.stopCountDown();
            //停止冲刺进度条更新
            this.canSprintUpdate = false;
            uiMgr.openPage(UIPath.UIFail, { type: FailType.LifeZero });
        }
    }

    /**设置视图启动 */
    setScrollEnabled(flag) {
        this.scroll.enabled = flag;
    }

    /**通过世界坐标将视图对准中间 */
    scrollToOffset(pos) {
        let referenceNode = this.pointMap.get("0,0");
        let referencePos = new Vec3(referenceNode.node.position);

        // console.log("pos", pos, "referencePos", referencePos);

        let offsetPos = new Vec2((pos.x - referencePos.x) * this.curScale, (referencePos.y - pos.y) * this.curScale);
        this.scroll.scrollToOffset(offsetPos, 0.3);
    }

    /**开始移出彩色箭头回调 */
    colorArrowOutCall(num = 7) {
        //飞出七个箭头
        for (let i = 0; i < num; i++) {
            for (let j = 0; j < this.drawList.children.length; j++) {
                let arrowComp = this.drawList.children[j].getComponent(arrowController);
                //不能在飞行途中或者彩色箭头
                if (!arrowComp.canMove && !arrowComp.isColorArrow && arrowComp.checkArrowMove(false)) {
                    //移动箭头
                    arrowComp.checkArrowMove();
                    break;
                }
            }
        }
    }

    /**检测外围道具碰撞 */
    checkOutsideProps(worldPos) {
        for (let i = 0; i < this.roundPropsArr.length; i++) {
            let propsNode = this.roundPropsArr[i];
            if (!propsNode || !propsNode.active) {
                continue;
            }
            let bound = propsNode.getComponent(UITransform).getBoundingBoxToWorld();
            if (bound.contains(worldPos)) {
                // console.warn("道具碰撞", propsNode.name);
                return propsNode;
            }
        }
        return null;
    }

    /**提示箭头 */
    useTipsProps() {
        for (let i = 0; i < this.drawList.children.length; i++) {
            let arrowComp = this.drawList.children[i].getComponent(arrowController);
            //正在移动或者提示中，不提示箭头
            if (arrowComp.canMove || arrowComp.arrowTipNode.active) {
                continue;
            }
            let canMove = arrowComp.checkArrowMove(false);
            if (canMove) {
                arrowComp.isShowAuxiliaryLine = true;
                arrowComp.playArrowTipAnim();
                arrowComp.draw();
                // 拉到最大
                this.fixScale(999);
                let arrowTopsNode = arrowComp._ArrowPoints[0].node;
                // let arrowWorldPos = arrowTopsNode.worldPosition;
                this.scrollToOffset(arrowTopsNode.position);
                return;
            }
        }
        uiMgr.showTips("未找到可提示的箭头");
    }

    /**使用辅助线道具 */
    useAuxiliaryProps() {
        pData.isUseAuxiliaryLine = true;
        pData.isShowAuxiliaryLine = !pData.isShowAuxiliaryLine;
        this.auxiliaryLineControl(pData.isShowAuxiliaryLine);
        this.refreshPropsNum();
    }

    /**辅助线控制 */
    auxiliaryLineControl(isShow: boolean) {
        for (let i = 0; i < this.drawList.children.length; i++) {
            let arrowComp = this.drawList.children[i].getComponent(arrowController);
            arrowComp.isShowAuxiliaryLine = isShow;
            arrowComp.draw();
        }
    }

    /**刷新道具数量 */
    refreshPropsNum() {
        let tipsNum = pData.getPropsNum(PropsName.tips);
        let auxiliaryNum = pData.getPropsNum(PropsName.auxiliary);

        let tipsNumNode = this.tipsBtn.getChildByName("numNode");
        let tipsConditionImg = tipsNumNode.getChildByName("conditionImg");
        let tipsNumLab = tipsNumNode.getChildByName("numLab").getComponent(Label);
        tipsNumLab.string = tipsNum.toString();
        tipsNumLab.node.active = tipsNum > 0;
        tipsConditionImg.active = tipsNum <= 0;

        let auxiliaryNumNode = this.auxiliaryBtn.getChildByName("numNode");
        let auxiliaryConditionImg = auxiliaryNumNode.getChildByName("conditionImg");
        let auxiliaryNumLab = auxiliaryNumNode.getChildByName("numLab").getComponent(Label);
        let auxiliaryShowImg = this.auxiliaryBtn.getChildByName("kai");
        let auxiliaryCloseImg = this.auxiliaryBtn.getChildByName("guan");
        auxiliaryNumLab.string = auxiliaryNum.toString();
        //数字
        auxiliaryNumLab.node.active = auxiliaryNum > 0;
        //分享
        auxiliaryConditionImg.active = auxiliaryNum <= 0;

        auxiliaryNumNode.active = !pData.isUseAuxiliaryLine;
        auxiliaryShowImg.active = pData.isUseAuxiliaryLine && !pData.isShowAuxiliaryLine;
        auxiliaryCloseImg.active = pData.isUseAuxiliaryLine && pData.isShowAuxiliaryLine;
    }

    /**复活游戏 */
    resurrectionGame(type: FailType) {
        //复活游戏增加任务进度
        pData.addTaskProgress(AchiveTaskType.resurrection);

        //是冲刺关卡且连击大于最低连击显示
        if (pData.isSprint && pData.comboNum >= configData.stageArr[0]) {
            //开启冲刺进度条更新
            this.canSprintUpdate = true;
        }

        if (type == FailType.TimeOut) {
            this.addCountDownTime(120);
        } else if (type == FailType.LifeZero) {
            pData.addLife();
            this.startCountDown();
        }
    }

    onTouchStart(event: EventTouch) {
        if (this.guidePageList[1].active) {
            this.clickGuide2();
        }

        this.touchNum = event.getTouches().length;
        this.isDeleteAuxiliaryLineTimer = true;
        if (this.touchNum === 2 && this.scroll.enabled) {
            this.scroll.horizontal = false;
            this.scroll.vertical = false;
            this.scroll.stopAutoScroll();
            let pos1 = event.getTouches()[0].getUILocation();
            let pos2 = event.getTouches()[1].getUILocation();
            this.touchDistance = ccTools.calculateDistance(pos1, pos2);
            event.propagationStopped = true;
        }
    }

    onTouchMove(event: EventTouch) {
        this.touchNum = event.getTouches().length;
        //双指，且需要滚动视图启动
        if (this.touchNum === 2 && this.scroll.enabled) {
            if (this.isDeleteAuxiliaryLineTimer) {
                console.log("取消辅助线计时器");
                this.isDeleteAuxiliaryLineTimer = false;
                gm.Event.emit(GameEvent.cancelAuxiliaryLine);
            }
            this.scroll.horizontal = false;
            this.scroll.vertical = false;
            this.scroll.stopAutoScroll();
            let pos1 = event.getTouches()[0].getUILocation();
            let pos2 = event.getTouches()[1].getUILocation();
            let currentDistance = ccTools.calculateDistance(pos1, pos2);

            // 计算缩放比例
            let delta = currentDistance - this.touchDistance;
            let scaleFactor = delta / 2000; // 调整敏感度
            //console.log(this.currentScale + "   " + scaleFactor);
            this.touchDistance = currentDistance;
            if (scaleFactor > 0.2) {
                return;
            }

            pData.isScale = true;

            this.fixScale(scaleFactor);

            // 更新触摸距离
            event.propagationStopped = true;
        }
    }

    onTouchEnd(event: any) {
        this.touchNum = event.getTouches().length;
        this.touchDistance = 0;
        this.scroll.horizontal = true;
        this.scroll.vertical = true;
    }

    /**箭头开始移动回调 */
    onArrowMoveStart() {
        if (pData.level == 0) {
            this.clickGuide1();
        }
    }

    /**播放小箭头点位动画 */
    playSmallArrowAnim(pointArr: pointController[]) {
        for (let i = 0; i < pointArr.length; i++) {
            let pointComp = pointArr[pointArr.length - 1 - i];
            pointComp.playPointAnim(configData.arrowAnimInterval * i + 0.08);
        }
    }

    /**播放大箭头点位的波浪动画 */
    playBigArrowAnim(rootPos: pointController, dir: Vec2) {
        this.playWaveAnim(rootPos, dir);
        //延时再播放一次
        this.scheduleOnce(() => {
            this.playWaveAnim(rootPos, dir);
        }, 0.8);
    }

    /**单次播放大箭头波纹动画 */
    playWaveAnim(rootPos: pointController, dir: Vec2) {
        let maxLenth = Math.max(pData.levelData.height, pData.levelData.width);
        let fixDir = new Vec2(-dir.y, dir.x);
        this.scheduleOnce(() => {
            this.playBigArrowWaveAnimation(rootPos, fixDir);
        });

        for (let i = 1; i < maxLenth; i++) {
            let pos1 = new Vec2(rootPos.pos.x + dir.x * i, rootPos.pos.y + dir.y * i);
            //反方向的点位
            let pos2 = new Vec2(rootPos.pos.x + dir.x * i * -1, rootPos.pos.y + dir.y * i * -1);

            let pointComp1 = this.pointMap.get(pos1.x + "," + pos1.y);
            let pointComp2 = this.pointMap.get(pos2.x + "," + pos2.y);
            //两个方向都没有点位了直接跳出循环
            if (!pointComp1 && !pointComp2) {
                break;
            }

            this.scheduleOnce(() => {
                if (pointComp1) {
                    this.playBigArrowWaveAnimation(pointComp1, fixDir);
                }
                if (pointComp2) {
                    this.playBigArrowWaveAnimation(pointComp2, fixDir);
                }
            }, configData.bigArrowExtendTime * i);
        }
    }

    /**从指定点位开始播放指定方向的动画 */
    playBigArrowWaveAnimation(rootPos: pointController, dir: Vec2) {
        let idx = 0;
        while (true) {
            let pointPos = new Vec2(rootPos.pos.x + dir.x * idx, rootPos.pos.y + dir.y * idx);
            let pointComp = this.pointMap.get(pointPos.x + "," + pointPos.y);
            //没找到点位，跳出循环
            if (!pointComp) {
                break;
            }
            pointComp.playPointAnim(configData.arrowAnimInterval * idx, false);
            idx++;
        }
    }

    /**开始测试游戏关卡 */
    startTestGame() {
        let intervalTime = 0.5;
        //有道具的关卡时间翻倍
        if ((pData.levelData.externalPropsData && pData.levelData.externalPropsData.length > 0) || (pData.levelData.propsData && pData.levelData.propsData.length > 0)) {
            intervalTime = 1;
        }
        this.schedule(this.checkNextArrow, intervalTime);
    }

    /**停止测试游戏关卡 */
    stopTestGame() {
        this.unschedule(this.checkNextArrow);
    }

    /**检测下一个箭头 */
    checkNextArrow() {
        let canMove = false;
        for (let j = 0; j < this.drawList.children.length; j++) {
            let arrowComp = this.drawList.children[j].getComponent(arrowController);
            //不能在飞行途中
            if (!arrowComp.canMove && arrowComp.checkArrowMove(false)) {
                //移动箭头
                arrowComp.checkArrowMove();
                canMove = true;
                break;
            }
        }

        if (!canMove) {
            //没有箭头可以移动了，游戏结束
            uiMgr.showTips("没有箭头可以移动了，游戏结束");
            this.stopTestGame();
        }
    }

    ///
    ///点击函数
    ///

    /**监听按钮点击事件 */
    onKeyDown(event: EventKeyboard) {
        switch (event.keyCode) {
            case KeyCode.KEY_P:
                this.consoleNode.active = !this.consoleNode.active;
                break;
            case KeyCode.KEY_S:
                pData.addLevel();
                this.initData();
                // uiMgr.openPage(UIPath.UISuccess);
                break;
            case KeyCode.KEY_R:
                uiMgr.showAchiveTips(1);
                break;
        }
    }

    /**鼠标滚轴事件 */
    onMouseWheel(event: EventMouse) {
        // 获取滚轮滚动值
        const scrollY = event.getScrollY();
        // 或 const scrollX = event.getScrollX();

        pData.isScale = true;
        // 判断滚动方向
        if (scrollY > 0) {
            this.fixScale(this.mouseScaleStep);
        } else if (scrollY < 0) {
            this.fixScale(-this.mouseScaleStep);
        }
    }

    /**滑动条监测(只检测手动滑动) */
    onScaleChange(slider: Slider) {
        // console.log(slider.progress);
        let scale = slider.progress * (this.maxScale - this.minScale) + this.minScale;
        let fixScale = scale - this.curScale;

        pData.isScale = true;
        this.fixScale(fixScale);
    }

    /**点击设置按钮 */
    clickSetBtn() {
        uiMgr.openPage(UIPath.UISetting, { mode: 1 });
    }

    /**点击提示按钮 */
    clickTipsBtn() {
        if (pData.getPropsNum(PropsName.tips) > 0) {
            pData.fixPropsNum(PropsName.tips, -1);
            this.useTipsProps();
        } else {
            uiMgr.openPage(UIPath.UIProps, { pageIdx: 1 });
        }
    }

    /**点击辅助按钮 */
    clickAuxiliaryBtn() {
        if (pData.isUseAuxiliaryLine) {
            //已经使用过则直接使用
            this.useAuxiliaryProps();
        } else {
            //未使用过
            if (pData.getPropsNum(PropsName.auxiliary) > 0) {
                pData.fixPropsNum(PropsName.auxiliary, -1);
                this.useAuxiliaryProps();
            } else {
                uiMgr.openPage(UIPath.UIProps, { pageIdx: 2 });
            }
        }
    }

    /**点击输入按钮 */
    clickInputBtn() {
        if (this.inputLab.string == "") {
            console.log("请输入输入内容");
            return;
        }

        let data = JSON.parse(this.inputLab.string);

        this.initData({ inputData: data });
    }

    /**点击跳转按钮 */
    clickSkipBtn() {
        let levelNum = this.levelEditBox.string;
        if (levelNum == "" || Number(levelNum) <= 0) {
            uiMgr.showTips("请输入正确的关卡");
            return;
        }
        pData.level = Number(levelNum) - 1;
        this.initData();
    }

    /**点击测试按钮 */
    clickTestBtn() {
        this.startTestGame();
    }

    /**点击引导1 */
    clickGuide1() {
        if (this.firstGuideNum >= 2) {
            return;
        }

        if (this.firstGuideNum == 0) {
            this.guidePageList[0].getChildByName("finger").position = new Vec3(220, 50, 0);
        } else {
            this.guidePageList[0].getChildByName("finger").getComponent(Animation).stop();
            this.guidePageList[0].active = false;
            this.guideDialogueComp.closeDialogue();
        }
        this.firstGuideNum++;
    }

    /**点击引导2 */
    clickGuide2() {
        this.guidePageList[1].getChildByName("finger").getComponent(Animation).stop();
        this.guidePageList[1].active = false;
        this.guideDialogueComp.closeDialogue();
    }

    /**点击主题切换按钮 */
    clickSwitchBtn() {
        if (this.isSwitchTheme) {
            return;
        }
        this.switchThemeMode();
    }

    /**点击下一关（用以测试） */
    clickNextBtn() {
        pData.addLevel();
        this.initData();
    }

    /**点击增加缩放按钮 */
    clickAddScaleBtn() {
        this.fixScale(this.scaleStep);
    }

    /**点击减少缩放按钮 */
    clickDecScaleBtn() {
        this.fixScale(-this.scaleStep);
    }
}