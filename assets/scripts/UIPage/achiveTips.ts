import { _decorator, Component, Node, Animation, Label, Sprite, Widget, tween, Vec3, UIOpacity } from 'cc';
import { pData } from '../manager/playerData';
import { imgPath } from '../manager/pathConfig';
import { ccTools } from '../extention/generalTools';
import { ccStorageTools } from '../extention/storageTools';
import { achiveConfig } from '../json/jsonAchive';
import { SaveKey } from '../manager/configData';
const { ccclass, property } = _decorator;

@ccclass('achiveTips')
export class achiveTips extends Component {

    protected onLoad(): void {
        this.node.getComponent(Widget).updateAlignment();
    }

    start() {
        // let animation = this.getComponent(Animation);
        // animation.play();
        // animation.on(Animation.EventType.FINISHED, () => {
        //     this.node.removeFromParent();
        //     this.node.destroy();
        // }, this);

        let opacity = this.node.getComponent(UIOpacity);
        let firstPos = new Vec3(this.node.position.x, this.node.position.y + 50, 0);
        let targetPos = new Vec3(this.node.position);
        tween(this.node)
            .set({ position: firstPos })
            .to(0.2, { position: targetPos })
            .delay(1.8)
            .call(() => {
                this.node.removeFromParent();
                this.node.destroy();
            })
            .start();

        opacity.opacity = 255;
        tween(opacity)
            .set({ opacity: 0 })
            .to(0.2, { opacity: 255 })
            .delay(1.6)
            .to(0.2, { opacity: 0 })
            .start();
    }

    initData(type) {
        let taskKey = SaveKey.achiveRecord + type;
        //获取已完成的任务数
        let finishNum = ccStorageTools.getNumberData(taskKey);
        let targetNum = achiveConfig.getTypeData(type).length;
        let isFinish = finishNum >= targetNum;
        if (isFinish) {
            finishNum = targetNum - 1;
        }
        let taskData = achiveConfig.getTypeData(type)[finishNum];

        let nameLab = this.node.getChildByName('nameLab').getComponent(Label);
        nameLab.string = taskData.name;

        let logoSp = this.node.getChildByName('logo').getComponent(Sprite);
        let badgeSp = this.node.getChildByName('badge').getComponent(Sprite);


        let logoUrl = imgPath.achiveLogo + type;
        let badgeUrl = imgPath.badge + (finishNum + 1);

        ccTools.loadImg(logoSp, logoUrl);
        ccTools.loadImg(badgeSp, badgeUrl);
    }
}


