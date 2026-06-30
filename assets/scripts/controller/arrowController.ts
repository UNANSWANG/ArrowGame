import { _decorator, Color, Component, Graphics, Node, NodeEventType, Size, size, Sprite, tween, Tween, UIOpacity, UITransform, Vec2, Vec3, view } from 'cc';
import { pointController } from './pointController';
import { UIGame } from '../UIPage/UIGame';
import { UIManager, uiMgr } from '../manager/UIManager';
import { AchiveTaskType, configData, GameEvent } from '../manager/configData';
import { ccTools } from '../extention/generalTools';
import { pData } from '../manager/playerData';
import { audioPath } from '../manager/pathConfig';
import { audioMgr } from '../manager/audioManager';
import { ExternalPropsType, propsController, PropsType } from './propsController';
import { gm } from '../manager/gm';
import { drawLineController } from './drawLineController';
const { ccclass, property } = _decorator;

/**箭头类型 */
export enum ArrowType {
    normal = 0,
    big,
}

/**箭头的主题颜色 */
enum arrowColor {
    base = 0,
    red,
}

@ccclass('arrowController')
export class arrowController extends Component {
    //组件
    /**画笔工具 */
    _Graphics: Graphics = null;
    /**箭头提示动画节点 */
    arrowTipNode: Node = null;

    /**箭头点位路径 */
    _ArrowPoints: pointController[] = [];
    /**箭头坐标路径 */
    private _ArrowPath: Vec2[] = [];
    /**大箭头的宽度(占的点位数) */
    bigLineWidth = 3;
    /**是否开始移动 */
    canMove = false;
    /**移动回调函数 */
    moveCall = null;
    /**游戏页脚本 */
    gameComp: UIGame = null;
    /**初始箭头的首部移动方向 */
    _rootArrowDir: Vec2 = null;
    /**箭头颜色 */
    arrowColor: Color = new Color("#000000");
    /**错误箭头到达的目标点位 */
    errorArrowTargetPos: Vec3 = null;
    /**是否移动到目标点 */
    movingToTarget: boolean = true;
    /**当前错误箭头的路径 */
    currentErrorPath: Vec2[] = [];
    /**记录尾部的点位 */
    recordTail: Vec2[] = [];
    /**是否已经失败过（一个箭头只会失败一次） */
    isFailed: boolean = false;
    /**箭头速度 */
    arrowSpeed = 25;
    /**最后一个点位的坐标 */
    lastPointPos: Vec2 = null;
    /**主题颜色 0：白天，1：黑夜 */
    themeColorArr = ["#000000", "#bbc0d7"];
    /**基础颜色 */
    baseColor: Color = new Color("#000000");
    /**辅助线颜色 */
    auxiliaryColor: Color = new Color("#BBC0D796");
    /**是否显示辅助线 */
    isShowAuxiliaryLine: boolean = false;
    /**是否为彩色箭头 */
    isColorArrow: boolean = false;
    /**彩色箭头的箭头颜色 */
    colorArrowTopColor: Color = new Color("#ff00fe");
    /**彩色箭头颜色组(彩色箭头的颜色) */
    colorArrowColorArr = ["#ff4e40", "#f77c38", "#f7e13d", "#4be084", "#39ccd6", "#3b72d6", "#b737f0"];
    /**彩色皮肤颜色组（彩色皮肤的颜色组） */
    skinColorColorArr = ["#e88bb7", "#e89390", "#85d3a3", "#82b7ed", "#9e9ae4", "#ffcc21", "#cd8fe2", "#cd8fe2", "#83b72e"];
    /**彩色箭头每个色块占的长度 */
    colorArrowWidth = 40;
    /**彩色箭头的初始颜色索引 */
    colorRootIndx = 0;
    /**当前彩色箭头的颜色索引 */
    currentColorIndex = 0;
    /**是否需要扣除血量 */
    isDeductLife: boolean = true;
    /**黑洞目标点 */
    holeTargetPos: Vec3 = null;
    /**是否已经到达黑洞节点 */
    isArriveHole: boolean = false;
    /**辅助线画笔组件 */
    drawLineComp: drawLineController = null;
    /**管道目标点 */
    pipeTargetPos: Vec3 = null;
    /**管道偏转方向 */
    pipeDir: Vec2 = null;
    /**是否已经到达管道节点 */
    isArrivePipe: boolean = false;
    /**管道恢复的方向 */
    pipeRecoverDir: Vec2 = null;

    /**箭头类型 */
    arrowType: ArrowType = ArrowType.normal;
    /**箭头的线宽 */
    arrowLineWidth = 15;

    protected onLoad(): void {
        this._Graphics = this.getComponent(Graphics);
        this._Graphics.lineWidth = this.arrowLineWidth;
        this.arrowTipNode = this.node.getChildByName('arrowTipNode');
        this.stopArrowTipAnim();
        this.setThemeColor();
        this.colorRootIndx = 0;//Math.floor(Math.random() * this.colorArrowColorArr.length)
    }

    protected onEnable(): void {
        this.addListener();
    }

    protected onDisable(): void {
        this.removeListener();
    }

    addListener() {
        this.removeListener();
        gm.Event.on(GameEvent.switchTheme, this.switchThemeColor, this);
    }

    removeListener() {
        gm.Event.off(GameEvent.switchTheme, this.switchThemeColor, this);
    }

