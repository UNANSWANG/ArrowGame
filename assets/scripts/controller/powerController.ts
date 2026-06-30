import { _decorator, Component, Label, Node } from 'cc';
import { pData } from '../manager/playerData';
import { GameEvent, PropsName, SaveKey } from '../manager/configData';
import { ccStorageTools } from '../extention/storageTools';
import { gm } from '../manager/gm';
import { ccTimeTools } from '../extention/timeTools';
import { ccTools } from '../extention/generalTools';
const { ccclass, property } = _decorator;

@ccclass('powerController')
export class powerController extends Component {
    /**体力数量 */
    numLab: Label = null;
    /**体力恢复时间 */
    timeLab: Label = null;
    /**剩余时间节点 */
    remainNode: Node = null;

    /**体力数量 */
    powerNum = 0;

    protected onLoad(): void {
        this.numLab = this.node.getChildByName("numLab").getComponent(Label);
        this.remainNode = this.node.getChildByName("remainNode");
        this.timeLab = this.remainNode.getChildByName("timeLab").getComponent(Label);
    }

    protected onEnable(): void {
        this.addListener();
        this.refreshPower();
    }

    protected onDisable(): void {
        this.removeListener();
    }

    addListener() {
        gm.Event.on(GameEvent.refreshProps, this.refreshPower, this);
        this.startPowerTimer();
    }

    removeListener() {
        gm.Event.off(GameEvent.refreshProps, this.refreshPower, this);
        this.stopPowerTimer();
    }

    /**开始体力计时器 */
    startPowerTimer() {
        // console.warn("开始体力计时器");
        this.stopPowerTimer();
        this.schedule(this.refreshPower, 1);
    }

    /**结束体力计时器 */
    stopPowerTimer() {
        this.unschedule(this.refreshPower);
    }

    /**刷新体力恢复时间 */
    refreshPower() {
        // console.log("刷新体力恢复时间");
        this.powerNum = pData.getPropsNum(PropsName.power);

        //恢复体力
        this.recoveryPower();

        this.numLab.string = this.powerNum.toString();

        let recoverTime = ccStorageTools.getNumberData(SaveKey.powerRecoverTime);
        let curTime = ccTimeTools.getTime();
        if (recoverTime == 0 || this.powerNum >= pData.powerMax) {
            //设置下一体力恢复时间为0
            // ccStorageTools.setData(SaveKey.powerRecoverTime, 0);
            //体力已满，不显示剩余时间
            this.remainNode.active = false;
        } else {
            this.remainNode.active = true;
            this.timeLab.string = ccTimeTools.formatTime(recoverTime - curTime);
        }
    }

    /**恢复体力 */
    recoveryPower() {
        let curTime = ccTimeTools.getTime();
        let lastTime = ccStorageTools.getNumberData(SaveKey.powerRecoverTime);

        //没有上次恢复时间直接跳过
        if (lastTime == 0) {
            return;
        }

        //过了恢复时间
        if (curTime >= lastTime) {
            let offsetNum = curTime - lastTime;
            let recoveryNum = Math.floor(offsetNum / pData.recoveryTime) + 1;

            //恢复超过上限，修改恢复数量
            if(this.powerNum + recoveryNum > pData.powerMax){
                recoveryNum = pData.powerMax - this.powerNum;
            }
            
            //超过体力上线
            if (this.powerNum >= pData.powerMax) {
                //设置下一体力恢复时间为0
                ccStorageTools.setData(SaveKey.powerRecoverTime, 0);
                return;
            } else {
                //设置下一体力恢复时间为nextTime
                let nextTime = lastTime + (pData.recoveryTime * recoveryNum);
                console.log("lastTime",lastTime,"恢复体力",recoveryNum,"体力恢复时间为",nextTime);
                ccStorageTools.setData(SaveKey.powerRecoverTime, nextTime);
            }
            
            //恢复recoveryNum体力
            this.changePowerInternal(recoveryNum);
            console.log("恢复体力",this.powerNum);
        }
    }

    /**内部修改体力（恢复体力时调用） */
    changePowerInternal(num: number) {
        this.powerNum += num;
        console.log("内部修改体力",this.powerNum,"恢复体力",num);
        //内部修改是恢复体力，不会超过上限
        if (this.powerNum >= pData.powerMax) {
            //设置下一体力恢复时间为0
            ccStorageTools.setData(SaveKey.powerRecoverTime, 0);
            // this.powerNum = pData.powerMax;
        }
        pData.setPropsNum(PropsName.power, this.powerNum);
    }
}


