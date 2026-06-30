import { _decorator, Component, Label, Node, tween, Tween, UIOpacity, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('guideDialogueController')
export class guideDialogueController extends Component {
    animLine: Node = null;
    lineOpacity: UIOpacity = null;
    lab: Label = null;

    isInit: boolean = false;

    initComp(): void {
        this.animLine = this.node.getChildByName("animLine");
        this.lineOpacity = this.animLine.getComponent(UIOpacity);
        this.lab = this.node.getChildByName("lab").getComponent(Label);
    }

    showDialogue(str: string) {
        if(!this.isInit){
            this.isInit = true;
            this.initComp();
        }

        this.lab.string = str;
        this.node.active = true;

        Tween.stopAllByTarget(this.animLine);
        Tween.stopAllByTarget(this.lineOpacity);

        let baseScale = 0.95;
        tween(this.animLine)
            .set({ scale: new Vec3(baseScale, baseScale, 1) })
            .to(0.8, { scale: new Vec3(1, 1, 1) })
            .delay(0.3)
            .union()
            .repeatForever()
            .start();
        tween(this.lineOpacity)
            .set({ opacity: 0 })
            .to(0.7, { opacity: 255 })
            .to(0.3, { opacity: 0 })
            .delay(0.1)
            .union()
            .repeatForever()
            .start();
    }

    closeDialogue() {
        Tween.stopAllByTarget(this.animLine);
        Tween.stopAllByTarget(this.lineOpacity);

        this.node.active = false;
    }
}


