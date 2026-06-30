import { _decorator, Color, Component, EventTouch, Label, Node, Sprite, Tween, tween, UITransform, Vec2, Vec3 } from 'cc';
import { arrowController } from './arrowController';
import { UIGame } from '../UIPage/UIGame';
import { pData } from '../manager/playerData';
import { propsController, PropsType } from './propsController';
import { gm } from '../manager/gm';
import { GameEvent, stageColor } from '../manager/configData';
import { ccTimeTools } from '../extention/timeTools';
import { ccTools } from '../extention/generalTools';
const { ccclass, property } = _decorator;

@ccclass('pointController')
export class pointController extends Component {
    /**坐标位置 */
    pos: Vec2 = new Vec2(0, 0);

    /**点位绑定的绘制组件 */
    arrowComp: arrowController = null;
    /**临时使用的箭头组件 */
    tempArrowComp: arrowController = null;

    pointImg: Node = null

    /**道具槽 */
    private propsSlot: Node = null;

    /**编辑器控制 */
    gameComp: UIGame = null;
    /**主题颜色 0：白天，1：黑夜 */
    themeColorArr = ["#BBBADA", "#656984"];
    /**是否展示辅助线 */
    isShowAuxiliaryLine: boolean = false;

    protected onLoad(): void {
        this.pointImg = this.node.getChildByName("img");
    }

    protected onEnable(): void {
        this.addEventListener();
    }

    protected onDisable(): void {
        this.removeEventListener();
    }

    initData(comp: UIGame, pos: Vec2) {
        this.gameComp = comp;
        this.addListener();
        this.initPos(pos);
    }

    /**清除需要的数据 */
    clearData() {
        this.pointImg.active = false;
        this.isShowAuxiliaryLine = false;
        this.arrowComp = null;
        this.tempArrowComp = null;
        this.gameComp = null;
        this.unscheduleAllCallbacks();
        this.delateProps();
    }

    initOutsidePoint() {
        this.pointImg.active = true;
        this.pointImg.getComponent(Sprite).color = new Color("#eea840");
    }

    /**添加事件监听 */
    addEventListener() {
        this.removeListener();
        gm.Event.on(GameEvent.removeArrow, this.reducePropsNum, this);
        gm.Event.on(GameEvent.switchTheme, this.setThemeColor, this);
    }

    /**移除事件监听 */
    removeEventListener() {
        gm.Event.off(GameEvent.removeArrow, this.reducePropsNum, this);
        gm.Event.off(GameEvent.switchTheme, this.setThemeColor, this);
    }

