define([
    'jquery',
    'underscore',
    'backbone',
    'views/util',
    'text!templates/summaryBox.html',
    'text!templates/summaryInfo.html',
    'text!templates/slopeInfo.html',
    'i18n!nls/msg',
], function( $, _, Backbone, Util,SummaryBoxTemplate,SummaryInfoTemplate,SlopeInfoTemplate,Msg) {
    var SetSummary = Backbone.View.extend({
        el: '.infoBox',
        template: _.template( SummaryBoxTemplate ),
        templateSummaryInfo: _.template( SummaryInfoTemplate ),
        templateSlopeInfo: _.template( SlopeInfoTemplate ),

        initialize: function(data) {
            for (var key in data) {
                this[key] = data[key];
            }

            this.$el.append( this.template({Util:Util,LimitRang:this.LimitRang}));
            this.setTitleInfo();
            this.calSlopeInfo();
            this.setSummaryInfo();
            this.setSlopeInfo();
        },
        setTitleInfo: function(){

        },
        calSlopeInfo: function(){
            var avgTerrainSlope = {};
            var slopeCount = {};
            var percentSlopeRange = {};
            for ( var type in this.terrain) {
                switch (type){
                    case this.terrainRise:
                    case this.terrainDecline:
                        slopeCount[type] = 0;
                        slope = 0;
                        for(var i in this.summary.statistics.detail[type]) {
                            if (this.summary.statistics.detail[type][i].amount>0) {
                                slope = slope + this.summary.statistics.detail[type][i].slope;
                            }

                            slopeCount[type] += this.summary.statistics.detail[type][i].amount;
                        }
                        avgTerrainSlope[type] = slope/ slopeCount[type];
                        break;
                }

            }


            for ( var type in this.terrain) {
                switch (type){
                    case this.terrainRise:
                    case this.terrainDecline:
                        percentSlopeRange[type] = [];
                        for(var i in this.summary.statistics.detail[type]) {
                            var temp = {};
                            if (typeof(this.summary.statistics.detail[type][parseInt(i)+1])=="undefined") {
                                temp.title = this.summary.statistics.detail[type][i].rang*100 +"% ~ ";
                            } else {
                                temp.title = this.summary.statistics.detail[type][i].rang*100 +"% ~ "+this.summary.statistics.detail[type][parseInt(i)+1].rang*100+"%"
                            }
                            if (slopeCount[type]>0) {
                                temp.value = this.summary.statistics.detail[type][i].amount / slopeCount[type];
                            } else {
                                temp.value = 0;
                            }

                            percentSlopeRange[type][percentSlopeRange[type].length] = temp;
                        }
                        break;
                }
            }
            terrain = $.extend( {}, this.terrain);
            delete terrain[this.terrainFlat];

            this.summary.avgTerrainSlope = avgTerrainSlope;
            this.summary.percentSlopeRange = percentSlopeRange;

            if (avgTerrainSlope[this.terrainRise]>0) {
                this.summary.slopeRatingValue  = Math.pow(avgTerrainSlope[this.terrainRise]*100,1.5)*(this.summary.maxElevation-this.summary.minElevation)/100
            } else {
                this.summary.slopeRatingValue  =  "--";
            }

            console.log(this.summary);

        },
        setSummaryInfo: function(){
            this.SummaryInfo = this.templateSummaryInfo({terrain: this.terrain, Util: Util, summary:this.summary,Msg:Msg});
            this.$el.find(".summaryBox").append( this.SummaryInfo);
        },
        setSlopeInfo: function(){

            this.SlopeInfo = this.templateSlopeInfo({
                                                    terrainRise: this.terrainRise,
                                                    terrain: terrain,
                                                    Util: Util,
                                                    Msg: Msg,
                                                    avgTerrainSlope:this.summary.avgTerrainSlope,
                                                    percentSlopeRange:this.summary.percentSlopeRange
                                                });
            this.$el.find(".summaryBox").append( this.SlopeInfo);
        },
        clearBox: function(){
            this.$el.find(".summaryBox").remove();
        }
    });

    return SetSummary;
});
