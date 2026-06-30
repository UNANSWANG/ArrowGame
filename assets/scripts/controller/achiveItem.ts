import { _decorator, Component, Label, Node, Sprite } from 'cc';
import { achiveConfig, JsonAchiveData } from '../json/jsonAchive';
import { imgPath } from '../manager/pathConfig';
import { ccTools } from '../extention/generalTools';
import { SaveKey } from '../manager/configData';
import { ccStorageTools } from '../extention/storageTools';
const { ccclass, property } = _decorator;

@ccclass('achiveItem')
export class achiveItem extends Component {

    titleLab: Label = null;
    timeLab: Label = null;
    badge: Sprite = null;
    logo: Sprite = null;

    isInt = false;

    protected onLoad(): void {
        this.titleLab = this.node.getChildByName("titleLab").getComponent(Label);
        this.timeLab = this.node.getChildByName("timeLab").getComponent(Label);
        this.badge = this.node.getChildByName("badge").getComponent(Sprite);
        this.logo = this.node.getChildByName("logo").getComponent(Sprite);
    }

    initData(type, idx) {
        //只初始化一次
        if (this.isInt) {
            return;
        }
        this.isInt = true;
        let data: JsonAchiveData = achiveConfig.getTypeData(type)[idx];
        if (!data) {
            return;
        }
        this.titleLab.string = data.name;
        //获取时间
        let timeKey = SaveKey.myAchiveTime + type + "_" + idx;
        let time = ccStorageTools.getData(timeKey);
        if(time){
            this.timeLab.string = time;
        }
        ccTools.loadImg(this.badge, imgPath.badge + (idx + 1));
        ccTools.loadImg(this.logo, imgPath.achiveLogo + type);
    }
}