    /**添加监听 */
    addListener() {
        //添加之前先清除之前的监听
        this.removeListener();
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart.bind(this));
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd.bind(this));
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel.bind(this));
        gm.Event.on(GameEvent.cancelAuxiliaryLine, this.cancelAuxiliaryLine, this);
    }

    /**移除监听 */
    removeListener() {
        this.node.off(Node.EventType.TOUCH_START);
        this.node.off(Node.EventType.TOUCH_END);
        this.node.off(Node.EventType.TOUCH_CANCEL);
        gm.Event.off(GameEvent.cancelAuxiliaryLine, this.cancelAuxiliaryLine, this);
    }

    /**初始化坐标 */
    initPos(pos: Vec2) {
        this.pos = pos;
    }

    /**设置主题颜色 */
    setThemeColor() {
        this.pointImg.getComponent(Sprite).color = new Color(this.themeColorArr[pData.themeMode]);
    }

    /**取消辅助线计时器 */
    cancelAuxiliaryLine() {
        this.unschedule(this.showAuxiliaryLine);
    }

    /**初始化临时使用的箭头组件 */
    initTempArrowComp(touchLocation) {
        this.tempArrowComp = null;
        if (this.arrowComp) {
            this.tempArrowComp = this.arrowComp;
        } else {
            // 获取当前节点的世界坐标
            const nodeWorldPos = this.node.worldPosition;

            // 将世界坐标转换为UI坐标进行比较（或者直接使用世界坐标）
            // 计算触摸点相对于当前点的偏移
            const offsetX = touchLocation.x - nodeWorldPos.x;
            const offsetY = touchLocation.y - nodeWorldPos.y;

            let posArr;
            // 计算角度或直接通过坐标差值判断方向
            if (Math.abs(offsetX) > Math.abs(offsetY)) {
                // X方向变化更大，判断左右
                if (offsetX > 0) {
                    // console.log("点击位置在右边");
                    // 可以设置一个属性记录方向
                    posArr = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                } else {
                    // console.log("点击位置在左边");
                    posArr = [[0, -1], [0, 1], [-1, 0], [1, 0]];
                }
            } else {
                // Y方向变化更大，判断上下
                if (offsetY > 0) {
                    // console.log("点击位置在上边");
                    posArr = [[-1, 0], [0, -1], [1, 0], [0, 1]];
                } else {
                    // console.log("点击位置在下边");
                    posArr = [[1, 0], [0, -1], [-1, 0], [0, 1]];
                }
            }

            for (let i = 0; i < posArr.length; i++) {
                let nextPos = new Vec2(this.pos.x + posArr[i][0], this.pos.y + posArr[i][1]);
                let nextPointComp: pointController = this.gameComp.pointMap.get(nextPos.x + ',' + nextPos.y);
                if (nextPointComp && nextPointComp.arrowComp) {
                    this.tempArrowComp = nextPointComp.arrowComp;
                    break;
                }
            }
        }
    }

    /**触摸结束回调 */
    touchCall() {
        this.unschedule(this.showAuxiliaryLine);
        this.gameComp.setScrollEnabled(true);
        if (this.tempArrowComp && this.isShowAuxiliaryLine) {
            //关闭辅助线
            this.tempArrowComp.isShowAuxiliaryLine = false;
            this.tempArrowComp.setAuxiliaryLineColor(true);
            this.tempArrowComp.draw();
        }

        this.tempArrowComp = null;
    }

    /**点击开始 */
    onTouchStart(event: EventTouch) {
        // 获取触摸点的世界坐标
        const touchLocation = event.getUILocation();

        //初始化临时使用的箭头组件
        this.initTempArrowComp(touchLocation);

        this.isShowAuxiliaryLine = false;
        //只有单指时才展示辅助线
        if (this.gameComp && this.gameComp.touchNum == 1) {
            this.scheduleOnce(this.showAuxiliaryLine, 0.3);
        }
    }

    /**点击结束 */
    onTouchEnd() {
        //游戏页没开倒计时则开始倒计时
        if (!this.gameComp.isCountDownStart) {
            this.gameComp.isCountDownStart = true;
            this.gameComp.startCountDown();
        }

        // let isShowAuxiliaryLine = this.tempArrowComp && this.tempArrowComp.isShowAuxiliaryLine;
        //没有通过自身展示辅助线才检测是否可移动箭头
        if (!this.isShowAuxiliaryLine) {
            // console.log("点击结束", this.pos, this.tempArrowComp);
            if (this.tempArrowComp) {
                if (!this.tempArrowComp.canMove) {
                    this.tempArrowComp.checkArrowMove();
                }
            }
        }

        this.touchCall();
    }

    /**点击取消 */
    onTouchCancel() {
        this.touchCall();
    }

    /**显示辅助线 */
    showAuxiliaryLine() {
        if (!this.gameComp || !this.tempArrowComp) {
            return;
        }

        this.isShowAuxiliaryLine = true;
        this.gameComp.setScrollEnabled(false);
        //打开辅助线
        this.tempArrowComp.isShowAuxiliaryLine = true;
        this.tempArrowComp.node.setSiblingIndex(0);
        let canMove = this.tempArrowComp.checkArrowMove(false);
        this.tempArrowComp.setAuxiliaryLineColor(canMove);
        this.tempArrowComp.draw();
    }

    /**获取道具节点 */
    get propsNode() {
        return this.propsSlot;
    }

    /**删除道具 */
    delateProps(): void {
        if (!this.propsSlot || !this.propsSlot.isValid) {
            return;
        }
        let tempPropsSlot = this.propsSlot;
        this.propsSlot = null;
        tempPropsSlot.removeFromParent();
        tempPropsSlot.destroy();
    }

    /**获取道具类型 */
    get propsType() {
        if (!this.propsSlot || !this.propsSlot.isValid) {
            return PropsType.pipe;
        }
        let propComp: propsController = this.propsSlot.getComponent(propsController);
        return propComp.propsType;
    }

    /**增加道具 */
    addProps(propsNode: Node): void {
        this.propsSlot = propsNode;
    }

    /**减少道具数量 */
    reducePropsNum() {
        if (!this.propsSlot || !this.propsSlot.isValid) {
            return;
        }
        let propComp: propsController = this.propsSlot.getComponent(propsController);
        propComp.reduceNum();
    }


    /**隐藏点位 */
    hidePoint() {
        if (!this) {
            return;
        }
        //清除所有动画
        Tween.stopAllByTarget(this.pointImg);
        this.pointImg.active = false;
    }

    /**播放点位动画 */
    playPointAnim(time = 0, isChange = true, fixColor = true) {
        if (!this) {
            return;
        }

        Tween.stopAllByTarget(this.pointImg);

        tween(this.pointImg)
            .bindNodeState(false)
            .delay(time)
            .call(() => {
                if (isChange) {
                    this.pointImg.active = true;
                }

                if (this.pointImg.active && pData.isSprint) {
                    if (fixColor && pData.currentStage >= 0) {
                        this.pointImg.getComponent(Sprite).color = new Color(stageColor[pData.currentStage]);
                    } else {
                        this.setThemeColor();
                    }
                }
            })
            .to(0.2, { scale: new Vec3(3, 3, 1) })
            .to(0.2, { scale: new Vec3(1, 1, 1) })
            .call(() => {
                //冲刺关卡点位动画结束时，需要恢复颜色
                if (pData.isSprint && this.pointImg.active) {
                    this.setThemeColor();
                }
            })
            .start();
    }
}


