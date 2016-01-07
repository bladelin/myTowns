define([
    'jquery',
    'underscore',
    'backbone',
    'views/util',
    'text!templates/stabilityBox.html',
    'text!templates/stabilityBasicTable.html',
    'text!templates/stabilitySummaryTable.html',
    'text!templates/stabilityBasicChart.html',
    'i18n!nls/msg',
], function( $, _, Backbone, Util, stabilityBoxTemplate, stabilityBasicTableTemplate, stabilitySummaryTableTemplate, stabilityBasicChartTemplate, Msg) {

    var SetStability = Backbone.View.extend({
        el: '.infoBox',
        template: _.template( stabilityBoxTemplate ),
        template_stabilityBasicTable: _.template( stabilityBasicTableTemplate ),
        template_stabilitySummaryTable: _.template( stabilitySummaryTableTemplate ),
        template_stabilityBasicChart: _.template( stabilityBasicChartTemplate ),
        initialize: function(data) {
            for (var key in data) {
                this[key] = data[key];
            }
            this.stabilitySummary = {};
            this.$el.append( this.template());
            this.stabilityBasicTable = this.$el.find(".stabilityBox .stabilityBasicTable");
            this.stabilitySummaryTable = this.$el.find(".stabilityBox .stabilitySummaryTable");
            this.stabilityChartArea = this.$el.find(".stabilityBox .stabilityChartArea");
            this.diffStabilityChartArea = this.$el.find(".stabilityBox .diffStabilityChartArea");



            this.meanSpeedFlat = "meanSpeedFlat";
            this.meanSpeedRaise = "meanSpeedRaise";
            this.meanSpeedDecline = "meanSpeedDecline";
            this.meanSpeedWeight = 0.5;
            this.stabilityWeight = 0.3;

            this.sccerateIndex = {
                "stability":{
                    meanSpeedDecline:-2,
                    meanSpeedFlat:+1,
                    meanSpeedRaise:+3,
                },
                "non-stability":{
                    meanSpeedDecline:-3,
                    meanSpeedFlat:-1,
                    meanSpeedRaise:+2,
                }
            };


            this.calStability();
            this.calStabilitySummary();
            this.setStabilityBasicData();
            this.setStabilitySummaryData();
            this.setStabilityChart();

            this.setStabilityDiffChart();

            this.drawControl.trigger("setLog","完成...");
        },
        calStability: function(){
            this.drawControl.trigger("setLog","計算穩定度中...");

            var meanSpeedWeight = this.meanSpeedWeight;
            var meanSpeedFlat = this.meanSpeedFlat;
            var meanSpeedRaise = this.meanSpeedRaise;
            var meanSpeedDecline = this.meanSpeedDecline;
            this.diffMeanSpeedLimitIndex = {"min":{value:99999999999,index:[]},"max":{value:0,index:[]}}
            this.meanSpeedLimitIndex = {"min":{value:99999999999,index:null},"max":{value:0,index:null}}

            this.meanSpeedTypeLineRange = {meanSpeedFlat:[],meanSpeedRaise:[],meanSpeedDecline:[]};


            var meanSpeedTempStorage = [];
            var lastMeanSpeedType = null;
            for( var i in this.stability) {
                i = parseInt(i);
                var data = $.parseJSON(JSON.stringify(this.stability[i].data));
                data = data.sort(function sortNumber(a,b){ return a - b});

                meanSpeed = Util.math.mean(data);
                stdDevSpeed = Util.math.stdDev(data);
                lastMeanSpeed = (typeof(this.stability[i-1])!="undefined")?this.stability[i-1].meanSpeed:0;

                this.stability[i].meanSpeed = Util.math.toFixed(meanSpeed,2);
                this.stability[i].stdDevSpeed = Util.math.toFixed(stdDevSpeed,2);
                this.stability[i].stability = Util.math.toFixed((stdDevSpeed / meanSpeed)*10,2);
                this.stability[i].diffMeanSpeed = Util.math.toFixed(meanSpeed - lastMeanSpeed,2);

                if (meanSpeed>this.meanSpeedLimitIndex.max.value) {
                    this.meanSpeedLimitIndex.max.index = (i+1);
                    this.meanSpeedLimitIndex.max.value = meanSpeed;
                }
                if (meanSpeed<this.meanSpeedLimitIndex.min.value) {
                    this.meanSpeedLimitIndex.min.index = (i+1);
                    this.meanSpeedLimitIndex.min.value = meanSpeed;
                }

                var diffVal = this.stability[i].diffMeanSpeed;
                if ( diffVal > meanSpeedWeight) {
                    if (i > 0) {
                        if (diffVal> this.diffMeanSpeedLimitIndex.max.value){
                            this.diffMeanSpeedLimitIndex.max.index = [i+1];
                            this.diffMeanSpeedLimitIndex.max.value = diffVal;
                        } else if (diffVal == this.diffMeanSpeedLimitIndex.max.value) {
                            this.diffMeanSpeedLimitIndex.max.index.push(i+1);
                        }
                    }
                    this.stability[i].currentMeanSpeedType = meanSpeedRaise;

                } else if ( diffVal < -1*meanSpeedWeight) {
                    if (i > 0 && i <this.stability.length-1) {
                        if (diffVal < this.diffMeanSpeedLimitIndex.min.value){
                            this.diffMeanSpeedLimitIndex.min.index = [i+1];
                            this.diffMeanSpeedLimitIndex.min.value = diffVal;
                        } else if (diffVal == this.diffMeanSpeedLimitIndex.max.value) {
                            this.diffMeanSpeedLimitIndex.max.index.push(i+1);
                        }
                    }
                    this.stability[i].currentMeanSpeedType = meanSpeedDecline;
                } else {
                    this.stability[i].currentMeanSpeedType = meanSpeedFlat;
                }



                Q1Index = (data.length * 0.25)-1;
                Q2Index = (data.length * 0.5)-1;
                Q3Index = (data.length * 0.75)-1;

                Q2 = 0;
                if (Q2Index%1 >0){
                    Q2 = data[Math.ceil(Q2Index)];
                } else {
                    Q2 = (data[Q2Index] + data[Q2Index+1])/2;
                }

                if (Q1Index%1 >0){
                    Q1 = data[Math.ceil(Q1Index)];
                } else {
                    Q1 = (data[Q1Index] + data[Q1Index+1])/2;
                }

                if (Q3Index%1 >0){
                    Q3 = data[Math.ceil(Q3Index)];
                } else {
                    Q3 = (data[Q3Index] + data[Q3Index+1])/2;
                }


                var minSpeed = Q2 -1.5*(Q3-Q1);
                var maxSpeed = Q2 +1.5*(Q3-Q1);

                if (minSpeed < data[0]) {
                    minSpeed = data[0];
                }

                if (maxSpeed > data[data.length-1]) {
                    maxSpeed = data[data.length-1];
                }

                this.stability[i].Q = {Q1:Q1,Q2:Q2,Q3:Q3};
                this.stability[i].minSpeed = Util.math.toFixed(minSpeed,2);
                this.stability[i].maxSpeed = Util.math.toFixed(maxSpeed,2);


                // this.meanSpeedLineRangeType
                currentMeanSpeedType = this.stability[i].currentMeanSpeedType;
                if (lastMeanSpeedType == null) {
                    lastMeanSpeedType = currentMeanSpeedType;
                }
                var pointClone = {
                    x: (i+1),
                    y: this.stability[i].meanSpeed,
                    meanSpeed: this.stability[i].meanSpeed,
                    maxSpeed: this.stability[i].maxSpeed,
                    minSpeed: this.stability[i].minSpeed,
                    stability: this.stability[i].stability,
                };

                var saveToData = false;
                if(i == this.stability.length-1) {
                    saveToData = true;
                    if (lastMeanSpeedType == currentMeanSpeedType) {
                        meanSpeedTempStorage.push(pointClone);
                    }
                } else if (lastMeanSpeedType != currentMeanSpeedType) {
                    saveToData = true;
                }
                if (saveToData) {
                    var meanSpeedTempStorageLen = meanSpeedTempStorage.length;
                    var tmpData = [];
                    for(var j=0; j<meanSpeedTempStorageLen; j++) {
                        tmpData.push(meanSpeedTempStorage[j]);
                    }
                    if (tmpData.length >1) {
                        this.meanSpeedTypeLineRange[lastMeanSpeedType].push(tmpData);
                    }


                    for(var j=0; j<meanSpeedTempStorageLen-1; j++) {
                        meanSpeedTempStorage.shift();
                    }

                    if (i == this.stability.length-1 &&  lastMeanSpeedType != currentMeanSpeedType){
                        meanSpeedTempStorage.push(pointClone);
                        var tmpData = [];
                        for(var j=0; j<meanSpeedTempStorage.length; j++) {
                            tmpData.push(meanSpeedTempStorage[j]);
                        }
                        this.meanSpeedTypeLineRange[currentMeanSpeedType].push(tmpData);
                    }

                    lastMeanSpeedType = currentMeanSpeedType;
                }
                meanSpeedTempStorage.push(pointClone);
            }


            this.stabilitySummary.diffMeanSpeedLimitIndex = this.diffMeanSpeedLimitIndex;
            this.stabilitySummary.meanSpeedLimitIndex = this.meanSpeedLimitIndex;
            this.stabilitySummary.meanSpeedTypeLineRange = this.meanSpeedTypeLineRange;

            var meanSpeedCheckIndexStorage = {};
            var meanSpeedLineRangeSeries = {meanSpeedFlat:[],meanSpeedRaise:[],meanSpeedDecline:[]};

            for( var type in this.stabilitySummary.meanSpeedTypeLineRange) {
                for( var i in this.stabilitySummary.meanSpeedTypeLineRange[ type ]) {
                    var borderbold = false;
                    var lineRangeData = $.parseJSON(JSON.stringify(this.stabilitySummary.meanSpeedTypeLineRange[ type ][i]));

                    var lineRangeDataTmp = [];
                    var lineRangeDataBorderTmp = [];
                    var checkedIndexI = null;
                    var lineRangeDataCount = 0;

                    for (var j in lineRangeData) {
                        if (j != 0) {
                            if (this.diffMeanSpeedLimitIndex.max.index.indexOf(lineRangeData[j].x)>=0  || this.diffMeanSpeedLimitIndex.min.index.indexOf(lineRangeData[j].x)>=0) {
                                var tmpStorage = [];
                                tmpStorage.push(lineRangeDataTmp[lineRangeDataCount][lineRangeDataTmp[lineRangeDataCount].length-1])
                                tmpStorage.push(lineRangeData[j]);
                                lineRangeDataBorderTmp.push(tmpStorage);

                                lineRangeDataCount ++;
                                lineRangeDataTmp[lineRangeDataCount] = [];
                            }
                        } else {
                            lineRangeDataTmp[lineRangeDataCount] = [];
                        }

                        lineRangeDataTmp[lineRangeDataCount].push(lineRangeData[j]);

                    }

                    for( var j in lineRangeDataTmp) {
                        if (lineRangeDataTmp[j].length>1) {
                            meanSpeedLineCount = meanSpeedLineRangeSeries[type].length;
                            for (k = lineRangeDataTmp[j][0].x;k<=lineRangeDataTmp[j][lineRangeDataTmp[j].length-1].x;k++){
                                if (typeof(meanSpeedCheckIndexStorage[ k]) == "undefined") {
                                    meanSpeedCheckIndexStorage[ k] = [];
                                }
                                meanSpeedCheckIndexStorage[ k].push([type,meanSpeedLineCount]);
                            }
                            meanSpeedLineRangeSeries[type].push({
                                type: type,
                                data: lineRangeDataTmp[j],
                                turboThreshold: lineRangeDataTmp[j].length,
                                lineWidth: 0,
                                id: meanSpeedLineCount
                            });
                        }
                    }

                    for( var j in lineRangeDataBorderTmp) {
                        if (lineRangeDataBorderTmp[j].length>1) {
                            meanSpeedLineCount = meanSpeedLineRangeSeries[type].length;
                            for (k = lineRangeDataBorderTmp[j][0].x;k<=lineRangeDataBorderTmp[j][lineRangeDataBorderTmp[j].length-1].x;k++){
                                if (typeof(meanSpeedCheckIndexStorage[ k]) == "undefined") {
                                    meanSpeedCheckIndexStorage[ k] = [];
                                }
                                meanSpeedCheckIndexStorage[ k].push([type,meanSpeedLineCount]);
                            }
                            meanSpeedLineRangeSeries[type].push({
                                type: type,
                                data: lineRangeDataBorderTmp[j],
                                turboThreshold: lineRangeDataBorderTmp[j].length,
                                lineWidth: 1,
                                id: meanSpeedLineCount
                            });
                        }
                    }

                }
            }

            this.meanSpeedLineRangeSeries = meanSpeedLineRangeSeries;
            this.meanSpeedCheckIndexStorage = meanSpeedCheckIndexStorage;



            this.drawControl.trigger("setLog","計算穩定完成...");

        },
        calStabilitySummary: function(){
            this.stabilitySummary.limitSpeedIndex = {max:[],min:[]} // K線最快速度與最慢速度的 index
            this.stabilitySummary.avgStability = null;
            this.stabilitySummary.stabilityIndex = null;
            this.stabilitySummary.minStability = null;
            this.stabilitySummary.minStabilityIndex = null;
            this.stabilitySummary.bestStabilityPeriod = [];

            var cloneStaiblity = $.parseJSON(JSON.stringify(this.stability));
            var getLimitSpeedLength = Math.ceil(cloneStaiblity.length * 0.15);


            // K 線最快速度
            cloneStaiblity = cloneStaiblity.sort(function(a,b){
                if (a.meanSpeed < b.meanSpeed) {
                    return 1;
                } else if (a.meanSpeed > b.meanSpeed) {
                    return -1;
                }
                return 0;
            });

            for ( var i = 0 ; i<getLimitSpeedLength ;i++) {
                this.stabilitySummary.limitSpeedIndex.max.push({index:parseInt(cloneStaiblity[i].index)+1,meanSpeed:cloneStaiblity[i].meanSpeed});
            }

            for ( var i = cloneStaiblity.length -1 ; i>=cloneStaiblity.length -getLimitSpeedLength ;i--) {
                this.stabilitySummary.limitSpeedIndex.min.push({index:parseInt(cloneStaiblity[i].index)+1,meanSpeed:cloneStaiblity[i].meanSpeed});
            }

            cloneStaiblity = cloneStaiblity.sort(function(a,b){
                if (a.stability > b.stability) {
                    return 1;
                } else if (a.stability < b.stability) {
                    return -1;
                }
                return 0;
            });
            this.stabilitySummary.minStability = cloneStaiblity[0].stability;
            this.stabilitySummary.minStabilityIndex = parseInt(cloneStaiblity[0].index)+1;


            stabilityStorage = [];
            StabilityIndexCount = 0;
            StabilityPeriodTimer = 0;

            for (var i in this.stability) {
                i = parseInt(i);
                stabilityStorage.push(this.stability[i].stability);
                if (this.stability[i].stability<1.5) {
                    StabilityIndexCount ++;
                }
                needSave = false;
                startPeriod = 0;
                if (Math.abs(this.stability[i].stability - this.stabilitySummary.minStability) < this.stabilityWeight) {
                    StabilityPeriodTimer++;
                    if ( i  == this.stability.length-1 && StabilityPeriodTimer >=2) {
                        needSave = true;
                        startPeriod = StabilityPeriodTimer;
                    }
                } else {
                    if (StabilityPeriodTimer >=2) {
                        needSave = true;
                        startPeriod = StabilityPeriodTimer;
                     }
                    StabilityPeriodTimer = 0;
                }
                if (needSave) {
                    this.stabilitySummary.bestStabilityPeriod.push([ i - startPeriod , i]);
                }

                var meanSpeedLevel = "";
                var stabilityLevel = "";
                if (this.stability[i].stability <= 1) {
                    this.stability[i].stabilityFlag  = "stability";
                } else {
                    this.stability[i].stabilityFlag  = "non-stability";
                }


                if (this.stability[i].diffMeanSpeed >= this.meanSpeedWeight) {
                    meanSpeedLevel = this.meanSpeedRaise;
                } else if ( this.stability[i].diffMeanSpeed < this.meanSpeedWeight && this.stability[i].diffMeanSpeed> this.meanSpeedWeight*-1) {
                    meanSpeedLevel = this.meanSpeedFlat;
                } else {
                    meanSpeedLevel = this.meanSpeedDecline;
                }


                this.stability[i].sccerateIndex = this.sccerateIndex[this.stability[i].stabilityFlag][meanSpeedLevel];
            }


            this.stabilitySummary.avgStability = Util.math.mean(stabilityStorage);
            this.stabilitySummary.avgStabilityLevel = Util.formatStabilityLevel(this.stabilitySummary.avgStability);
            this.stabilitySummary.stabilityIndex = StabilityIndexCount / this.stability.length;

            // cal sccerate
            var sccerateStorage = [];
            for ( i=1; i<this.stability.length;i++) {
                sccerateStorage.push(this.stability[i].sccerateIndex);
            }

            this.stabilitySummary.avgSccerateIndex = Util.math.mean(sccerateStorage);


        },
        setStabilityBasicData: function(){
            this.drawControl.trigger("setLog","建立穩定度表格...");
            this.stabilityBasicTable.append(this.template_stabilityBasicTable({
                                                        Util:Util,
                                                        stability:this.stability
                                                    }));
        },
        setStabilitySummaryData: function(){

            var continueDiffMeanSpeed = {};
            var speedTypeStorage = [this.meanSpeedRaise,this.meanSpeedDecline];
            for( var k in speedTypeStorage) {
                var speedType = speedTypeStorage[k];
                continueDiffMeanSpeed[speedType] = [];
                for(var i in this.meanSpeedLineRangeSeries[speedType]) {
                    if (this.meanSpeedLineRangeSeries[speedType][i].data.length>2) {

                        var tmp = {};
                        var fromIndex = this.meanSpeedLineRangeSeries[speedType][i].data[0].x;
                        var toIndex = this.meanSpeedLineRangeSeries[speedType][i].data[ this.meanSpeedLineRangeSeries[speedType][i].data.length-1 ].x;
                        tmp.from = fromIndex;
                        tmp.to = toIndex;
                        tmp.value = Util.formatRound(this.stability[toIndex-1].meanSpeed - this.stability[fromIndex-1].meanSpeed ,2);
                        continueDiffMeanSpeed[speedType].push(tmp);
                    }
                }
            }

            this.drawControl.trigger("setLog","建立穩定度分析表格...");
            this.stabilitySummaryTable.append(this.template_stabilitySummaryTable({
                                                        Util:Util,
                                                        stabilitySummary:this.stabilitySummary,
                                                        // diffMeanSpeedLimitInfo:diffMeanSpeedLimitInfo,
                                                        continueDiffMeanSpeed: continueDiffMeanSpeed,
                                                    }));

        },
        setStabilityChart: function(){
            this.drawControl.trigger("setLog","繪製穩定度圖表...");
            var that = this;
            this.stabilityChartArea.append(this.template_stabilityBasicChart());
            this.stabilityBasicChartContainer = this.$el.find('#stabilityBasicChart-container');
            var meanSpeedFlat = this.meanSpeedFlat;
            var meanSpeedRaise = this.meanSpeedRaise;
            var meanSpeedDecline = this.meanSpeedDecline;
            var meanSpeedWeight = this.meanSpeedWeight;
            var chartType = {
                    "meanSpeed":[],
                    "rangSpeed":{
                        color: 'rgb(216,233,249,1)'
                    },
                    "stability":[]
                };
            var data = {"meanSpeed":[],"rangSpeed":[],"stability":[]};

            var series = [];
            var lastStabilityType = null;
            var stabilityTempStorage = [];
            var lastMeanSpeedType = null;
            var meanSpeedTempStorage = [];

            for (var i in this.stability) {
                var meanSpeedType = meanSpeedFlat;
                i = parseInt(i);;
                var point = {
                    x: (i+1),
                    y: 0,
                    meanSpeed: this.stability[i].meanSpeed,
                    maxSpeed: this.stability[i].maxSpeed,
                    minSpeed: this.stability[i].minSpeed,
                    stability: this.stability[i].stability,
                };
                for( var type in chartType) {
                    switch (type) {
                        case "rangSpeed":
                            data[type].push([point.x,point.minSpeed,point.maxSpeed]);
                            break;
                        case "stability":
                            var val = this.stability[i][type];
                            var currentStabilityType = null;
                            currentStabilityType = Util.formatStabilityLevel(val);
                            this.stability[i].stabilityLevel = currentStabilityType;

                            if (lastStabilityType == null) {
                                lastStabilityType = currentStabilityType;
                            }

                            var pointClone = $.extend({},point);
                            pointClone.y = val;

                            var saveToData = false;
                            if (i == this.stability.length-1) {
                                saveToData = true;
                                stabilityTempStorage.push(pointClone);
                            } else if (lastStabilityType != currentStabilityType) {
                                saveToData = true;
                            }

                            if (saveToData) {
                                data[type].push({
                                    type: lastStabilityType,
                                    data: []
                                });

                                var stabilityTempStorageLen = stabilityTempStorage.length;
                                for( var j = 0; j<stabilityTempStorageLen; j++){
                                    data[type][data[type].length-1].data.push(stabilityTempStorage[j]);
                                }
                                for( var j = 0; j<stabilityTempStorageLen-1; j++){
                                    stabilityTempStorage.shift();
                                }
                                lastStabilityType = currentStabilityType;
                            }
                            stabilityTempStorage.push(pointClone);
                            break;
                    }

                }
            }

            // 最高速與最低速區間
            series.push({
                    name: 'Speed Range',
                    data: data["rangSpeed"],
                    type: 'arearange',
                    lineWidth: 0,
                    color: 'rgba(150, 196, 239,1)',
                    fillOpacity: 0.3,
                    zIndex: 0
                });

            //  平均速度
            var meanSpeedColor = {
                meanSpeedFlat: 'rgba(68,20,20,0.7)',
                meanSpeedRaise:'rgba(229,69,69,0.7)',
                meanSpeedDecline:'rgba(69,229,69,0.7)',
            }

            var meanSpeedLineRangeSeries = this.meanSpeedLineRangeSeries;
            for (var type in meanSpeedLineRangeSeries) {
                var lineData = meanSpeedLineRangeSeries[type];
                for(var i in lineData) {
                    var lineWidth = 2;
                    if (lineData[i].lineWidth == 1) {
                        lineWidth = 5;
                    }
                    series.push( {
                        type: 'line',
                        meanSpeedtype: lineData[i].type,
                        data: lineData[i].data,
                        color: meanSpeedColor[lineData[i].type],
                        name : series.length,
                        turboThreshold: lineData[i].data.length,
                        lineWidth: lineWidth,
                        marker:{
                            enabled: false,
                            symbol: "circle"
                        },
                        id: "meanSpeed_"+type+"_"+lineData[i].id,
                    });
                }
            }

            // 最大速度 與 最慢速度
            meanSpeedLimitIndex = this.meanSpeedLimitIndex;
            for( var type in meanSpeedLimitIndex) {
                var title = "";
                switch (type) {
                    case "max":
                        title = "最快速度";
                        break;
                    case "min":
                        title = "最慢速度";
                        break;
                }

                indexType = this.meanSpeedCheckIndexStorage[meanSpeedLimitIndex[type].index][this.meanSpeedCheckIndexStorage[meanSpeedLimitIndex[type].index].length-1];
                series.push( {
                    type: 'flags',
                    data: [{
                        x: meanSpeedLimitIndex[type].index,
                        title: title,
                        text: title
                    }],
                    onSeries: "meanSpeed_"+indexType[0]+"_"+indexType[1]
                });

            }

            //  穩定度
            var stabilityColor = {
                                 "I":"rgba(0,176,80,0.3)",
                                "II":"rgba(255,255,0,0.3)",
                               "III":"rgba(255,192,0,0.3)",
                                "IV":"rgba(218,150,148,0.3)",
                                 "V":"rgba(255,77,77,0.3)"
                             }
            for (var i in data["stability"]) {
                series.push({
                    type: 'area',
                    stabilityType: data["stability"][i].type,
                    data: data["stability"][i].data,
                    color: stabilityColor[data["stability"][i].type],
                    name : series.length,
                    turboThreshold: data["stability"][i].data.length,
                    marker:{
                        enabled: false,
                        symbol: "circle",
                    }
                });
            }

            // K 線最快速度 多個
            var limitKPoint = [];
            for(var i in this.stabilitySummary.limitSpeedIndex.max) {
                limitKPoint.push([this.stabilitySummary.limitSpeedIndex.max[i].index,this.stabilitySummary.limitSpeedIndex.max[i].meanSpeed]);
            }
            series.push( {
                type: 'scatter',
                data: limitKPoint,
                color: "rgba(255,0,0,1)",
                name : "limitKPointMax",
                turboThreshold: limitKPoint.length,
                id: "limitKPointMax",
                marker: {
                    fillColor: "rgba(255,0,0,1)",
                    symbol: "circle",
                    enabled: true
                }
            });

            // K 線最慢速度 多個
            var limitKPoint = [];
            for(var i in this.stabilitySummary.limitSpeedIndex.min) {
                limitKPoint.push([this.stabilitySummary.limitSpeedIndex.min[i].index,this.stabilitySummary.limitSpeedIndex.min[i].meanSpeed]);
            }
            series.push( {
                type: 'scatter',
                data: limitKPoint,
                color: "rgba(0,255,0,1)",
                name : "limitKPointMin",
                turboThreshold: limitKPoint.length,
                id: "limitKPointMin",
                marker: {
                    fillColor: "rgba(0,255,0,1)",
                    symbol: "circle",
                    enabled: true
                }
            });


            series.push( {
                type: 'line',
                data: [{x:0,y:0}],
                color: "rgba(0,176,80,0)",
                name : "zero",
                turboThreshold: 1,
                id: "zero",
            });


            var stabilityOptions = {
                chart:{
                    'spacingRight': 30,
                },
                title: {
                    text: null
                },
                series: series,
                xAxis: {
                    offset: 1,
                    showLastLabel: true,
                    allowDecimals: false,
                    crosshair: true,
                },
                yAxis: {
                    title:{text:null}
                },
                legend: {
                   enabled: false
                },
                plotOptions: {

                },
                tooltip: {
                    'formatter': function() {
                        var x = parseInt(this.point.x);
                        var title = [];
                        title.push("<b>"+x+"km</b>");
                        title.push("平均速度："+that.stability[x-1].meanSpeed);
                        title.push("最大速度："+that.stability[x-1].maxSpeed);
                        title.push("最慢速度："+that.stability[x-1].minSpeed);
                        title.push("穩定度："+that.stability[x-1].stability);
                        return title.join("<br>");
                    }
                },
                credits: {
                    enabled: false
                }
            };
            this.stabilityBasicChartContainer.highcharts(stabilityOptions);
        },
        setStabilityDiffChart: function(){
            var diffStability = {"-":[],"+":[]};
            for (var i =1; i< this.stability.length; i++) {
                var diff = this.stability[i].stability - this.stability[i-1].stability
                if (diff>0){
                    diffStability["-"].push(0);
                    diffStability["+"].push(diff);
                } else {
                    diffStability["+"].push(0);
                    diffStability["-"].push(diff);
                }
            }

            var diffstabilityOptions = {
                chart:{
                    'spacingRight': 30,
                },
                title: {
                    text: null
                },
                series: [{
                    type: "bar",
                    name: '-',
                    data: diffStability["-"]
                }, {
                    type: "bar",
                    name: '+',
                    data: diffStability["+"]
                }],
                xAxis: {
                    // offset: 1,
                    // showLastLabel: true,
                    // allowDecimals: false,
                    // crosshair: true,
                },
                yAxis: {
                    title:{text:null}
                },
                legend: {
                   enabled: false
                },
                plotOptions: {

                },
                credits: {
                    enabled: false
                }
            }

            this.diffStabilityChartArea.highcharts(diffstabilityOptions);
        },
        clearBox: function(){
            this.$el.find(".stabilityBox").remove();
        }
    });
    return SetStability;
});
