import { _decorator, Color, Component, Graphics, Node, Vec2 } from 'cc';
import { pData } from '../manager/playerData';
const { ccclass, property } = _decorator;

@ccclass('drawLineController')
export class drawLineController extends Component {
    /**画笔工具 */
    _Graphics: Graphics = null;
    /**辅助线颜色 */
    auxiliaryColor: Color = new Color("#BBC0D796");

    protected onLoad(): void {
        this._Graphics = this.getComponent(Graphics);
    }

    clearData() {
        this.clear();
        this.auxiliaryColor = new Color("#BBC0D796");
    }

    /**设置辅助线颜色 */
    setColor(color: Color) {
        this.auxiliaryColor = color;
    }

    /**清除辅助线 */
    clear() {
        this._Graphics.clear();
    }

    /**显示辅助线 */
    showAuxiliaryLine(rootPos: Vec2, fixDir: Vec2, lineLength: number) {
        //清空画布
        this._Graphics.clear();
        //设置辅助线颜色
        this._Graphics.strokeColor = this.auxiliaryColor;
        //设置线宽
        this._Graphics.lineWidth = 10;
        this._Graphics.moveTo(rootPos.x, rootPos.y);

        let targetPos = new Vec2(rootPos.x + fixDir.x * lineLength, rootPos.y + fixDir.y * lineLength);
        this._Graphics.lineTo(targetPos.x, targetPos.y);
        this._Graphics.stroke();
    }
}


