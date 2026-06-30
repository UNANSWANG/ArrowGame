import { _decorator, Component, instantiate, macro, Node, NodePool } from 'cc';
import { uiMgr } from './UIManager';
const { ccclass, property } = _decorator;

//对象池管理类
@ccclass('poolManager')
export class poolManager extends Component {
    //游戏页面对象池
    /**点的对象池 */
    pointNodePool: NodePool = new NodePool("pointPool");
    /**画笔的对象池 */
    drawNodePool: NodePool = new NodePool("drawPool");
    /**辅助线画笔的对象池 */
    drawLineNodePool: NodePool = new NodePool("drawLinePool");

    /**目标点位数量 */
    targetPointNum = 2000;
    /**初始化点的对象池 */
    initPointNodePool() {
        this.schedule(this.createPointNode, 0.02, macro.REPEAT_FOREVER, 0);
    }

    /**创建点位对象 */
    createPointNode() {
        //超过点位则停止生成（防止外部增加点位数量影响分帧）
        if (this.pointNodePool.size() >= this.targetPointNum) {
            this.stopGeneratePointNodePool();
            return;
        }
        //每一帧生成的数量
        let num = 15;
        for (let i = 0; i < num; i++) {
            let pointNode = instantiate(uiMgr.gamePointPrefab);
            this.pointNodePool.put(pointNode);
            //每次循环生成都判断是否超过目标点位数量
            if (this.pointNodePool.size() >= this.targetPointNum) {
                this.stopGeneratePointNodePool();
                return;
            }
        }
    }

    /**停止生成点位对象池 */
    stopGeneratePointNodePool() {
        console.warn("停止生成点位对象池");
        this.unschedule(this.createPointNode);
    }
}

export let poolMgr = new poolManager();