    /**清除需要的数据 */
    clearData() {
        this._ArrowPoints = [];
        this._ArrowPath = [];
        this.gameComp = null;
        this.moveCall = null;
        this._rootArrowDir = null;
        this.canMove = false;
        // this.arrowColor = new Color("#000000");
        this.setThemeColor();
        this.setArrowColor(arrowColor.base);
        this.errorArrowTargetPos = null;
        this.movingToTarget = true;
        this.currentErrorPath = [];
        this.recordTail = [];
        this.isFailed = false;
        this.lastPointPos = null;
        this.isShowAuxiliaryLine = false;
        this.isColorArrow = false;
        this.isDeductLife = true;
        this.holeTargetPos = null;
        this.drawLineComp = null;
        this.pipeTargetPos = null;
        this.pipeDir = null;
        this.pipeRecoverDir = null;
        this.isArriveHole = false;
        this.isArrivePipe = false;
        this.arrowType = ArrowType.normal;
        this.stopArrowTipAnim();

        //清除绘图
        this._Graphics.clear();
        this.unscheduleAllCallbacks();
    }

    /**设置箭头类型默认为普通箭头 */
    setArrowType(type: ArrowType) {
        this.arrowType = type;
        if (this.arrowType == ArrowType.big) {
            ccTools.showChildByIdx(this.arrowTipNode, 1);
        } else {
            ccTools.showChildByIdx(this.arrowTipNode, 0);
        }
    }

    /**切换主题 */
    switchThemeColor() {
        this.setThemeColor();
        if (!this.isFailed) {
            this.setArrowColor(arrowColor.base);
        }
        this.draw();
    }

    /**设置主题颜色 */
    setThemeColor() {
        for (let i = 0; i < this.arrowTipNode.children.length; i++) {
            this.arrowTipNode.children[i].getComponent(Sprite).color = new Color(this.themeColorArr[pData.themeMode]);
        }
        this.baseColor = new Color(this.themeColorArr[pData.themeMode]);
    }

    /**设置提示箭头的方向 */
    setArrowTipDir(dir?: Vec2) {
        if (!dir) {
            dir = new Vec2(this.rootArrowDir);
        }

        dir.x = ccTools.ceilInteger(dir.x);
        dir.y = ccTools.ceilInteger(dir.y);

        if (dir.x == 0 && dir.y == 1) {
            //向上
            this.arrowTipNode.angle = 0;
        } else if (dir.x == 0 && dir.y == -1) {
            //向下
            this.arrowTipNode.angle = 180;
        } else if (dir.x == 1 && dir.y == 0) {
            //向右
            this.arrowTipNode.angle = 270;
        } else if (dir.x == -1 && dir.y == 0) {
            //向左
            this.arrowTipNode.angle = 90;
        } else if (dir.x == -1 && dir.y == 1) {
            //向左上
            this.arrowTipNode.angle = 45;
        } else if (dir.x == -1 && dir.y == -1) {
            //向左下
            this.arrowTipNode.angle = 135;
        } else if (dir.x == 1 && dir.y == 1) {
            //向右上
            this.arrowTipNode.angle = 315;
        } else if (dir.x == 1 && dir.y == -1) {
            //向右下
            this.arrowTipNode.angle = 225;
        }
    }

    /**遍历点位并执行回调 */
    doPointCall(call) {
        const dir = this.rootArrowDir;
        for (let i = 0; i < this._ArrowPoints.length; i++) {
            if (this.arrowType == ArrowType.big) {
                let rootPointPos = this._ArrowPoints[i].pos;
                //大箭头需要占多格
                if (dir.x == 0) {
                    //垂直方向
                    for (let j = -1; j < this.bigLineWidth - 1; j++) {
                        let tempPoint = this.gameComp.pointMap.get(rootPointPos.x + ',' + (rootPointPos.y + j));
                        call(tempPoint);
                    }
                } else {
                    //水平方向
                    for (let j = -1; j < this.bigLineWidth - 1; j++) {
                        let tempPoint = this.gameComp.pointMap.get((rootPointPos.x + j) + ',' + rootPointPos.y);
                        call(tempPoint);
                    }
                }
            } else {
                call(this._ArrowPoints[i]);
            }
        }
    }

    /**根据点位绘制箭头 */
    drawByPoints(arr: pointController[]) {
        //普通箭头至少需要2个点位,大箭头至少需要4个点位
        if ((this.arrowType == ArrowType.normal && arr.length <= 1) || (this.arrowType == ArrowType.big && arr.length <= 3)) {
            return;
        }
        this._ArrowPoints = arr;
        let posArr = [];

        if (this.arrowType == ArrowType.big) {
            //大箭头只有一个方向，只需要记住两个点即可
            posArr.push(new Vec3(arr[2].node.position));
            posArr.push(new Vec3(arr[arr.length - 1].node.position));
        } else {
            for (let i = 0; i < arr.length; i++) {
                posArr.push(new Vec3(arr[i].node.position));
            }
        }

        this.drawPath(posArr);
    }

    /**根据坐标绘制箭头 */
    drawPath(arr: Vec2[]) {
        this._ArrowPath = arr;
        this.draw();
        //绘制第一轮时,需要添加监听
        // this.setPointListener(true);
    }

    /**直接绘制 */
    draw() {
        if (this.arrowType == ArrowType.big) {
            this.drawBigArrow();
        } else {
            this.drawArrow();
        }
    }

