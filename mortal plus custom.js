// ==UserScript==
// @name         Mortal 显示恶手率
// @namespace    https://viayoo.com/
// @version      2.0.8
// @description  Mortal牌谱解析增强脚本 (雀魂麻将/天凤/麻雀一番街)
// @author       mcube-12139
// @author       modify by Miku39
// @run-at       document-idle
// @include      /^https?:\/\/mjai.ekyu.moe\/report\/[A-Za-z0-9-_]+.html$/
// @include      /^https?:\/\/mjai.ekyu.moe\/?([A-Za-z0-9-_]+.html)?$/
// @grant        none
// ==/UserScript==

{
    //保留n位小数
    function roundFun(value, n) {
        return Math.round(value*Math.pow(10,n))/Math.pow(10,n);
    }

    if(window.location.pathname.startsWith("/report/")) {

        const badMoveUpperLimit = 5; //恶手率
        const badMoveUpperLimitCustom = 10; //恶手率

        let badChooseNum = 0;
        let badChooseNumCustom = 0;

        const lang = document.documentElement.lang;
        const i18nText = {};
        if (lang == "zh-CN") {
            i18nText.badMove = "恶手";
            i18nText.badMoveRatio = "恶手率";
            i18nText.matchRatio = "AI 一致率";
            i18nText.metaData = "元数据";
        } else if (lang == "ja") {
            i18nText.badMove = "Bad move";
            i18nText.badMoveRatio = "bad moves/total";
            i18nText.matchRatio = "AI一致率";
            i18nText.metaData = "メタデータ";
        }  else if (lang == "ko") {
            i18nText.badMove = "Bad move";
            i18nText.badMoveRatio = "bad moves/total";
            i18nText.matchRatio = "matches/total";
            i18nText.metaData = "메타데이터";
        } else {
            i18nText.badMove = "Bad move";
            i18nText.badMoveRatio = "bad moves/total";
            i18nText.matchRatio = "matches/total";
            i18nText.metaData = "Metadata";
        }
        i18nText.modelTag = "model tag";
        //
        i18nText.seatTypeA0 = "东起";
        i18nText.seatTypeA1 = "南起";
        i18nText.seatTypeA2 = "西起";
        i18nText.seatTypeA3 = "北起";
        //
        i18nText.seatTypeB0 = "东家";
        i18nText.seatTypeB1 = "南家";
        i18nText.seatTypeB2 = "西家";
        i18nText.seatTypeB3 = "北家";
        //
        i18nText.seatTypeC0 = "自家";
        i18nText.seatTypeC1 = "下家";
        i18nText.seatTypeC2 = "对家";
        i18nText.seatTypeC3 = "上家";
        //
        i18nText.Ron = "荣和";
        i18nText.Tsumo = '自摸';
        i18nText.Ryuukyoku = '流局';
        i18nText.RyuukyokuTsumo = "流局满贯";
        i18nText.RyuukyokuType1 = "九种九牌";
        //四风连打、四杠散了、四家立直 //三家和了
        //
        i18nText.badMoveError = "(恶手率统计只支持最新版本Mortal,当前版本生成结果不可靠)"
        //
        i18nText.badMoveUp = " (严重鸡打 权重<=5%)";
        i18nText.badMoveDown = " (普通错误 权重5~10%)";
        i18nText.badMoveNull = " ";
        i18nText.badMoveSymbol = "%";
        i18nText.badMoveDiffer = "差值: ";
        //
        i18nText.badMoveDiffer1 = "微差(0~5): ";
        i18nText.badMoveDiffer2 = "小幅差距(5~10): ";
        i18nText.badMoveDiffer3 = "低等差距(10~20): ";
        i18nText.badMoveDiffer4 = "中等差距(20~40): ";
        i18nText.badMoveDiffer5 = "高等差距(40~60): ";
        i18nText.badMoveDiffer6 = "大幅度差距(60~80): ";
        i18nText.badMoveDiffer7 = "压倒性差距(80~100): ";
        //
        i18nText.badMoveSum = " (总计)";

        const tenhouText = {};
        tenhouText.Ron = '和了'; //荣和
        tenhouText.Tsumo = '和了'; //自摸
        tenhouText.Ryuukyoku = '流局'; //荒牌流局
        tenhouText.RyuukyokuTsumo = "流し満貫"; //流局满贯
        tenhouText.RyuukyokuType1 = "九種九牌"; //九种九牌
        //四风连打、四杠散了、四家立直 //三家和了

        const matchRule = {};
        matchRule.isInit = false;
        matchRule.isRon3 = true; //是否允许三家荣和
        
        const orderLosses = document.getElementsByClassName("order-loss");
        for (let i = 0, length = orderLosses.length; i != length; ++i) {
            const orderLoss = orderLosses[i];
            const chosenIndex = parseInt(orderLoss.innerText.substring(2));

            const turnInfo = orderLoss.parentElement;
            const summary = turnInfo.parentElement;
            const collapseEntry = summary.parentElement;

            const details = collapseEntry.lastChild;
            const table = details.firstChild;
            const tbody = table.lastChild;

            const chosenTr = tbody.childNodes[chosenIndex - 1];
            const weightTd = chosenTr.lastChild;
            const numSpan = weightTd.innerHTML.replace(/<.*?>/g, ""); //过滤html标签, 只保留文字内容

            const chosenWeight = parseFloat(numSpan);

            if (chosenWeight <= parseFloat(badMoveUpperLimit)) { //严重恶手
                const badChooseNode = document.createElement("span");
                badChooseNode.innerHTML = ` \u00A0\u00A0\u00A0${i18nText.badMove}${i18nText.badMoveUp}`;
                badChooseNode.style.color = "#f00";
                badChooseNode.style.fontWeight = 900;
                badChooseNode.style.fontSize = "20px";
                turnInfo.appendChild(badChooseNode);

                collapseEntry.style.border = "2px solid #f00";

                badChooseNum++;
            }else if (chosenWeight <= parseFloat(badMoveUpperLimitCustom)) { //普通恶手
                const badChooseNode = document.createElement("span");
                badChooseNode.innerHTML = ` \u00A0\u00A0\u00A0${i18nText.badMove}${i18nText.badMoveDown}`;
                badChooseNode.style.color = "#6600FF";
                badChooseNode.style.fontWeight = 700;
                badChooseNode.style.fontSize = "20px";
                turnInfo.appendChild(badChooseNode);

                collapseEntry.style.border = "2px solid #6600FF";

                badChooseNumCustom++;
            }
        } //for

        // 新增 显示 Mortal 版本
        const jsonStr = localStorage.getItem("Mortal_Type");
        const mortal_New = localStorage.getItem("Mortal_New");
        var mortalMap = null;
        if(jsonStr != null) {
            let obj = Object.entries(JSON.parse(jsonStr));
            mortalMap = new Map(obj);
        }

        //const metaData = document.getElementsByClassName("collapse")[1];
        let metaData;
        const detailsElements = document.getElementsByTagName("details");
        for (let i = 0, length = detailsElements.length; i != length; ++i) {
            const details = detailsElements[i];
            const summary = details.firstChild;
            if (summary.firstChild.textContent == i18nText.metaData) {
                metaData = details;
                metaData.toggleAttribute("open", true); //打开 元数据 选项卡
                break;
            }
        }
        const metaDataDl = metaData.lastChild;
        
        let matchRatioDd = null;
        let version = null;
        for (let i = 0, length = metaDataDl.childNodes.length; i != length; ++i) {
            const metaDataChild = metaDataDl.childNodes[i];
            if(metaDataChild.nodeName == "DT" && metaDataChild.textContent == i18nText.modelTag) {
                let ele = metaDataDl.childNodes[i + 1];
                
                //判断当前是否是最新版本的mortal
                if(mortal_New != null) {
                    if(mortal_New != ele.innerText) {
                        let aiEle = metaDataDl.childNodes[i - 1];
                        aiEle.innerText = aiEle.innerText + ` \u00A0\u00A0\u00A0${i18nText.badMoveError}`;
                        aiEle.style.color = "#f00";
                    }
                }
                
                //处理当前版本
                if(mortalMap != null) {
                    let mortalValue = mortalMap.get(ele.innerText);
                    if(mortalValue != undefined) {
                        ele.innerText = mortalValue;
                    }
                }
            }
            if (metaDataChild.nodeName == "DT" && metaDataChild.textContent == i18nText.matchRatio) {
                matchRatioDd = metaDataDl.childNodes[i + 1];
                version = metaDataDl.childNodes[i + 2];
                //
                metaDataDl.childNodes[i-2].style.color = "#6600FF"; //rating
                metaDataDl.childNodes[i-1].style.color = "#6600FF";
                metaDataDl.childNodes[i].style.color = "#6600FF"; //AI 一致率
                metaDataDl.childNodes[i+1].style.color = "#6600FF";
                break;
            }
        }
        const matchRatioText = matchRatioDd.textContent;
        const chooseNumStr = matchRatioText.substring(matchRatioText.indexOf("/") + 1);
        const chooseNum = parseInt(chooseNumStr);

        const badChooseRatioDt = document.createElement("dt");
        badChooseRatioDt.style.color = "#FF0066";
        badChooseRatioDt.innerHTML = i18nText.badMoveRatio + i18nText.badMoveNull + badMoveUpperLimit + i18nText.badMoveSymbol;
        
        const badChooseRatioDd = document.createElement("dd");
        badChooseRatioDd.style.color = "#FF0066";
        badChooseRatioDd.innerHTML = `${badChooseNum}/${chooseNum} = ${(100 * badChooseNum / chooseNum).toFixed(3)}%`;
        metaDataDl.insertBefore(badChooseRatioDd, version);
        metaDataDl.insertBefore(badChooseRatioDt, badChooseRatioDd);

        /* 新增 计算总恶手数 */
        badChooseNumCustom += badChooseNum; //计算总恶手数

        const badChooseRatioDt2 = document.createElement("dt");
        badChooseRatioDt2.style.color = "#FF0066";
        badChooseRatioDt2.innerText = i18nText.badMoveRatio + i18nText.badMoveNull + badMoveUpperLimitCustom + i18nText.badMoveSymbol;
        
        const badChooseRatioDd2 = document.createElement("dd");
        badChooseRatioDd2.style.color = "#FF0066";
        badChooseRatioDd2.innerHTML = `${badChooseNumCustom}/${chooseNum} = ${(100 * badChooseNumCustom / chooseNum).toFixed(3)}%`;
        
        metaDataDl.insertBefore(badChooseRatioDd2, version);
        metaDataDl.insertBefore(badChooseRatioDt2, badChooseRatioDd2);

        /* 起始信息详细化 */
        function parmeHandle(eastScoreChange, southScoreChange, westScoreChange, northScoreChange) {
            let scoreArray = [{sc: eastScoreChange, i: 0}, {sc: southScoreChange, i: 1}, {sc: westScoreChange, i: 2}, {sc: northScoreChange, i: 3}];
            let newScoreArray = scoreArray.filter((obj) => {
                return obj.sc != 0;
            });
            let scoreAddArray = newScoreArray.filter((obj) => { //荣和的玩家
                return obj.sc > 0;
            });
            let scoreSubArray = newScoreArray.filter((obj) => { //放铳的玩家
                return obj.sc < 0;
            });
            scoreAddArray.sort((a,b)=>{return b.sc-a.sc});

            return {scoreArray: scoreArray, newScoreArray: newScoreArray, scoreAddArray: scoreAddArray, scoreSubArray: scoreSubArray};
        }

        function handleRon(kyoku, startPlayerIndex, eastScoreChange, southScoreChange, westScoreChange, northScoreChange) { //处理荣和
            let obj = parmeHandle(eastScoreChange, southScoreChange, westScoreChange, northScoreChange);
            let scoreAddArray = obj.scoreAddArray;
            let scoreSubArray = obj.scoreSubArray;
            let selfPlayerIndex = getPlayerIndexByPlayerSeatName(getPlayerSeatNameByPlayerIndex(startPlayerIndex, kyoku, OUTSTYLE.B), OUTSTYLE.B);
            //
            let str = "";
            for (let i = 0; i < scoreAddArray.length; i++) {
                const scoreAdd = scoreAddArray[i];

                let scAddPlayerSeatName = getPlayerSeatNameByPlayerIndex(scoreAdd.i, kyoku, OUTSTYLE.B); //荣和的玩家
                let scAddPlayerViewName = getSelfViewPlayerNameByTargetPlayerIndex(selfPlayerIndex, getPlayerIndexByPlayerSeatName(scAddPlayerSeatName, OUTSTYLE.B));

                let scSubPlayerSeatName = getPlayerSeatNameByPlayerIndex(scoreSubArray[0].i, kyoku, OUTSTYLE.B); //放铳的玩家
                let scSubPlayerViewName = getSelfViewPlayerNameByTargetPlayerIndex(selfPlayerIndex, getPlayerIndexByPlayerSeatName(scSubPlayerSeatName, OUTSTYLE.B));

                str += scAddPlayerSeatName + ` (${scAddPlayerViewName}) ` + 
                `<span style="color:#990000">${i18nText.Ron}</span>` + i18nText.badMoveNull + 
                scSubPlayerSeatName + ` (${scSubPlayerViewName}) ` + 
                "+" + scoreAdd.sc + i18nText.badMoveNull + scoreSubArray[0].sc;
            }
            
            return str;
        }
        function handleTsumo(kyoku, startPlayerIndex, eastScoreChange, southScoreChange, westScoreChange, northScoreChange) { //处理自摸

        }
        function handleRyuukyoku(kyoku, startPlayerIndex, eastScoreChange, southScoreChange, westScoreChange, northScoreChange) { //处理流局
            
        }
        const OUTSTYLE = {
            A: 1,
            B: 1 << 1,
            C: 1 << 2,
        }
        function getTextByOutStyle(outStyle, index) {
            if(outStyle == OUTSTYLE.A)
                return eval("i18nText.seatTypeA" + index); //seatTypeA0 //东起
            else if(outStyle == OUTSTYLE.B)
                return eval("i18nText.seatTypeB" + index); //seatTypeB0 //东家
            else if(outStyle == OUTSTYLE.C)
                return eval("i18nText.seatTypeC" + index); //seatTypeC0 //自家
            else{
                console.warn("outStyle是无效的!");
            }
        }
        
        function getSelfViewPlayerNameByTargetPlayerIndex(selfIndex, targetPlayerIndex) {
            const viewMap = new Map();

            let viewArray = [
                { value: -3, name: i18nText.seatTypeC1 }, //下家
                { value: -2, name: i18nText.seatTypeC2 }, //对家
                { value: -1, name: i18nText.seatTypeC3 }, //上家
                { value: 0, name: i18nText.seatTypeC0 },  //自家
                { value: 1, name: i18nText.seatTypeC1 },  //下家
                { value: 2, name: i18nText.seatTypeC2 },  //对家
                { value: 3, name: i18nText.seatTypeC3 },  //上家
            ];
            viewArray.forEach((item,index)=> {
                viewMap.set(item.value, item.name);
            });

            const getValue = (offset) => {
                if(offset > 0)
                    return offset -4;
                else
                    return offset +4;
            }
            
            let offset = targetPlayerIndex - selfIndex;
            let result;
            do {
                result = viewMap.get(offset);
            } while (offset = getValue(offset), result == undefined);
            return result;
        }
        function getPlayerIndexByPlayerSeatName(playerSeatName, outStyle) {
            var seatArray;
            if(outStyle == OUTSTYLE.A)
                seatArray = [i18nText.seatTypeA0, i18nText.seatTypeA1, i18nText.seatTypeA2, i18nText.seatTypeA3]; //东起, 南起, 西起, 北起
            else if(outStyle == OUTSTYLE.B)
                seatArray = [i18nText.seatTypeB0, i18nText.seatTypeB1, i18nText.seatTypeB2, i18nText.seatTypeB3]; //东家, 南家, 西家, 北家
            else{
                console.warn("outStyle是无效的!");
                seatArray = [i18nText.seatTypeA0, i18nText.seatTypeA1, i18nText.seatTypeA2, i18nText.seatTypeA3]; //东起, 南起, 西起, 北起
            }
            const seatMap = new Map();
            seatArray.forEach((item,index)=> {
                seatMap.set(item, index);
            });
            return seatMap.get(playerSeatName);
        }
        function getPlayerSeatNameByPlayerIndex(playerIndex, kyoku, outStyle) {
            var seatArray;
            if(outStyle == OUTSTYLE.A)
                seatArray = [i18nText.seatTypeA0, i18nText.seatTypeA3, i18nText.seatTypeA2, i18nText.seatTypeA1]; //东起, 北起, 西起, 南起
            else if(outStyle == OUTSTYLE.B)
                seatArray = [i18nText.seatTypeB0, i18nText.seatTypeB3, i18nText.seatTypeB2, i18nText.seatTypeB1]; //东家, 北家, 西家, 南家
            else{
                console.warn("outStyle是无效的!");
                seatArray = [i18nText.seatTypeA0, i18nText.seatTypeA3, i18nText.seatTypeA2, i18nText.seatTypeA1]; //东起, 北起, 西起, 南起
            }
            const seatMap = new Map();
            seatArray.forEach((item,index)=> {
                seatMap.set(item, index);
            });
            const getValueByEachArray = (array, startIndex, eachCount) => {
                let length = array.length;
                let targetIndex = startIndex;
                for (let i = eachCount; i > 0; i--) {
                    if(++targetIndex >= length)
                        targetIndex = 0;
                }
                return array[targetIndex];
            }
            const getStart = (playerIndex, kyoku, outStyle) => {
                switch (playerIndex + kyoku) {
                    case 0:
                        return getTextByOutStyle(outStyle, 0); //东起
                    case 1:
                        return getTextByOutStyle(outStyle, 1); //南起
                    case 2:
                        return getTextByOutStyle(outStyle, 2); //西起
                    case 3:
                        return getTextByOutStyle(outStyle, 3); //北起
                    default:
                        return getStart(playerIndex, kyoku -4, outStyle);
                }
            }
            const get = (playerIndex, kyoku, outStyle) => {
                let startIndex = seatMap.get(getStart(playerIndex, 0, outStyle));
                return getValueByEachArray(seatArray, startIndex, kyoku);
            }
            if(kyoku == 0)
                return getStart(playerIndex, kyoku, outStyle);
            else
                return get(playerIndex, kyoku, outStyle);
        }
        function getTextLineNum(ele) {
            let styles = getComputedStyle(ele, null);
            let lineHeight = parseFloat(styles.lineHeight);
            let height = parseFloat(styles.height);
            let offsetHeight = parseFloat(ele.offsetHeight);
            let lineNum = offsetHeight / lineHeight;
            return Math.round(lineNum);
        }
        const summaryEle = document.getElementsByClassName("kyoku-toc")[0];
        summaryEle.style.position = "relative";
        for (let j = 0; j < summaryEle.children.length; j++) {
            const ele = summaryEle.children[j];
            ele.style.minWidth = "20%";
        }
        const kyokuEle = summaryEle.getElementsByTagName("a");
        const endInfoEle = summaryEle.getElementsByClassName("end-status");
        //
        const section = document.getElementsByTagName("section");
        for (let i = 0, length = section.length; i != length; ++i) {
            const titleEle = section[i].children[0];
            const titleKyokuEle = titleEle.getElementsByTagName("a");
            const titleEndInfoEle = titleEle.getElementsByClassName("end-status");

            const tenhouData = section[i].getElementsByTagName("iframe")[0].src;
            const playerIndexStr = tenhouData.match(/tw=[0-3]/)[0];
            const startPlayerIndex = parseInt(playerIndexStr.substring(playerIndexStr.length -1)); //起始玩家索引
            const json = JSON.parse(decodeURI(tenhouData.substring(tenhouData.indexOf("{")))); //天凤对局数据
            const kyoku = json.log[0][0][0]; //局数
            const count = json.log[0][0][1]; //本场数
            const currScore = json.log[0][1]; //当前点数
            const scoreChange = json.log[0][json.log[0].length -1]; //点数变动
            const endMode = scoreChange[0];
            
            //解析规则
            if(matchRule.isInit == false) {
                const disp = json.rule.disp;

                if(disp.indexOf("間") != -1) { //雀魂
                    matchRule.isRon3 = true;
                    //console.log("雀魂牌谱");
                }else if(disp.indexOf("Player") != -1) { //一番街
                    matchRule.isRon3 = false;
                    //console.log("一番街牌谱");
                }else{ //默认为天凤
                    matchRule.isRon3 = false;
                    //console.log("默认为天凤牌谱(包括自定义牌谱)");
                }
                matchRule.isInit = true;
            }

            //四家当前分数
            const eastScore = currScore[0]; //东
            const southScore = currScore[1]; //南
            const westScore = currScore[2]; //西
            const northScore = currScore[3]; //北
            //四家分数变化(直接) //送棒的-1000没有显示
            let eastScoreChange = [];
            let southScoreChange = [];
            let westScoreChange = [];
            let northScoreChange = [];

            let ronCount = (scoreChange.length -1) / 2;
            if(scoreChange.length > 1) { //比如九种九牌, 是没有分数变化的数据的
                //是否有多家荣和
                for (let j = 0; j < ronCount; j++) { //处理可能的多家荣和
                    eastScoreChange.push(scoreChange[1+ j*2][0]); //东
                    southScoreChange.push(scoreChange[1+ j*2][1]); //南
                    westScoreChange.push(scoreChange[1+ j*2][2]); //西
                    northScoreChange.push(scoreChange[1+ j*2][3]); //北
                }
            }
            //判断模式
            if(endMode == tenhouText.Ron) { //自摸、荣和
                let str = "";
                for (let j = 0; j < ronCount; j++) { //处理可能的多家荣和
                    if(j>0) //处理多家
                        str += ", ";
                    
                    let obj = parmeHandle(eastScoreChange[j], southScoreChange[j], westScoreChange[j], northScoreChange[j]);
                    
                    if(eastScoreChange[j] == 0 || 
                        southScoreChange[j] == 0 || 
                        westScoreChange[j] == 0 || 
                        northScoreChange[j] == 0) { //如果有任何一家分数变动为0, 则为荣和
                        str += handleRon(kyoku, startPlayerIndex, eastScoreChange[j], southScoreChange[j], westScoreChange[j], northScoreChange[j]);
                    }if(obj.scoreAddArray.length == 3) { //判断是否是三家荣和
                        if(matchRule.isRon3) //如果启用了三家和了的规则 //? 可能是没有必要的判断? 等待使用三种游戏牌谱分别进行查证
                            str += handleRon(kyoku, startPlayerIndex, eastScoreChange[j], southScoreChange[j], westScoreChange[j], northScoreChange[j]);
                        else{ //流局 //? 可能是没有必要的判断? 等待使用三种游戏牌谱分别进行查证
                            // let str = handleRyuukyoku(kyoku, startPlayerIndex, eastScoreChange[j], southScoreChange[j], westScoreChange[j], northScoreChange[j]);
                            // console.log(str);
                        }

                    }else{ //否则都是自摸
                        // str += handleTsumo(kyoku, startPlayerIndex, eastScoreChange[j], southScoreChange[j], westScoreChange[j], northScoreChange[j]);
                    }
                }//for
                if(str.length > 0) {
                    const span = document.createElement("span");
                    span.innerHTML = ` \u00A0\u00A0\u00A0` + str;
                    endInfoEle[i].parentElement.appendChild(span);

                    // const span1 = document.createElement("span");
                    // span1.className = "end-status";
                    // span1.innerText = ` \u00A0\u00A0` + str;
                    // titleEndInfoEle[0].parentElement.appendChild(span1);

                    let lineNum = getTextLineNum(span)
                    if(lineNum > 1){ //如果新添加的文字有多行, 则进行对齐
                        for (let j = 1; j < lineNum; j++) {
                            summaryEle.children[0].insertBefore(document.createElement("br"), kyokuEle[i].parentElement.nextElementSibling);
                        }
                    }
                }
            }else if(endMode == tenhouText.Ryuukyoku){ //荒牌流局 //流局, 如果有分数改变则处理
                // let str = handleRyuukyoku(kyoku, startPlayerIndex, eastScoreChange[j], southScoreChange[j], westScoreChange[j], northScoreChange[j]);
                // console.log(str);
            }else if(endMode == tenhouText.RyuukyokuTsumo) { //流局满贯 (等同于自摸8000)
                // let str = handleRyuukyoku(kyoku, startPlayerIndex, eastScoreChange[j], southScoreChange[j], westScoreChange[j], northScoreChange[j]);
                // console.log(str);
            }else if(endMode == tenhouText.RyuukyokuType1) { //九种九牌 //流局, 如果有分数改变则处理
                // let str = handleRyuukyoku(kyoku, startPlayerIndex, eastScoreChange[j], southScoreChange[j], westScoreChange[j], northScoreChange[j]);
                // console.log(str);
            }else{ //四风连打、四杠散了、四家立直 //三家和了 //流局, 如果有分数改变则处理
                // let str = handleRyuukyoku(kyoku, startPlayerIndex, eastScoreChange[j], southScoreChange[j], westScoreChange[j], northScoreChange[j]);
                // console.log(str);
            }

            const span = document.createElement("span");
            let str = getPlayerSeatNameByPlayerIndex(startPlayerIndex, kyoku, OUTSTYLE.A);
            span.innerText = ` \u00A0\u00A0\u00A0` + str;
            span.style.position = "absolute";
            span.style.left = "130px";
            if(str == i18nText.seatTypeA0) //东起
                span.style.color = "#CC0000";
            else
                span.style.color = "#333";
            kyokuEle[i].parentElement.appendChild(span);
            titleKyokuEle[0].innerText += `\u00A0\u00A0` + str;
        }

        /* 列出选择权重 */
        const map = new Map(); //使用map保证重置循坏后的唯一性
        const boxObjStr = '{"left":0,"top":0}';
        const entry = document.getElementsByClassName("collapse entry");
        for (let i = 0, length = entry.length; i != length; ++i) {
            entry[i].style.position = "relative";

            const roleEle = entry[i].getElementsByClassName("role");

            let selfPai = roleEle[0].parentElement;
            let mortalPai = roleEle[1].nextElementSibling;

            if(mortalPai.tagName.toLocaleLowerCase() == 'details') {
                mortalPai = roleEle[1].nextSibling;
            }

            if (Object.prototype.toString.call(selfPai.childNodes[selfPai.childNodes.length -2]) == '[object SVGSVGElement]') {
                if(selfPai.childNodes[selfPai.childNodes.length -2].tagName.toLocaleLowerCase() == 'svg') { //如果有多张牌图片，就使用最后一张牌图片
                    selfPai = selfPai.childNodes[selfPai.childNodes.length -2];
                }
            }

            if(mortalPai.nextElementSibling.tagName.toLocaleLowerCase() == 'svg') { //如果有多张牌图片，就使用最后一张牌图片
                mortalPai = mortalPai.nextElementSibling;
            }

            const dataEle = entry[i].getElementsByTagName("tbody")[0].childNodes;

            var selfPaiData = 0;
            var mortalPaiData = 0;
            var selfBoxObj = JSON.parse(boxObjStr), mortalBoxObj = JSON.parse(boxObjStr);
            map.clear(); //清除map

            let j = 0, size = dataEle.length;
            while (j != size) {
                let selfPaiStr = null;
                let mortalPaiStr = null;

                let isResetLoop = false; //是否重置循坏

                if(selfPai != null){
                    if(Object.prototype.toString.call(selfPai) == '[object Text]') {
                        selfPaiStr = selfPai.data;
                    }else{
                        let obj = selfPai.getElementsByClassName("face");
                        if(obj[0] != null){
                            selfPaiStr = obj[0].href.baseVal;
                        }else{ //选择跳过的情况
                            selfPaiStr = selfPai.childNodes[selfPai.childNodes.length -1].data;
                        }
                    }
                }
                if(mortalPai != null){
                    if(Object.prototype.toString.call(mortalPai) == '[object Text]') {
                        mortalPaiStr = mortalPai.data;
                    }else{
                        let obj = mortalPai.getElementsByClassName("face");
                        if(obj[0] != null){
                            mortalPaiStr = obj[0].href.baseVal;
                        }else{ //选择跳过的情况
                            mortalPaiStr = mortalPai.childNodes[mortalPai.childNodes.length -1].data;
                        }
                    }
                }

                let data = dataEle[j].childNodes[2].innerHTML.replace(/<.*?>/g, ""); //过滤html标签, 只保留文字内容

                let obj1 = dataEle[j].childNodes[0].getElementsByClassName("face");
                let dataPaiStr;
                if(obj1[obj1.length - 1] != null) { // 如果有多张牌, 则选择最后一张牌作为对比牌 (主要用于吃的情况、碰杠这些牌都是一样的)
                    dataPaiStr = obj1[obj1.length - 1].href.baseVal;
                }else{
                    dataPaiStr = dataEle[j].childNodes[0].innerHTML;

                    if(map.has(j) == false) {
                        map.set(j, true); //保存当前j的值，防止重复开始循坏
                        j = 0; //如果 有 选择跳过的情况, 则重新开始循坏, 以找到正确的数据
                        isResetLoop = true;
                    }
                }

                if(selfPaiStr == dataPaiStr) { //如果目标操作是自己的操作

                    selfPaiData = data;

                    const span = document.createElement("span");
                    span.innerText = ` \u00A0\u00A0\u00A0` + data;
                    span.style.position = "absolute";

                    if(selfBoxObj.top == 0) {
                        if(!isNaN(selfPai.offsetTop)) {
                            selfBoxObj.top = (selfPai.offsetTop + selfPai.offsetHeight / 2 - 10);
                        }else if(!isNaN(selfPai.parentElement.offsetTop)) {
                            selfBoxObj.top = (selfPai.parentElement.offsetTop + selfPai.parentElement.offsetHeight / 2 - 10);
                        }else{
                            console.error("[dom struct inconsistency] source:", "selfPai");
                            console.info("[debug]", `i: ${i}`);
                        }
                        span.style.top = selfBoxObj.top + 2 + "px";
                    }
                    span.style.left = "170px";

                    entry[i].insertBefore(span, entry[i].childNodes[3].nextSibling);

                    selfPai = null; //置null, 防止继续计算
                }else if(mortalPaiStr == dataPaiStr) { //如果目标操作是Mortal的操作

                    mortalPaiData = data;

                    const span = document.createElement("span");
                    span.innerText = ` \u00A0\u00A0\u00A0` + data;
                    span.style.position = "absolute";

                    if(mortalBoxObj.top == 0) {
                        if(!isNaN(mortalPai.offsetTop)) {
                            mortalBoxObj.top = (mortalPai.offsetTop + mortalPai.offsetHeight / 2 - 10);
                        }else if(!isNaN(mortalPai.previousElementSibling.offsetTop)) {
                            mortalBoxObj.top = (mortalPai.previousElementSibling.offsetTop + mortalPai.previousElementSibling.offsetHeight / 2 - 10);
                        }else if(!isNaN(mortalPai.previousElementSibling.previousElementSibling.offsetTop)) {
                            mortalBoxObj.top = (mortalPai.previousElementSibling.previousElementSibling.offsetTop + mortalPai.previousElementSibling.previousElementSibling.offsetHeight / 2 - 10);
                        }else{
                            console.error("[dom struct inconsistency] source:", "mortalPai");
                            console.info("[debug]", `i: ${i}`);
                        }
                        span.style.top = mortalBoxObj.top + 1 + "px";
                    }
                    span.style.left = "170px";

                    if(Object.prototype.toString.call(mortalPai.nextSibling) == '[object Text]') { //如果有多张牌图片，就使用最后一张牌图片后面的文字的位置
                        mortalPai = mortalPai.nextSibling;
                    }

                    entry[i].insertBefore(span, mortalPai.nextSibling);

                    mortalPai = null; //置null, 防止继续计算
                }

                if(selfPaiStr == mortalPaiStr) { //如果自己选择打出的牌与mortal选择打出的牌相同
                    if(map.has(j) == false) {
                        map.set(j, true); //保存当前j的值，防止重复开始循坏
                        j = 0; //如果 有 选择跳过的情况, 则重新开始循坏, 以找到正确的数据
                        isResetLoop = true;
                    }
                }

                if(selfPai == null && mortalPai == null) { //是否处理完毕
                    break; //跳出循坏
                }
                if(isResetLoop == false){ //不重置循坏时, index++
                    ++j;
                }
            }//for

            /* 计算自己的选择与mortal选择的差值 */
            const defaultHandleFunc = (newNode, index, colorStr) => {
                newNode.style.color = colorStr; //设置为目标颜色
                newNode.innerHTML = ` \u00A0\u00A0\u00A0` + eval("i18nText.badMoveDiffer" + index) + differData;
            }

            const differData = roundFun(Math.abs(mortalPaiData - selfPaiData), 5); //保留5位小数
            if (differData != 0) { //忽略自己和mortal打出的牌一样的结果

                const turnInfo = entry[i].children[0];
                const newNode = document.createElement("span");
                newNode.style.fontWeight = 400;

                if (differData < 5) { //微差
                    defaultHandleFunc(newNode, 1, "#000"); //黑色
                }else if (differData < 10) { //小幅差距
                    defaultHandleFunc(newNode, 2, "#996633"); //褐色
                }else if (differData < 20) { //低等差距
                    defaultHandleFunc(newNode, 3, "#009966"); //淡绿
                }else if (differData < 40) { //中等差距
                    defaultHandleFunc(newNode, 4, "#3399FF"); //淡蓝
                }else if (differData < 60) { //高等差距
                    defaultHandleFunc(newNode, 5, "#3333CC"); //深蓝
                }else if (differData < 80) { //大幅度差距
                    defaultHandleFunc(newNode, 6, "#CC0099"); //淡红
                }else{ //压倒性差距
                    defaultHandleFunc(newNode, 7, "#f00"); //红色
                }
                turnInfo.appendChild(newNode);
            }

        }//for
    }else {
        document.getElementsByName("show-rating").forEach((ele)=>{ele.checked = true}); //默认勾选 显示Rating

        const map = new Map();
        let childEle = document.getElementById("mortal-model-tag").children;
        for (let i = 0; i < childEle.length; i++) {
            const ele = childEle[i];
            map.set(ele.value, ele.innerText); //将数据保存到map  
        }
        const jsonStr = JSON.stringify(Object.fromEntries(map));
        localStorage.setItem("Mortal_New", childEle[0].value); //牌谱解析页面，默认使用最新的Mortal
        localStorage.setItem("Mortal_Type", jsonStr);
    }
}
