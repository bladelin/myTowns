define([
    'jquery',
    'underscore',
    'backbone',
    'views/drawChart',
    'views/setSummary',
    'views/setStability',
    'text!templates/info.html'
], function( $, _, Backbone,DrawChart,SetSummary, SetStability,InfoTemplate) {
    var SlopeCalculate = Backbone.View.extend({
        el: 'body',
        template: _.template( InfoTemplate ),
        initialize: function(data) {
            this.model = data.model;
            this.drawControl = data.drawControl;
            this.series = null;
            this.drawChart = null;
            this.SetSummary  = null;
            this.SetStability = null;
            this.$el.find(".infoBox").remove();
            this.listenTo( this.drawControl, "reCal", this.reCal);
            this.listenTo( this.drawControl, "reCalSummary", this.reCalSummary);
        },
        reCal: function(){
            var that = this;
            that.drawControl.trigger("setLog","計算中....");

            if (this.drawChart != null) {
                this.$el.find(".infoBox").remove();
            }

            var triggerTime = $.now();
            this.drawControlData = this.drawControl.toJSON();
            this.drawControlData.changeTimeWeight = parseInt(this.drawControlData.changeTimeWeight);
            this.drawControlData.detectRang = parseInt(this.drawControlData.detectRang);
            this.drawControlData.elevationWeight = parseFloat(this.drawControlData.elevationWeight);
            this.drawControlData.userWeight = parseFloat(this.drawControlData.userWeight);
            this.drawControlData.optimization = this.drawControlData.optimization==="1"?true:false;
            this.drawControlData.mergeSameArea = this.drawControlData.mergeSameArea==="1"?true:false;

            this.terrainRise = "terrainRise";
            this.terrainFlat = "terrainFlat";
            this.terrainDecline = "terrainDecline";
            this.terrain = {};
            this.terrain[this.terrainRise] = this.terrainRise;
            this.terrain[this.terrainFlat] = this.terrainFlat;
            this.terrain[this.terrainDecline] = this.terrainDecline;
            this.detailRang = [this.drawControlData.elevationWeight,this.drawControlData.elevationWeight+0.02,0.08,0.12,0.20];

            var  defaultChangeTime = {};
            for (type in this.terrain) {
                 defaultChangeTime[type] = 0;
            }

            var gpsData = this.model.get("gpsData");
            var data = [];
            var seriesStorage = [];
            var series = [];
            var lastSlopeStatus = null;
            var currentSlopeStatus = null;
            var slopeStatusChange = false;
            var relIndex = 0;
            var changeTime = $.parseJSON(JSON.stringify(defaultChangeTime));
            var limitElevation = {min:null,max:0};
            var realAccumulatedDistance = 0;

            for( var i in gpsData){
                i = parseInt(i);
                if (gpsData[i].elevation == 0 && typeof(gpsData[i-1])!="undefined") {
                    gpsData[i].elevation = gpsData[i-1].elevation;
                }

                relIndex = i - this.drawControlData.detectRang;
                if (typeof(gpsData[relIndex]) == "undefined") {
                    relIndex = 0;
                }

                var diffDistance = 0; //這gps點的移動距離
                var diffElevation = 0; //這gps點的移動高
                var diffDuration = 0; //這gps點的移動時間
                var work = 0 // 這個點所花的功 焦耳 = （高/底）* 體重 * 斜邊
                if (typeof(gpsData[i-1]) != "undefined" ) {
                    diffDistance = gpsData[i].accumulatedDistance - gpsData[i-1].accumulatedDistance;
                    diffDuration = gpsData[i].accumulatedDuration - gpsData[i-1].accumulatedDuration;
                    diffElevation = gpsData[i].elevation - gpsData[i-1].elevation;


                    if (diffDistance >0) {
                        work = (diffElevation/diffDistance) * this.drawControlData.userWeight * Math.sqrt(Math.pow(diffElevation,2) + Math.pow(diffDistance,2));
                    }

                    var diffRealDistance = 0;
                    if (diffDistance>0) {
                        diffRealDistance = Math.sqrt(Math.pow(diffElevation,2) + Math.pow(diffDistance,2));
                    }

                    realAccumulatedDistance = realAccumulatedDistance + diffRealDistance;
                }

                slopeStatusChange = false
                slope = 0;
                var diffRelIndexElevation = (gpsData[i].elevation - gpsData[relIndex].elevation);
                var diffAccumulatedDistance = (gpsData[i].accumulatedDistance - gpsData[relIndex].accumulatedDistance);
                if (diffAccumulatedDistance!==0){
                    // console.log("diffRelIndexElevation",diffRelIndexElevation,"diffAccumulatedDistance",diffAccumulatedDistance);
                    //slope = diffRelIndexElevation / diffAccumulatedDistance ; // 這是標準坡度
                    slope = diffRelIndexElevation / Math.sqrt(Math.pow(diffRelIndexElevation,2) + Math.pow(diffAccumulatedDistance,2));
                }


                // console.log(slope);
                currentSlopeStatus = this.terrain.terrainRise;
                if ( slope>(-1*this.drawControlData.elevationWeight)  && slope< this.drawControlData.elevationWeight) {
                    currentSlopeStatus = this.terrainFlat;
                } else if (slope >= this.drawControlData.elevationWeight) {
                    currentSlopeStatus = this.terrainRise;
                } else if (slope <= (-1*this.drawControlData.elevationWeight)) {
                    currentSlopeStatus = this.terrainDecline;
                }


                if (limitElevation.min == null) {
                    limitElevation.min = gpsData[i].elevation;
                }
                limitElevation.min = Math.min(limitElevation.min,gpsData[i].elevation);
                limitElevation.max = Math.max(limitElevation.max,gpsData[i].elevation);


                // console.log("i",i,"distance",gpsData[i].accumulatedDistance,"currentSlopeStatus",currentSlopeStatus,"lastSlopeStatus",lastSlopeStatus);

                // 檢查 slope 值

                if (lastSlopeStatus == null) {
                    lastSlopeStatus = currentSlopeStatus;
                    // console.log("lastSlopeStatus is null",lastSlopeStatus);
                } else if (currentSlopeStatus == lastSlopeStatus) {
                    changeTime[currentSlopeStatus] = changeTime[currentSlopeStatus] + 1;
                    if ( changeTime[currentSlopeStatus] >= this.drawControlData.changeTimeWeight/2 ){
                        changeTime = $.parseJSON(JSON.stringify(defaultChangeTime));
                    }
                } else if (currentSlopeStatus != lastSlopeStatus) {
                    changeTime[currentSlopeStatus] = changeTime[currentSlopeStatus]+1;
                    changeTime[lastSlopeStatus] = (changeTime[lastSlopeStatus]-1<0)?0:changeTime[lastSlopeStatus]-1;

                    if ( changeTime[currentSlopeStatus] >= this.drawControlData.changeTimeWeight ){
                        slopeStatusChange = true;
                    }
                }

                data[ data.length ]={
                    slope: slope,
                    diffDistance: diffDistance,
                    diffDuration: diffDuration,
                    diffRelIndexElevation: diffRelIndexElevation,
                    speed: gpsData[i].speed,
                    accumulatedDuration: gpsData[i].accumulatedDuration,
                    work: work,
                    realAccumulatedDistance: realAccumulatedDistance,
                    x: gpsData[i].accumulatedDistance,
                    y: gpsData[i].elevation,

                    name: "Point3",
                    color: "#CC99CC"
                };

                if (i == gpsData.length -1) {
                    slopeStatusChange = true;
                }

                if (slopeStatusChange) {
                    var tmpData = [];
                    var conut = data.length  ;
                    if (i != gpsData.length -1) {
                        for (var type in changeTime) {
                            if (type != lastSlopeStatus) {
                                conut = conut - changeTime[type];
                            }
                        }
                    }

                    for( var t = 0 ;t< conut;t++) {
                        tmpData.push(data[0]);
                        if (t < conut-1){
                            data.shift();
                        }
                    }

                    seriesStorage[seriesStorage.length] = {
                        type: lastSlopeStatus,
                        data: tmpData,
                    };

                    if (this.drawControlData.optimization) {
                        if (typeof(seriesStorage[seriesStorage.length-3]) != "undefined") {
                            if (seriesStorage[seriesStorage.length-3].type == lastSlopeStatus){
                                var canMerge = false;
                                if (seriesStorage[seriesStorage.length-2].type == this.terrainFlat) {
                                    canMerge = true;
                                }
                                else if(seriesStorage[seriesStorage.length-2].data.length < this.drawControlData.changeTimeWeight){
                                    canMerge = true;
                                }

                                if (canMerge) {
                                    if (this.drawControlData.mergeSameArea) {
                                        var orgLangth = seriesStorage.length;
                                        for (var j = orgLangth - 2; j < orgLangth;j++) {
                                            seriesStorage[j].data.shift();
                                            seriesStorage[seriesStorage.length-3].data = $.merge( $.merge( [], seriesStorage[seriesStorage.length-3].data ), seriesStorage[j].data );
                                        }
                                        for (var j = orgLangth - 2; j<orgLangth;j++) {
                                            seriesStorage.pop();
                                        }
                                    } else {
                                        seriesStorage[seriesStorage.length-2].type = lastSlopeStatus;
                                    }
                                }
                            }
                        }
                    }


                    lastSlopeStatus = currentSlopeStatus;
                    changeTime = $.parseJSON(JSON.stringify(defaultChangeTime));

                }
            }

            for ( var i in seriesStorage) {
                var color = "";
                var symbol = "";
                var markerFillColor = null;
                switch (seriesStorage[i].type){
                    case this.terrainRise:
                        color = 'rgba(200,100,100,1)';
                        symbol = "triangle";
                        markerFillColor = 'rgba(200,100,100,1)';
                        break;
                    case this.terrainDecline:
                        color = 'rgba(100,100,200,1)';
                        symbol = "triangle-down";
                        break;
                    default :
                        color = 'rgba(100,200,100,1)';
                        symbol = "square";
                        break;
                }
                series[series.length] = {
                    type: 'area',
                    slopeType: seriesStorage[i].type,
                    data: seriesStorage[i].data,
                    color: color,
                    name : series.length,
                    turboThreshold: seriesStorage[i].data.length,
                    marker:{
                        fillColor: markerFillColor,
                        symbol:symbol
                    }
                };
                // var terrainType = seriesStorage[i].type;
                // for( var j in seriesStorage[i].data) {
                //     if (typeof(seriesStorage[i].data[j]) != "undefined") {
                //         var slope = seriesStorage[i].data[j].slope;
                //         switch (terrainType) {
                //             case this.terrainRise:
                //                 slope = (slope < this.drawControlData.elevationWeight)?this.drawControlData.elevationWeight:slope;
                //                 for (var key = summary.statistics.detail[this.terrainRise].length-1;key>=0;key--) {
                //                     if (slope >= summary.statistics.detail[this.terrainRise][key].rang){
                //                         //console.log(slope, summary.statistics.detail[terrainRise][key].rang);
                //                         summary.statistics.detail[this.terrainRise][key].amount += 1;
                //                         summary.statistics.detail[this.terrainRise][key].slope += slope;
                //                         break;
                //                     }
                //                 }
                //                 break;
                //             case this.terrainDecline:
                //                 slope = (slope > -1*this.drawControlData.elevationWeight)? -1*this.drawControlData.elevationWeight:slope;
                //                 for (var key = summary.statistics.detail[this.terrainDecline].length-1;key>=0;key--) {
                //                     if (slope <= summary.statistics.detail[this.terrainDecline][key].rang){
                //                         //console.log(slope, summary.statistics.detail[terrainDecline][key].rang);
                //                         summary.statistics.detail[this.terrainDecline][key].amount += 1;
                //                         summary.statistics.detail[this.terrainDecline][key].slope += slope;
                //                         break;
                //                     }
                //                 }
                //                 break;
                //         }
                //         summary.statistics.summary[seriesStorage[i].type].totleDistance =
                //             summary.statistics.summary[seriesStorage[i].type].totleDistance + seriesStorage[i].data[j].diffDistance;
                //         summary.statistics.summary[seriesStorage[i].type].totleDuration =
                //             summary.statistics.summary[seriesStorage[i].type].totleDuration + seriesStorage[i].data[j].diffDuration;
                //     }
                // }
            }
            // console.log(summary);

            this.series = series;

            this.infoBox = $(this.template());
            this.infoBox.addClass("infoBox")
            this.$el.append( this.infoBox);

            this.drawChart = new DrawChart({
                                drawControl:this.drawControl,
                                title:this.model.get("title"),
                                series:series,
                                limitElevation:limitElevation,
                                terrain: this.terrain,
                                terrainRise:this.terrainRise,
                                terrainFlat:this.terrainFlat,
                                terrainDecline:this.terrainDecline,
                            });

        },
        reCalSummary: function(data) {
            var that = this;
            that.drawControl.trigger("setLog","計算表格中....");

            if (this.SetSummary != null) {
                this.SetSummary.clearBox();
                this.SetSummary = null;
            }

            if (this.SetStability != null) {
                this.SetStability.clearBox();
                this.SetStability = null;
            }


            minX = data.minX;
            maxX = data.maxX;

            if (minX < this.series[0].data[0].x) {
                minX = this.series[0].data[0].x;
            }
            if (maxX > this.series[this.series.length-1].data[ this.series[this.series.length-1].data.length-1].x) {
                maxX = this.series[this.series.length-1].data[ this.series[this.series.length-1].data.length-1].x;
            }

            var defaultStatisticsSummaryData = {totleDistance:0,totleDuration:0};
            var defaultStatisticsDetailData = {amount:0,slope:0.0};
            var defaultStability = {'data':[],'index':null}

            var summary = {
                totleDistance: 0,
                totleRealDistance: 0,
                totleTime: 0,
                moveTime:0,
                restTime:0,
                maxElevation: 0,
                minElevation: null,
                accumulatedRiseElevation: 0,
                accumulatedDeclineElevation: 0,
                slopeRatingValue:null,
                statistics: {
                    summary: {

                    },
                    detail: {

                    },
                    work: {

                    }
                },
            };
            var stability = [];

            for (var type in this.terrain ) {
                summary.statistics.summary[type] = $.parseJSON(JSON.stringify(defaultStatisticsSummaryData));
                summary.statistics.work[type] = 0;
                switch (type) {
                    case this.terrainRise:
                        summary.statistics.detail[type] =[];
                        for(var i in this.detailRang) {
                            summary.statistics.detail[type][summary.statistics.detail[type].length] = $.extend( {rang:this.detailRang[i]}, $.parseJSON(JSON.stringify(defaultStatisticsDetailData)));
                        }
                    break;
                    case this.terrainDecline:
                        summary.statistics.detail[type] =[];
                        for(var i in this.detailRang) {
                            summary.statistics.detail[type][summary.statistics.detail[type].length] = $.extend( {rang:-1*this.detailRang[i]}, $.parseJSON(JSON.stringify(defaultStatisticsDetailData)));
                        }
                    break;
                }
            }

            count = 0;

            var startAndEndTime = [null,0];
            var startAndEndDistance = [null,0];
            var startAndEndRealDistance = [null,0];
            for (var i = 0 ;i<this.series.length; i++) {
                var slopeType = this.series[i].slopeType;

                for (var j = 0; j<this.series[i].data.length-1; j++) {
                    if ( this.series[i].data[j].x < minX) {
                        continue;
                    }

                    var stabilityKIndex = Math.floor((this.series[i].data[j].x - minX)/1000);
                    if (typeof(stability[stabilityKIndex])=="undefined") {
                        stability[stabilityKIndex] = $.parseJSON(JSON.stringify(defaultStability));
                        stability[stabilityKIndex].index = stabilityKIndex;
                    }
                    if (this.series[i].data[j].speed>0){
                        stability[stabilityKIndex].data[stability[stabilityKIndex].data.length] = parseFloat(this.series[i].data[j].speed);
                    }

                    // set MoveTime and RestTime
                    if (this.series[i].data[j].speed >= 3) {
                        summary.moveTime += this.series[i].data[j].diffDuration;
                    }

                    // set Start and End  Time and disatnce
                    if (startAndEndTime[0] == null) {
                        startAndEndTime[0] = this.series[i].data[j].accumulatedDuration;
                    }
                    startAndEndTime[1] = this.series[i].data[j].accumulatedDuration;

                    if (startAndEndDistance[0] == null) {
                        startAndEndDistance[0] = this.series[i].data[j].x;
                    }
                    startAndEndDistance[1] = this.series[i].data[j].x;

                    if (startAndEndRealDistance[0] == null) {
                        startAndEndRealDistance[0] = this.series[i].data[j].realAccumulatedDistance;
                    }
                    startAndEndRealDistance[1] = this.series[i].data[j].realAccumulatedDistance;


                    // 1.Set Min and Max eleveation
                    if (summary.minElevation == null) {
                        summary.minElevation = this.series[i].data[j].y;
                    } else {
                        summary.minElevation = Math.min(summary.minElevation, this.series[i].data[j].y);
                    }
                    summary.maxElevation = Math.max(summary.maxElevation, this.series[i].data[j].y);

                    // 2.reCal statistics detail and summary
                    var slope = this.series[i].data[j].slope;
                    var work = 0;
                    switch (slopeType) {
                        case this.terrainRise:
                            summary.accumulatedRiseElevation += this.series[i].data[j].diffRelIndexElevation;
                            slope = (slope < this.drawControlData.elevationWeight)?this.drawControlData.elevationWeight:slope;
                            for (var key = summary.statistics.detail[slopeType].length-1;key>=0;key--) {
                                if (slope >= summary.statistics.detail[slopeType][key].rang){
                                    summary.statistics.detail[slopeType][key].amount += 1;
                                    summary.statistics.detail[slopeType][key].slope += slope;
                                }
                            }
                            work = (this.series[i].data[j].work>0)?this.series[i].data[j].work:0;
                            break;
                        case this.terrainDecline:
                            summary.accumulatedDeclineElevation += this.series[i].data[j].diffRelIndexElevation;
                            slope = (slope > -1*this.drawControlData.elevationWeight)? -1*this.drawControlData.elevationWeight:slope;
                            for (var key = summary.statistics.detail[slopeType].length-1;key>=0;key--) {
                                if (slope <= summary.statistics.detail[slopeType][key].rang){
                                    summary.statistics.detail[slopeType][key].amount += 1;
                                    summary.statistics.detail[slopeType][key].slope += slope;
                                    break;
                                }
                            }
                            work = (this.series[i].data[j].work<0)?this.series[i].data[j].work:0;
                            break;
                    }

                    summary.statistics.work[slopeType] += work;

                    summary.statistics.summary[slopeType].totleDistance =
                        summary.statistics.summary[slopeType].totleDistance + this.series[i].data[j].diffDistance;
                    summary.statistics.summary[slopeType].totleDuration =
                        summary.statistics.summary[slopeType].totleDuration + this.series[i].data[j].diffDuration;

                    count ++;
                    if ( this.series[i].data[j].x > maxX) {
                        break;
                    }
                }
                if ( this.series[i].data[this.series[i].data.length-1].x > maxX) {
                    break;
                }
            }

            summary.totleRealDistance = startAndEndRealDistance[1] - startAndEndRealDistance[0];
            summary.totleDistance = startAndEndDistance[1] - startAndEndDistance[0];
            summary.totleTime = startAndEndTime[1] - startAndEndTime[0];
            summary.restTime += summary.totleTime - summary.moveTime;

            this.SetSummary = new SetSummary({
                                        LimitRang: {min:minX,max:maxX},
                                        summary: summary,
                                        terrain: this.terrain,
                                        terrainRise:this.terrainRise,
                                        terrainFlat:this.terrainFlat,
                                        terrainDecline:this.terrainDecline
                                    });

            that.drawControl.trigger("setLog","坡度概況計算完成");


            this.SetStability = new SetStability({stability:stability,drawControl:that.drawControl});

        }
    });
    return SlopeCalculate;
});