    /**绘制路径 */
    drawArrow(_pathArr?: Vec2[]) {
        let pathArr = _pathArr || this._ArrowPath;
        if (pathArr.length <= 1) {
            return;
        }

        this._Graphics.clear();
        this.clearAuxiliaryLine();

        if (this.isShowAuxiliaryLine) {
            this.showAuxiliaryLine();
        }

        // 彩色箭头逻辑
        if (this.isColorArrow && this.colorArrowColorArr && this.colorArrowColorArr.length > 0) {
            //初始需要给箭头头部设置颜色
            this.currentColorIndex = this.colorRootIndx % this.colorArrowColorArr.length;
            let globalDistance = 0; // 从起点开始的全局距离

            this.setArrowTipDir();
            for (let i = 0; i < pathArr.length - 1; i++) {
                const x1 = pathArr[i + 1].x;
                const y1 = pathArr[i + 1].y;
                const x2 = pathArr[i].x;
                const y2 = pathArr[i].y;

                // 计算当前线段的长度
                const segmentLength = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));

                // 递归绘制线段，按颜色段切分
                this.drawSegmentWithColors(x1, y1, x2, y2, globalDistance, segmentLength);

                // 更新全局距离
                globalDistance += segmentLength;

                if (i == 0) {
                    // 绘制箭头头部
                    let fixDir = new Vec2(this.rootArrowDir.x, -this.rootArrowDir.y);
                    //放置箭头的提示
                    this.arrowTipNode.position = new Vec3(x2 + fixDir.x * 2, y2 + fixDir.y * 2, 0);

                    // 箭头头部使用当前颜色
                    const arrowColor = this.colorArrowTopColor;
                    this._Graphics.strokeColor = new Color(arrowColor);
                    this._Graphics.fillColor = new Color(arrowColor);

                    //箭头长度
                    let arrowHeight = 12;
                    //箭头宽度
                    let arrowWidth = 14;

                    const dir = ccTools.GetDir(x1, y1, x2, y2);
                    this._Graphics.moveTo(x2 + dir.x * arrowHeight, y2 + dir.y * arrowHeight);  // 箭头尖端
                    this._Graphics.lineTo(x2 - dir.x * arrowHeight + dir.y * arrowWidth, y2 - dir.y * arrowHeight - dir.x * arrowWidth);  // 左翼
                    this._Graphics.lineTo(x2 - dir.x * arrowHeight - dir.y * arrowWidth, y2 - dir.y * arrowHeight + dir.x * arrowWidth);  // 右翼

                    this._Graphics.close();
                    this._Graphics.fill();
                }
            }
        } else {
            //设置箭头颜色
            this._Graphics.strokeColor = this.arrowColor;
            this._Graphics.fillColor = this.arrowColor;
            //设置线宽
            this._Graphics.lineWidth = this.arrowLineWidth;

            this.setArrowTipDir();
            for (let i = 0; i < pathArr.length - 1; i++) {
                const x1 = pathArr[i + 1].x;
                const y1 = pathArr[i + 1].y;
                const x2 = pathArr[i].x;
                const y2 = pathArr[i].y;
                this._Graphics.moveTo(x1, y1);
                this._Graphics.lineTo(x2, y2);
                this._Graphics.stroke();
                //没有到达黑洞就能绘制箭头
                if (i == 0 && !this.isArriveHole) {
                    let fixDir = new Vec2(this.rootArrowDir.x, -this.rootArrowDir.y);
                    //放置箭头的提示
                    this.arrowTipNode.position = new Vec3(x2 + fixDir.x * 2, y2 + fixDir.y * 2, 0);

                    //箭头长度
                    let arrowHeight = 12;
                    //箭头宽度
                    let arrowWidth = 14;

                    const dir = ccTools.GetDir(x1, y1, x2, y2);
                    this._Graphics.moveTo(x2 + dir.x * arrowHeight, y2 + dir.y * arrowHeight);  // 箭头尖端
                    this._Graphics.lineTo(x2 - dir.x * arrowHeight + dir.y * arrowWidth, y2 - dir.y * arrowHeight - dir.x * arrowWidth);  // 左翼
                    this._Graphics.lineTo(x2 - dir.x * arrowHeight - dir.y * arrowWidth, y2 - dir.y * arrowHeight + dir.x * arrowWidth);  // 右翼

                    this._Graphics.close();
                    this._Graphics.fill();
                }
            }
        }

    }

    /**递归绘制带颜色的线段 */
    private drawSegmentWithColors(x1: number, y1: number, x2: number, y2: number, startDistance: number, remainingLength: number) {
        if (remainingLength <= 0) return;

        // 计算当前颜色段剩余长度
        const colorSegmentRemaining = this.colorArrowWidth - (startDistance % this.colorArrowWidth);

        if (remainingLength <= colorSegmentRemaining) {
            // 整个剩余段都在当前颜色段内
            const colorIndex = this.currentColorIndex % this.colorArrowColorArr.length;
            //刚好的时候，轮换下一个颜色
            if (remainingLength == colorSegmentRemaining) {
                this.currentColorIndex++;
            }
            this._Graphics.strokeColor = new Color(this.colorArrowColorArr[colorIndex]);
            this._Graphics.fillColor = new Color(this.colorArrowColorArr[colorIndex]);
            this._Graphics.lineWidth = this.arrowLineWidth;

            this._Graphics.moveTo(x1, y1);
            this._Graphics.lineTo(x2, y2);
            this._Graphics.stroke();
        } else {
            // 需要分割线段
            const ratio = colorSegmentRemaining / remainingLength;
            const splitX = x2 + (x1 - x2) * ratio;
            const splitY = y2 + (y1 - y2) * ratio;

            // 绘制第一段
            const colorIndex = (this.currentColorIndex++) % this.colorArrowColorArr.length;
            this._Graphics.strokeColor = new Color(this.colorArrowColorArr[colorIndex]);
            this._Graphics.fillColor = new Color(this.colorArrowColorArr[colorIndex]);
            this._Graphics.lineWidth = this.arrowLineWidth;

            this._Graphics.moveTo(x2, y2);
            this._Graphics.lineTo(splitX, splitY);
            this._Graphics.stroke();

            // 递归绘制剩余部分
            this.drawSegmentWithColors(x1, y1, splitX, splitY, startDistance + colorSegmentRemaining, remainingLength - colorSegmentRemaining);
        }
    }

    /**绘制大箭头 */
    drawBigArrow(_pathArr?: Vec2[]) {
        let pathArr = _pathArr || this._ArrowPath;
        if (pathArr.length <= 1) {
            return;
        }

        this._Graphics.clear();
        this.clearAuxiliaryLine();

        if (this.isShowAuxiliaryLine) {
            this.showAuxiliaryLine();
        }

        //设置箭头颜色
        this._Graphics.strokeColor = this.arrowColor;
        this._Graphics.fillColor = this.arrowColor;
        //设置线宽
        this._Graphics.lineWidth = this.arrowLineWidth;

        //箭头方向（大箭头固定）
        let point1 = pathArr[0];
        let point2 = pathArr[1];
        //实际坐标位置
        const x1 = point2.x;
        const y1 = point2.y;
        const x2 = point1.x;
        const y2 = point1.y;
        //方向
        const dir = ccTools.GetDir(x1, y1, x2, y2);

        //箭头线的宽度偏移量
        const arrowLineOffset = 30;
        //箭头长度
        const arrowHeight = 120;
        //箭头宽度
        const arrowWidth = 65;
        //箭头的中心坐标
        let arrowCenterPos = new Vec2(point1);

        this.setArrowTipDir();

        let fixDir = new Vec2(this.rootArrowDir.x, -this.rootArrowDir.y);
        //放置箭头的提示
        this.arrowTipNode.position = new Vec3(x2 + fixDir.x * (2 + configData.pointWidth), y2 + fixDir.y * (2 + configData.pointWidth), 0);

        //没有到达黑洞就能绘制箭头
        if (!this.isArriveHole) {
            //绘制箭头
            this._Graphics.moveTo(arrowCenterPos.x + dir.x * arrowHeight, arrowCenterPos.y + dir.y * arrowHeight);
            this._Graphics.lineTo(arrowCenterPos.x + dir.y * arrowWidth, arrowCenterPos.y + dir.x * arrowWidth);
            this._Graphics.lineTo(arrowCenterPos.x - dir.y * arrowWidth, arrowCenterPos.y - dir.x * arrowWidth);
            this._Graphics.close();
            this._Graphics.fill();
        }

        let posArr = [];
        if (dir.x == 0) {
            //垂直方向
            posArr.push(new Vec2(point1.x - arrowLineOffset, point1.y));
            posArr.push(new Vec2(point1.x + arrowLineOffset, point1.y));
            posArr.push(new Vec2(point2.x + arrowLineOffset, point2.y));
            posArr.push(new Vec2(point2.x - arrowLineOffset, point2.y));
        } else {
            //水平方向
            posArr.push(new Vec2(point1.x, point1.y - arrowLineOffset));
            posArr.push(new Vec2(point1.x, point1.y + arrowLineOffset));
            posArr.push(new Vec2(point2.x, point2.y + arrowLineOffset));
            posArr.push(new Vec2(point2.x, point2.y - arrowLineOffset));
        }

        let rootPointPos = posArr[0];
        //需要绘制一圈
        this._Graphics.moveTo(rootPointPos.x, rootPointPos.y);
        //绘制矩形
        for (let j = 1; j < posArr.length; j++) {
            let pointPos = posArr[j];
            this._Graphics.lineTo(pointPos.x, pointPos.y);
        }
        this._Graphics.close();
        this._Graphics.stroke();
        this._Graphics.fillColor = this.arrowColor;
        this._Graphics.fill();
    }

    /**设置辅助线颜色 */
    setAuxiliaryLineColor(canMove: boolean) {
        this.auxiliaryColor = canMove ? new Color("#BBC0D796") : new Color("#ff0000");
        this.drawLineComp.setColor(this.auxiliaryColor);
    }

    /**设置箭头颜色 */
    setArrowColor(color: arrowColor) {
        switch (color) {
            case arrowColor.base:
                this.arrowColor = this.baseColor;
                break;
            case arrowColor.red:
                this.arrowColor = new Color("#ff0000");
                break;
            default:
                //默认黑色
                this.arrowColor = this.baseColor;
                break;
        }
    }

    update(deltaTime: number) {
        if (this.canMove && this.moveCall) {
            this.moveCall();
        }
    }

    /**设置箭头路径(并增加绘图组件) */
    setPointPathTouch(bool, fixComp = true) {
        this.doPointCall((point: pointController) => {
            if (bool) {
                if (fixComp) {
                    point.arrowComp = this;
                }
                // point.addListener();
            } else {
                if (fixComp) {
                    point.arrowComp = null;
                }
                // point.removeListener();
            }
        });
    }

    /**基于rootPos的dir方向找错误点 */
    findErrorPos(rootPos: Vec2, dir: Vec2) {
        let checkPoint = (pos) => {
            let nextPointComp: pointController = this.gameComp.pointMap.get(pos.x + ',' + pos.y);
            //没找到则跳出循环
            if (!nextPointComp) {
                return false;
            }

            let propsNode = nextPointComp.propsNode;
            //如果是大箭头，必须要是中心点才判断是否有道具
            if (propsNode) {
                let propsComp: propsController = propsNode.getComponent(propsController);
                if (propsComp.propsType == PropsType.iron) {
                    this.errorArrowTargetPos = nextPointComp.node.position;
                    //撞到铁块不扣除生命值
                    this.isDeductLife = false;
                } else if (propsComp.propsType == PropsType.hole) {
                    //撞到黑洞结束
                    this.holeTargetPos = nextPointComp.node.position;
                }
            } else if (nextPointComp.arrowComp) {
                //找到了且有箭头在点上不可移动
                this.errorArrowTargetPos = nextPointComp.node.position;
                //这里是检测管道，所以不扣除体力
                this.isDeductLife = false;
            }
            return true;
        }

        while (true) {
            rootPos.x -= dir.y;
            rootPos.y += dir.x;

            //没有找到点就是边界了
            let hasPoint = checkPoint(new Vec2(rootPos.x, rootPos.y));

            if (this.errorArrowTargetPos || !hasPoint || this.holeTargetPos) {
                break;
            }
        }
    }

    /**检测移动 */
    checkArrowMove(isMove: boolean = true): boolean {
        if (!this.gameComp) {
            return false;
        }
        this.errorArrowTargetPos = null;
        this.holeTargetPos = null;
        this.pipeTargetPos = null;
        this.pipeDir = null;
        this.pipeRecoverDir = null;
        this.isArriveHole = false;
        this.isArrivePipe = false;

        this.isDeductLife = true;
        let rootPos = new Vec2(this._ArrowPoints[0].pos);
        let dirOffset = new Vec2(-this.rootArrowDir.y, this.rootArrowDir.x);
        dirOffset.x = ccTools.ceilInteger(dirOffset.x);
        dirOffset.y = ccTools.ceilInteger(dirOffset.y);
        let checkPoint = (pos, isCenter) => {
            let nextPointComp: pointController = this.gameComp.pointMap.get(pos.x + ',' + pos.y);
            //没找到则跳出循环
            if (!nextPointComp) {
                return false;
            }

            let propsNode = nextPointComp.propsNode;
            //如果是大箭头，必须要是中心点才判断是否有道具
            if (propsNode && isCenter && propsNode.active) {
                let propsComp: propsController = propsNode.getComponent(propsController);
                if (propsComp.propsType == PropsType.iron) {
                    this.errorArrowTargetPos = nextPointComp.node.position;
                    //撞到铁块不扣除生命值
                    this.isDeductLife = false;
                } else if (propsComp.propsType == PropsType.hole) {
                    //撞到黑洞结束
                    this.holeTargetPos = nextPointComp.node.position;
                } else if (propsComp.propsType == PropsType.pipe) {
                    //撞到管道
                    // console.log("撞到管道:", dirOffset);
                    //0:下右，90：上右，180：上左，270：下左
                    let angle = propsNode.angle;

                    //只有上下左右方向的才可以通过管道
                    if (dirOffset.x == 0 && dirOffset.y == 1) {
                        //朝右箭头
                        if (angle == 180) {
                            //可以向上移动
                            this.pipeDir = new Vec2(0, 1);
                        } else if (angle == 270) {
                            //可以向下移动
                            this.pipeDir = new Vec2(0, -1);
                        }
                    } else if (dirOffset.x == 0 && dirOffset.y == -1) {
                        //朝左
                        if (angle == 90) {
                            //可以向上移动
                            this.pipeDir = new Vec2(0, 1);
                        } else if (angle == 0) {
                            //可以向下移动
                            this.pipeDir = new Vec2(0, -1);
                        }
                    } else if (dirOffset.x == 1 && dirOffset.y == 0) {
                        //朝下
                        if (angle == 90) {
                            //可以向右移动
                            this.pipeDir = new Vec2(1, 0);
                        } else if (angle == 180) {
                            //可以向左移动
                            this.pipeDir = new Vec2(-1, 0);
                        }
                    } else if (dirOffset.x == -1 && dirOffset.y == 0) {
                        //朝上
                        if (angle == 0) {
                            //可以向右移动
                            this.pipeDir = new Vec2(1, 0);
                        } else if (angle == 270) {
                            //可以向左移动
                            this.pipeDir = new Vec2(-1, 0);
                        }
                    }

                    //不可通过管道直接标记为错误点位
                    if (!this.pipeDir) {
                        this.errorArrowTargetPos = nextPointComp.node.position;
                        this.isDeductLife = false;
                    } else {
                        //有方向,记录管道位置
                        this.pipeTargetPos = nextPointComp.node.position;
                        this.findErrorPos(pos, this.pipeDir);
                        console.log("错误点位:", this.errorArrowTargetPos);
                    }
                }
            } else if (nextPointComp.arrowComp) {
                //找到了且有箭头在点上不可移动
                this.errorArrowTargetPos = nextPointComp.node.position;
            }
            return true;
        }
        if (this.arrowType == ArrowType.big) {
            //大箭头判断是否可以移动
            while (true) {
                rootPos.x += dirOffset.x;
                rootPos.y += dirOffset.y;

                let hasPoint = true;
                for (let i = -1; i <= 1; i++) {
                    //默认水平方向需要拓展上下判断
                    let tempPos = new Vec2(rootPos.x + i, rootPos.y);
                    if (this.rootArrowDir.x == 0) {
                        //垂直方向,需要拓展左右判断
                        tempPos = new Vec2(rootPos.x, rootPos.y + i);
                    }

                    //没有找到点就是边界了
                    hasPoint = checkPoint(tempPos, i == 0);
                    if (this.errorArrowTargetPos || !hasPoint || this.holeTargetPos) {
                        break;
                    }
                }

                //大箭头不做管道拐弯
                if (this.errorArrowTargetPos || !hasPoint || this.holeTargetPos) {
                    break;
                }
            }
        } else {
            //小箭头判断是否可以移动
            while (true) {
                rootPos.x += dirOffset.x;
                rootPos.y += dirOffset.y;

                //没有找到点就是边界了
                let hasPoint = checkPoint(new Vec2(rootPos.x, rootPos.y), true);

                if (this.errorArrowTargetPos || !hasPoint || this.holeTargetPos || this.pipeTargetPos) {
                    break;
                }
            }

        }

        let canMove = (!this.errorArrowTargetPos || this.holeTargetPos || this.pipeTargetPos) as boolean;
        if (isMove) {
            //先关闭路径点的触摸事件
            // this.setPointPathTouch(false, false);
            this.canMove = true;
            //注意：[...this._ArrowPath]写法依旧有引用问题
            this.currentErrorPath = Array.from(this._ArrowPath, (item) => new Vec2(item));
            //先将最后一个点记录起来
            this.recordTail = [new Vec2(this._ArrowPath[this._ArrowPath.length - 1])];
            this.movingToTarget = false;

            //没有错误目标点走正常路径
            if (canMove) {
                this.lastPointPos = new Vec2(this._ArrowPath[this._ArrowPath.length - 1]);
                this.gameComp.onArrowMoveStart();
                //只有没有错误目标点，才调用增加箭头完成进度回调
                if (!this.errorArrowTargetPos) {
                    this.playArrowPointAnim();
                    //增加箭头完成进度
                    this.gameComp.fixArrowCompleteProgress();
                }
                this.moveCall = () => {
                    this.moveArrow();
                }
                //去除监听的同时需要将箭头组件设置为null
                this.setPointPathTouch(false);

                if (this.isColorArrow) {
                    audioMgr.playEffect(audioPath.colorArrowRemove);
                    //彩色箭头调起游戏页彩色箭头完成回调
                    this.gameComp.colorArrowOutCall();
                } else {
                    audioMgr.playEffect(audioPath.removeArrow);
                }
            } else {
                this.moveCall = () => {
                    this.moveArrow();
                };
            }
        } else {
            this.errorArrowTargetPos = null;
        }

        return canMove;
    }

    /**错误箭头回到原点回调 */
    errorArrowBackToOrigin() {
        this.setPointPathTouch(true);
    }

    /**错误箭头移动函数（先到目标点再返回） */
    moveArrow() {
        // console.log("移动箭头");
        if (this.currentErrorPath.length < 2 || this.recordTail.length == 0) {
            //如果是因为黑洞导致的，需要销毁
            if (this.holeTargetPos) {
                pData.addTaskProgress(AchiveTaskType.removeBlackholeArrow);
                this.arrowCompleteCall();
            }
            return;
        }

        if (this.movingToTarget) {
            //返回原路的算法
            //尾
            let targetPos = this.recordTail[0];
            let lastIndex = this.currentErrorPath.length - 1;
            let dir = ccTools.GetDir(this.currentErrorPath[lastIndex].x, this.currentErrorPath[lastIndex].y, targetPos.x, targetPos.y);
            this.currentErrorPath[lastIndex].x += dir.x * this.arrowSpeed;
            this.currentErrorPath[lastIndex].y += dir.y * this.arrowSpeed;

            // 判断是否超过下一个点的位置
            let isOver = false;
            if (dir.x > 0 && this.currentErrorPath[lastIndex].x >= targetPos.x) {
                isOver = true;
            } else if (dir.x < 0 && this.currentErrorPath[lastIndex].x <= targetPos.x) {
                isOver = true;
            } else if (dir.y > 0 && this.currentErrorPath[lastIndex].y >= targetPos.y) {
                isOver = true;
            } else if (dir.y < 0 && this.currentErrorPath[lastIndex].y <= targetPos.y) {
                isOver = true;
            }

            if (isOver) {
                this.recordTail.shift();
                if (this.recordTail.length == 0) {
                    //结束错误箭头移动
                    this.canMove = false;
                    this.moveCall = null;
                    this.errorArrowBackToOrigin();
                } else {
                    //还有节点需要走，这里需要增加点位
                    this.currentErrorPath[lastIndex] = new Vec2(targetPos);
                    //再增加一个点位
                    this.currentErrorPath.push(new Vec2(targetPos));
                }
            }

            //头
            dir = ccTools.GetDir(this.currentErrorPath[0].x, this.currentErrorPath[0].y, this.currentErrorPath[1].x, this.currentErrorPath[1].y);
            this.currentErrorPath[0].x += dir.x * this.arrowSpeed;
            this.currentErrorPath[0].y += dir.y * this.arrowSpeed;

            //有管道节点且到达管道目标位置
            if (this.pipeTargetPos && this.isArrivePipe) {
                if (!this.pipeRecoverDir) {
                    this.pipeRecoverDir = ccTools.GetDir(this.currentErrorPath[0].x, this.currentErrorPath[0].y, this.pipeTargetPos.x, this.pipeTargetPos.y);
                }
                let isOverPipe = false;
                if (this.pipeRecoverDir.x > 0 && this.currentErrorPath[0].x >= this.pipeTargetPos.x) {
                    isOverPipe = true;
                } else if (this.pipeRecoverDir.x < 0 && this.currentErrorPath[0].x <= this.pipeTargetPos.x) {
                    isOverPipe = true;
                } else if (this.pipeRecoverDir.y > 0 && this.currentErrorPath[0].y >= this.pipeTargetPos.y) {
                    isOverPipe = true;
                } else if (this.pipeRecoverDir.y < 0 && this.currentErrorPath[0].y <= this.pipeTargetPos.y) {
                    isOverPipe = true;
                }

                if (isOverPipe) {
                    this.pipeTargetPos = null;
                    this.currentErrorPath.shift();
                    //重新计算方向移动
                    dir = ccTools.GetDir(this.currentErrorPath[0].x, this.currentErrorPath[0].y, this.currentErrorPath[1].x, this.currentErrorPath[1].y);
                    this.currentErrorPath[0].x += dir.x * this.arrowSpeed;
                    this.currentErrorPath[0].y += dir.y * this.arrowSpeed;
                }
            }
        } else {
            //正常到目标点的算法
            //头
            let dir = ccTools.GetDir(this.currentErrorPath[1].x, this.currentErrorPath[1].y, this.currentErrorPath[0].x, this.currentErrorPath[0].y);
            this.currentErrorPath[0].x += dir.x * this.arrowSpeed;
            this.currentErrorPath[0].y += dir.y * this.arrowSpeed;

            let tempTopPointPos = new Vec3(this.currentErrorPath[0].x, this.currentErrorPath[0].y, 0);
            //大箭头的判断要特殊处理
            if (this.arrowType == ArrowType.big) {
                //45是一个点的宽度，90是需要占两个点
                tempTopPointPos.x += dir.x * configData.pointWidth * 2;
                tempTopPointPos.y += dir.y * configData.pointWidth * 2;
            }

            let isTarget = false;

            //存在错误目标或者黑洞目标才做超越判断
            if (this.errorArrowTargetPos || this.holeTargetPos || (this.pipeTargetPos && !this.isArrivePipe)) {
                let tempTargetPos = null;
                if (this.pipeTargetPos && !this.isArrivePipe) {
                    tempTargetPos = new Vec2(this.pipeTargetPos.x, this.pipeTargetPos.y);
                } else if (this.holeTargetPos) {
                    tempTargetPos = new Vec2(this.holeTargetPos.x, this.holeTargetPos.y);
                } else {
                    tempTargetPos = new Vec2(this.errorArrowTargetPos.x, this.errorArrowTargetPos.y);
                }
                if (dir.x > 0 && tempTopPointPos.x >= tempTargetPos.x) {
                    isTarget = true;
                } else if (dir.x < 0 && tempTopPointPos.x <= tempTargetPos.x) {
                    isTarget = true;
                } else if (dir.y > 0 && tempTopPointPos.y >= tempTargetPos.y) {
                    isTarget = true;
                } else if (dir.y < 0 && tempTopPointPos.y <= tempTargetPos.y) {
                    isTarget = true;
                }
            } else {
                let worldPos = this.node.getComponent(UITransform).convertToWorldSpaceAR(tempTopPointPos);
                let collisionProps = this.gameComp.checkOutsideProps(worldPos);
                if (collisionProps) {
                    let propsComp = collisionProps.getComponent(propsController);
                    //糖豆人需要弹回原路
                    if (propsComp.externalPropsType == ExternalPropsType.pac) {
                        audioMgr.playEffect(audioPath.collisionEat);
                        //碰撞吃豆人增加任务进度
                        pData.addTaskProgress(AchiveTaskType.eatPacman);

                        //减少箭头完成进度
                        this.gameComp.fixArrowCompleteProgress(false);

                        isTarget = true;
                        this.isDeductLife = false;
                        this.hideArrowPoint();
                        this.gameComp.addCountDownTime(-20);
                    } else {
                        propsComp.destorySelf();
                        if (propsComp.externalPropsType == ExternalPropsType.life) {
                            audioMgr.playEffect(audioPath.collisionHeart);
                            //吃到【桃心】道具增加任务进度
                            pData.addTaskProgress(AchiveTaskType.eatHeart);

                            pData.addLife();
                        } else if (propsComp.externalPropsType == ExternalPropsType.time) {
                            audioMgr.playEffect(audioPath.collisionTime);
                            //吃到【沙漏】道具增加任务进度
                            pData.addTaskProgress(AchiveTaskType.eatSand);

                            this.gameComp.addCountDownTime(20);
                        }
                    }
                }
            }

            if (isTarget) {
                if (this.holeTargetPos) {
                    //到达黑洞目标位置，开始消除
                    this.currentErrorPath[0] = new Vec2(this.holeTargetPos.x, this.holeTargetPos.y);
                    this.isArriveHole = true;
                } else if (this.pipeTargetPos && !this.isArrivePipe) {
                    // console.log("首次到达管道目标位置", this.pipeDir);
                    this.isArrivePipe = true;
                    this.currentErrorPath[0] = new Vec2(this.pipeTargetPos.x, this.pipeTargetPos.y);
                    let nextPos = new Vec2(this.pipeTargetPos.x + this.pipeDir.x * this.arrowSpeed, this.pipeTargetPos.y + this.pipeDir.y * this.arrowSpeed);
                    this.currentErrorPath.unshift(nextPos);
                } else {
                    ccTools.vibrate();
                    //到达错误目标位置，开始返回原路
                    this.movingToTarget = true;
                    audioMgr.playEffect(audioPath.collision);

                    //需要扣血
                    if (this.isDeductLife) {
                        this.setArrowColor(arrowColor.red);

                        if (!this.isFailed) {
                            this.isFailed = true;
                            this.gameComp.arrowErrorCall();
                        }
                    }
                }
            }

            //尾
            let lastIndex = this.currentErrorPath.length - 1;
            dir = ccTools.GetDir(this.currentErrorPath[lastIndex].x, this.currentErrorPath[lastIndex].y, this.currentErrorPath[lastIndex - 1].x, this.currentErrorPath[lastIndex - 1].y);
            this.currentErrorPath[lastIndex].x += dir.x * this.arrowSpeed;
            this.currentErrorPath[lastIndex].y += dir.y * this.arrowSpeed;

            let gameBaseSize = new Size(this.gameComp.gameNode.getComponent(UITransform).contentSize);
            let gameSize = new Size(gameBaseSize.x, gameBaseSize.y - 500);
            let scalePos = new Vec3(this.currentErrorPath[lastIndex].x * this.gameComp.curScale, this.currentErrorPath[lastIndex].y * this.gameComp.curScale, 1);
            //出了边界则销毁
            if (scalePos.x > gameSize.x / 2 || scalePos.x < -gameSize.x / 2 || scalePos.y > gameSize.y / 2 || scalePos.y < -gameSize.y / 2) {
                this.arrowCompleteCall();
                return;
            }

            // 判断是否超过下一个点的位置
            let isOver = false;
            if (dir.x > 0 && this.currentErrorPath[lastIndex].x >= this.currentErrorPath[lastIndex - 1].x) {
                isOver = true;
            } else if (dir.x < 0 && this.currentErrorPath[lastIndex].x <= this.currentErrorPath[lastIndex - 1].x) {
                isOver = true;
            } else if (dir.y > 0 && this.currentErrorPath[lastIndex].y >= this.currentErrorPath[lastIndex - 1].y) {
                isOver = true;
            } else if (dir.y < 0 && this.currentErrorPath[lastIndex].y <= this.currentErrorPath[lastIndex - 1].y) {
                isOver = true;
            }

            if (isOver) {
                if (!isTarget || this.holeTargetPos) {
                    this.currentErrorPath.pop();
                    this.recordTail.unshift(new Vec2(this.currentErrorPath[this.currentErrorPath.length - 1]));
                }
            }
        }

        if (this.arrowType == ArrowType.big) {
            this.drawBigArrow(this.currentErrorPath);
        } else {
            this.drawArrow(this.currentErrorPath);
        }
    }

    /**箭头完成回调 */
    arrowCompleteCall() {
        //彩色箭头完成，增加移走彩色箭头任务进度
        if (this.isColorArrow) {
            pData.addTaskProgress(AchiveTaskType.removeColorArrow);
        }
        //移走巨型箭头任务进度
        if (this.arrowType == ArrowType.big) {
            pData.addTaskProgress(AchiveTaskType.removeBigArrow);
        }

        this.moveCall = null;
        this.canMove = false;
        this.drawLineComp.clear();
        this.gameComp.arrowOutCall();

        this.gameComp.addDrawNodeToPoolOnece(this);
    }

    /**隐藏路线内的点位 */
    hideArrowPoint() {
        this.doPointCall((pointComp: pointController) => {
            pointComp.hidePoint();
        });
    }

    /**将箭头所在点位点亮 */
    showArrowPoint() {
        this.doPointCall((pointComp: pointController) => {
            pointComp.pointImg.active = true;
        });
    }

    /**播放箭头移动时点位动画 */
    playArrowPointAnim() {
        if (this.arrowType == ArrowType.big) {
            this.showArrowPoint();
            this.gameComp.playBigArrowAnim(this._ArrowPoints[this._ArrowPoints.length - 1], this.rootArrowDir);
        } else {
            this.gameComp.playSmallArrowAnim(this._ArrowPoints);
        }
    }

    /**判断是否超过坐标（仅限于同一行或者同一列） */
    checkIsOver(pos1, pos2, dir) {
        let isOver = false;
        if (dir.x > 0 && pos1.x >= pos2.x) {
            isOver = true;
        } else if (dir.x < 0 && pos1.x <= pos2.x) {
            isOver = true;
        } else if (dir.y > 0 && pos1.y >= pos2.y) {
            isOver = true;
        } else if (dir.y < 0 && pos1.y <= pos2.y) {
            isOver = true;
        }
        return isOver;
    }

    /**当前绘制路线的方向（前两个点位） */
    get rootArrowDir() {
        if (!this._rootArrowDir) {
            //箭头方向（大箭头固定）
            let point1 = this._ArrowPoints[0];
            let piont2 = this._ArrowPoints[1];
            //实际坐标位置
            const x1 = piont2.node.position.x;
            const y1 = piont2.node.position.y;
            const x2 = point1.node.position.x;
            const y2 = point1.node.position.y;
            this._rootArrowDir = ccTools.GetDir(x1, y1, x2, y2);
            return this._rootArrowDir;
        } else {
            return this._rootArrowDir;
        }
    }

    /**停止箭头提示动画 */
    stopArrowTipAnim() {
        this.arrowTipNode.active = false;
        Tween.stopAllByTarget(this.arrowTipNode);
    }

    /**播放箭头提示动画 */
    playArrowTipAnim() {
        this.arrowTipNode.active = true;
        Tween.stopAllByTarget(this.arrowTipNode);

        let opacity = this.arrowTipNode.getComponent(UIOpacity);
        let animTime = 1;

        tween(this.arrowTipNode)
            .set({ scale: new Vec3(1, 1, 1) })
            .to(animTime, { scale: new Vec3(2, 2, 1) })
            .union()
            .repeatForever()
            .start();
        tween(opacity)
            .set({ opacity: 255 })
            .delay(animTime / 4)
            .to(animTime * 3 / 4, { opacity: 0 })
            .union()
            .repeatForever()
            .start();
    }

    /**清除辅助线 */
    clearAuxiliaryLine() {
        if (this.drawLineComp) {
            this.drawLineComp.clear();
        }
    }
    /**显示辅助线 */
    showAuxiliaryLine() {
        if (this.drawLineComp) {
            pData.isUseLine = true;
            let rootPos = this.currentErrorPath[0] || this._ArrowPath[0];
            let fixDir = new Vec2(this.rootArrowDir.x, this.rootArrowDir.y);
            let gameNode = this.gameComp.gameNode.getComponent(UITransform);
            let length = Math.max(gameNode.contentSize.x, gameNode.contentSize.y) * 2;
            this.drawLineComp.showAuxiliaryLine(rootPos, fixDir, length);
        }
    }
}