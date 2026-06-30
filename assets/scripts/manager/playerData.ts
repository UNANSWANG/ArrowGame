import { _decorator, Component, Node } from 'cc';
import { levelConfig } from '../json/jsonLevel';
import { ccStorageTools } from '../extention/storageTools';
import { AchiveTaskType, configData, GameEvent, PropsName, SaveKey } from './configData';
import { gm, PlatType } from './gm';
import { ccTimeTools } from '../extention/timeTools';
import { achiveConfig, JsonAchiveData } from '../json/jsonAchive';
import { uiMgr } from './UIManager';
import { httpMgr } from '../sdk/network/httpManager';
import { netConfig, urlConfig } from '../sdk/network/netConfig';
const { ccclass, property } = _decorator;

//用户游戏内数据
@ccclass('playerData')
export class playerData {
    /**当前已通关关卡数 */
    level = 0;
    /**线上关卡数 */
    onlinLevel = 0;
    /**当前关卡的最大生命值数量 */
    maxLife = 3;
    /**当前关卡的当前生命值数量 */
    currentLife = 0;
    /**当前关卡的关卡数据 */
    levelData: jsonLevelData = null;
    /**当前关卡需要完成的数量 */
    maxArrowNum = 0;
    /**当前关卡已完成的数量 */
    curArrowNum = 0;
    /**关卡主题模式0：白天，1：黑夜 */
    themeMode = 0;
    /**本局是否使用过辅助线 */
    isUseAuxiliaryLine: boolean = false;
    /**是否打开辅助线 */
    isShowAuxiliaryLine: boolean = false;
    /**关卡初始时间 */
    levelTime = 0;
    /**当前关卡彩色箭头数量 */
    colorArrowNum = 0;
    /**体力上限 */
    powerMax = 5;
    /**体力恢复时间 */
    recoveryTime = 300;
    /**道具集合 */
    propsNums = {};
    /**临时存储的徽章数据 */
    tempAchiveData = [];
    /**本关是否看过广告 */
    isShowAd: boolean = false;
    /**放大缩小 */
    isScale: boolean = false;
    /**使用辅助线(包含单线) */
    isUseLine: boolean = false;
    /**是否为冲刺关卡 */
    isSprint: boolean = false;
    /**连击次数 */
    comboNum = 0;
    /**当前阶段 */
    currentStage = -1;

    levelInit() {
        let data = levelConfig.tableData[this.realyLevel];
        this.levelData = JSON.parse(data.levelData);
        this.levelTime = data.levelTime;
        this.maxLife = data.lifeNum;
        this.currentLife = this.maxLife;
        this.isShowAuxiliaryLine = false;
        this.isUseAuxiliaryLine = false;

        //初始化成就任务数据
        pData.isShowAd = false;
        pData.isScale = false;
        pData.isUseLine = false;

        this.colorArrowNum = data.colorNum || 0;
        this.isSprint = data.isSprint == 1;

        //初始化连击次数
        this.comboNum = 0;
        //初始化当前阶段
        this.currentStage = -1;
        this.maxArrowNum = this.levelData.arrowData.length + this.levelData.bigArrowData.length;
        this.curArrowNum = 0;

        this.SDKReportLevel();
    }

    /**SDK关卡上报 */
    SDKReportLevel() {
        if (gm.hgSdk) {
            gm.hgSdk.track('LEVEL_ENTER', {
                enter_level_id: 0,	    //进入的关卡进度（ 0 ~ 1 之间的数值），需保留两位小数
                level_id: (pData.level + 1),    	//关卡ID，数值
            });
        }
    }

    /**上报关卡给后端 */
    reportLevel(isPass) {
        let progress = 0;
        //已经通关进度就是100%
        if (isPass) {
            progress = 100;
        } else {
            progress = this.levelProgress;
        }

        let levelReprotData = {
            is_pass: isPass ? 1 : 0,
            level: this.level + 1,
            level_progress: progress,
        }

        //TODO 测试
        // console.warn("上报关卡给后端", levelReprotData);
        httpMgr.post(urlConfig.levelReport, levelReprotData);
    }

