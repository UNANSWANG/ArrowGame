import { _decorator, CCBoolean, Component, Enum, Label, Node, Tween } from 'cc';
import { audioMgr } from '../manager/audioManager';
import { audioPath } from '../manager/pathConfig';
import { AchiveTaskType } from '../manager/configData';
import { pData } from '../manager/playerData';
import { pointController } from './pointController';
const { ccclass, property } = _decorator;

/**外部道具类型 */
export enum ExternalPropsType {
    /**糖豆人 */
    pac = 0,
    /**生命 */
    life,
    /**时间 */
    time
}

/**内部道具类型 */
export enum PropsType {
    /**管道 */
    pipe = 0,
    /**铁块 */
    iron,
    /**黑洞 */
    hole,
}
@ccclass('propsController')
export class propsController extends Component {
    @property
    isExternalProps: Boolean = false;

    pointComp: pointController = null;

    @property({
        type: Enum(ExternalPropsType), visible() {
            return this.isExternalProps;
        }
    })
    externalPropsType: ExternalPropsType = ExternalPropsType.pac;

    @property({
        type: Enum(PropsType), visible() {
            return !this.isExternalProps;
        }
    })
    propsType: PropsType = PropsType.pipe;

    numLab: Node = null;
    imgNode: Node = null;

    /**道具剩余数量 */
    num: number = 1;

    protected onLoad(): void {
        this.numLab = this.node.getChildByName('numLab');
        this.imgNode = this.node.getChildByName("img");
    }

    /**减少道具数量 */
    reduceNum() {
        //没有数量的不受影响
        if(!this.numLab){
            return;
        }
        this.num--;
        if (this.num <= 0) {
            if(this.propsType == PropsType.iron){
                //消除铁块
                pData.addTaskProgress(AchiveTaskType.removeIron);
                audioMgr.playEffect(audioPath.ironRemove);
            }
            this.destorySelf();
            return;
        }
        this.setNum(this.num);
    }

    /**设置数量 */
    setNum(num: number) {
        if (!this.numLab) {
            return;
        }
        this.num = num;
        this.numLab.getComponent(Label).string = num.toString();
    }

    /**获取数量 */
    getNum(): number {
        if (!this.numLab) {
            return 1;
        }
        return Number(this.numLab.getComponent(Label).string);
    }

    /**设置旋转 */
    setAngle(angle: number) {
        this.node.angle = angle;
        if(this.numLab){
            this.numLab.angle = -angle;
        }
    }

    /**获取旋转 */
    getAngle(): number {
        return this.node.angle;
    }

    /**销毁道具 */
    destorySelf() {
        Tween.stopAllByTarget(this.node);
        if(this.pointComp){
            //内部道具
            this.pointComp.delateProps();
        }else{
            //外部道具
            this.node.removeFromParent();
            this.node.destroy();
        }
    }
}