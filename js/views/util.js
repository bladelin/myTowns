define([
    'jquery',
    'underscore',
    'backbone'
], function( $, _, Backbone,Util,SummaryBoxTemplate) {
    var Util = {
        formatTime : function(second){
            second = parseInt(second);
            return [parseInt(second / 60 / 60), Math.floor(second / 60 % 60), second % 60].join(":")
            .replace(/\b(\d)\b/g, "0$1");
        },
        formatDistance: function(distance){
            distance = parseFloat(distance);
            var string = "";
            if (distance>=1000) {
                string = parseFloat((distance/1000).toFixed(2)) + " km";
            } else {
                string = parseFloat(distance.toFixed(2)) + " m";
            }
            return string;
        },
        formatSpeed: function(distance,second){
            if (!isNaN(distance),!isNaN(second) && second>0 && distance>0) {
                second = parseInt(second);
                distance = parseFloat(distance);
                speed =  (distance/1000)/(second /3600);
                speed = speed.toFixed(2) + " km/hr";
            } else {
                speed = "--";
            }

            return speed;
        },
        formatPercent: function(number){
            if (!isNaN(number)) {
                number = parseFloat(number);
                number = parseFloat(this.formatRound(number * 100,2)) + '%';
            } else {
                number = "--";
            }
            return number;
        },
        formatRound: function(number,limit){
            return number.toFixed(limit);
        },
        formatSlopeRating: function(value){
            slopeRating = null;
            if ( value >= 200) {
                slopeRating = "HC";
            } else if(value>=120) {
                slopeRating = "1";
            } else if (value>50) {
                slopeRating = "2";
            } else if (value>=20) {
                slopeRating = "3";
            } else {
                slopeRating = "4";
            }
            return slopeRating;
        },
        formatSccerateIndex: function(sccerateIndex){
            var string = "";
            if (sccerateIndex>1.5) {
                string = "加速型配速";
            }else if (sccerateIndex<=1.5 && sccerateIndex>1) {
                string = "提速型配速";
            }else if (sccerateIndex<=1 && sccerateIndex>=-1) {
                string = "平均型配速";
            }else if (sccerateIndex<-1 && sccerateIndex>=-1.5) {
                string = "降速型配速";
            } else {
                string = "衰退型配速";
            }
            return string;
        },
        formatStabilityLevel: function(stability){
            stabilityType = null;
            if (stability >=2.5) {
                stabilityType = "V";
            } else if (stability>=2.0) {
                stabilityType = "IV";
            } else if (stability>=1.5) {
                stabilityType = "III";
            } else if (stability>=1.0) {
                stabilityType = "II";
            } else {
                stabilityType = "I";
            }
            return stabilityType;
        },
        math: {
            toFixed: function(number,size){
                return parseFloat(number.toFixed(size));
            },
            mean: function(data){
                 var sum=eval(data.join("+"));
                 return sum/data.length;
            },
            stdDev: function(data){
                var m = this.mean(data);
                var sum = 0;
                var l = data.length;
                for(var i=0;i<l;i++){
                    var dev=data[i]-m;
                    sum+=(dev*dev);
                }
                return Math.sqrt(sum/(l-1));
            }
        }
    };

    return Util;
});