    /**当前关卡进度 */
    get levelProgress() {
        return Math.floor((this.curArrowNum / this.maxArrowNum * 100));
    }

    /**循环后的实际关卡数（对应表格） */
    get realyLevel() {
        let totalLevels = levelConfig.tableData.length;
        const startIndex = 30;

        if (this.level < totalLevels) {
            return this.level;
        } else {
            // 从第30关开始循环
            return startIndex + ((this.level - startIndex) % (totalLevels - startIndex));
        }
    }

    /**增加用户关卡数 */
    addLevel() {
        //上报关卡完成
        this.reportLevel(true);
        this.level++;
        ccStorageTools.setData(SaveKey.level, this.level);

        //上传微信好友榜
        if (gm.platType === PlatType.wx) {
            const kvDataList = [];
            kvDataList.push({
                key: `level`,
                value: `${this.level}`
            });
            gm.API.setUserCloudStorage(kvDataList);
        }

        pData.setTaskProgress(AchiveTaskType.passLevel, this.level);
    }

    /**增加生命值 */
    addLife(num = 1) {
        this.currentLife += num;
        if (this.currentLife > this.maxLife) {
            this.currentLife = this.maxLife;
        }
        gm.Event.emit(GameEvent.refreshLife);
    }

    /**设置道具数量 */
    setPropsNum(propsName: PropsName, num: number) {
        if (num < 0) {
            num = 0;
        }
        this.propsNums[propsName] = num;
        ccStorageTools.setData(SaveKey.props, this.propsNums);
        gm.Event.emit(GameEvent.refreshProps);
    }

    /**获取道具数量 */
    getPropsNum(propsName: PropsName) {
        return this.propsNums[propsName] || 0;
    }

    /**修改道具数量 */
    fixPropsNum(propsName: PropsName, num = 1, isRefresh = true) {
        let tempNum = this.propsNums[propsName] || 0;
        tempNum += num;
        if (tempNum < 0) {
            tempNum = 0;
        }
        this.propsNums[propsName] = tempNum;
        ccStorageTools.setData(SaveKey.props, this.propsNums);
        if (isRefresh) {
            gm.Event.emit(GameEvent.refreshProps);
        }
    }

    /**初始化道具集合 */
    initPropsNum() {
        this.propsNums = ccStorageTools.getData(SaveKey.props) || {};
        //初始化体力数据
        let powerPropsNum = pData.propsNums[PropsName.power];
        if (powerPropsNum == null) {
            powerPropsNum = pData.powerMax;
            pData.setPropsNum(PropsName.power, powerPropsNum);
        }
    }

    /**外部修改体力接口 */
    changePower(num: number) {
        pData.fixPropsNum(PropsName.power, num, false);
        let powerNum = pData.getPropsNum(PropsName.power);
        if (powerNum >= pData.powerMax) {
            //设置下一体力恢复时间为0
            ccStorageTools.setData(SaveKey.powerRecoverTime, 0);
        }

        //减少体力时
        if (num < 0) {
            //消耗体力增加任务进度
            pData.addTaskProgress(AchiveTaskType.consumePower);

            let lastTime = ccStorageTools.getNumberData(SaveKey.powerRecoverTime);
            //体力未满的时候增加恢复时间，避免重复增加
            if (lastTime == 0 && powerNum < pData.powerMax) {
                let curTime = ccTimeTools.getTime();
                ccStorageTools.setData(SaveKey.powerRecoverTime, curTime + pData.recoveryTime);
            }
        }

        gm.Event.emit(GameEvent.refreshProps);
    }

    /**修改连击次数 */
    fixComboNum(num = 1) {
        this.comboNum += num;
        if(this.comboNum < 0){
            this.comboNum = 0;
        }

        let lastStage = this.currentStage;

        //初始为-1
        this.currentStage = -1;

        //更新当前阶段
        for(let j = configData.stageArr.length - 1; j >= 0; j--){
            if(this.comboNum >= configData.stageArr[j]){
                this.currentStage = j;
                break;
            }
        }

        if(this.currentStage != lastStage){
            gm.Event.emit(GameEvent.refreshSprintStage);
        }
    }

