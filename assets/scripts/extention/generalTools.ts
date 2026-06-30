import { _decorator, Component, Node, Sprite, Vec2 } from 'cc';
import { gm } from '../manager/gm';
import { audioManager, audioMgr } from '../manager/audioManager';
import { taskDesc } from '../manager/configData';
import { imgPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { ccResTools } from './resTools';
const { ccclass, property } = _decorator;

@ccclass('generalTools')
export class generalTools {
    /**显示指定子节点 */
    showChildByIdx(parent: Node, idx: number) {
        for (let i = 0; i < parent.children.length; i++) {
            parent.children[i].active = i == idx;
        }
    }

    /**显示指定数组索引节点 */
    showArrayByIdx(arr: Node[], idx: number) {
        for (let i = 0; i < arr.length; i++) {
            arr[i].active = i == idx;
        }
    }

    /**销毁并移除所有子节点 */
    destoryAllChild(parent: Node) {
        for (let i = parent.children.length - 1; i >= 0; i--) {
            let childNode = parent.children[i];
            childNode.removeFromParent();
            childNode.destroy();
        }
    }

    /**获得方向 */
    GetDir(x1: number, y1: number, x2: number, y2: number) {
        const dx = x2 - x1;
        const dy = y2 - y1;

        // 计算距离并归一化为单位向量
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) {
            return new Vec2(0, 0);
        }

        return new Vec2(dx / distance, dy / distance);
    }

    /**获得数据向无穷大取整 */
    ceilInteger(num: number) {
        if (num === 0) return 0;
        return Math.ceil(Math.abs(num)) * (num > 0 ? 1 : -1);
    }

    /**计算两点间距离的辅助函数 */
    calculateDistance(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**获取中文数字(0-10) */
    getChineseNum(num: number) {
        switch (num) {
            case 0:
                return "零";
            case 1:
                return "一";
            case 2:
                return "二";
            case 3:
                return "三";
            case 4:
                return "四";
            case 5:
                return "五";
            case 6:
                return "六";
            case 7:
                return "七";
            case 8:
                return "八";
            case 9:
                return "九";
            case 10:
                return "十";
            default:
                return num.toString();
        }
    }

    /**震动 */
    vibrate() {
        if (audioMgr.isVibrat) {
            gm.API.vibrateShort();
        }
    }

    /**获得字符串 */
    getStrByType(type: number, num: number) {
        return taskDesc[type].replace("$", num.toString());
    }

    /**异步加载图片进sprite */
    async loadImg(sprite: Sprite, url: string) {
        url += "/spriteFrame";
        let img = await ccResTools.loadPic(uiMgr.resBundle, url);
        if(!img){
            console.log("加载图片失败", url);
            return;
        }
        sprite.spriteFrame = img;
    }

    /**异步加载远端图片进sprite */
    async loadUrlImg(sprite: Sprite, url: string) {
        let img = await ccResTools.loadPicByUrl(url);
        if(!img){
            console.log("加载图片失败", url);
            return;
        }
        sprite.spriteFrame = img;
    }
}
export let ccTools = new generalTools();