    /**获取指定类型当前的任务数据 */
    getCurrentTaskData(type: AchiveTaskType) {
        let taskKey = SaveKey.achiveRecord + type;
        //获取已完成的任务数
        let finishNum = ccStorageTools.getNumberData(taskKey);
        let targetNum = achiveConfig.getTypeData(type).length;
        let isFinish = finishNum >= targetNum;
        if (isFinish) {
            finishNum = targetNum - 1;
        }
        let currentData = achiveConfig.getTypeData(type)[finishNum];
        return currentData;
    }

    /**检测成就任务进度 */
    checkAchiveProgress(type: AchiveTaskType) {
        let num = pData.getTaskProgress(type);

        let curData: JsonAchiveData = this.getCurrentTaskData(type);

        if (num == curData.conditions) {
            gm.Event.emit(GameEvent.refreshRed);
            uiMgr.showAchiveTips(type);
        }
    }

    /**设置成就任务进度 */
    setTaskProgress(type: AchiveTaskType, progress: number, isCheck = true) {
        let key = SaveKey.myAchiveProgress + type;
        ccStorageTools.setData(key, progress);
        if (isCheck) {
            this.checkAchiveProgress(type);
        }
    }

    /**增加成就任务进度 */
    addTaskProgress(type: AchiveTaskType, num = 1) {
        let key = SaveKey.myAchiveProgress + type;
        let progress = ccStorageTools.getNumberData(key);
        progress += num;
        ccStorageTools.setData(key, progress);

        this.checkAchiveProgress(type);
    }

    /**获取当前类型的任务进度 */
    getTaskProgress(type: number) {
        let key = SaveKey.myAchiveProgress + type;
        let progress = ccStorageTools.getNumberData(key);

        //限时的需要单独处理
        if (type == AchiveTaskType.challengeDayLevel) {
            progress = ccStorageTools.getLimitTimeData(SaveKey.challengeDayLevelNum) || 0;
        } else if (type == AchiveTaskType.challengeDayDay) {
            let lastTime = ccStorageTools.getNumberData(SaveKey.lastChallengeTime);
            let continueNum = ccStorageTools.getNumberData(SaveKey.continuousDayNum);

            //前一天0点的时间戳
            let lastDayTime = ccTimeTools.getDayTime(-1);
            let curTime = ccTimeTools.getCurrentTime();
            //不是今天或者记录的是前一天的时间戳，说明不是连续挑战
            if (lastTime != lastDayTime && lastTime != curTime) {
                continueNum = 0;
                ccStorageTools.setData(SaveKey.continuousDayNum, continueNum);
            }
            progress = continueNum;
        } else if (type == AchiveTaskType.repeatChallengeLevel) {
            let playLevelNumArr = ccStorageTools.getData(SaveKey.playLevelNumArr) || {};

            let max = 0;

            for (let key in playLevelNumArr) {
                max = Math.max(max, playLevelNumArr[key]);
            }

            progress = max;
        }

        return progress;
    }

    /**获取是否有可领取任务 */
    hasCanGetTask() {
        for (let type in achiveConfig.achiveTypeData) {
            let taskKey = SaveKey.achiveRecord + type;
            //获取已完成的任务数
            let finishNum = ccStorageTools.getNumberData(taskKey);
            let targetNum = achiveConfig.getTypeData(type).length;
            let isFinish = finishNum >= targetNum;
            if (isFinish) {
                continue;
            }
            let currentData = achiveConfig.getTypeData(type)[finishNum];
            let curProgress = pData.getTaskProgress(Number(type));
            if (curProgress >= currentData.conditions) {
                return true;
            }
        }
        return false;
    }
}

export let pData = new playerData();

interface jsonLevelData {
    /**关卡宽度 */
    width: number;
    /**关卡高度 */
    height: number;
    /**小箭头数据 */
    arrowData: any[];
    /**大箭头数据 */
    bigArrowData: any[];
    /**道具数据 */
    propsData: any[];
    /**边缘道具数据 */
    externalPropsData: any[];
}