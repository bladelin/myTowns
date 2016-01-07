define([
    'jquery',
    'underscore',
    'backbone',
    'text!templates/slopeAnalysisController.html',
], function( $, _, Backbone, slopeAnalysisControllerTemplate) {
    var SlopeAnalysisControllerView = Backbone.View.extend({
        el: 'body',
        template: _.template( slopeAnalysisControllerTemplate ),
        events: {
            'change .slopeController #detectAid': 'changeDetectAid',
            'change .slopeController input[type="range"]': 'changeRange',
            'change .slopeController select': 'reDraw',
        },
        initialize: function(data) {
            var that = this;
            that.model = data.model;
            that.drawControl = data.drawControl;
            that.lastAid = null;
            this.$el.append( this.template());
            this.$el.find("#detectAid").val(data.aid);
            this.listenTo( this.drawControl, "setLog", this.setLog);

            $(".slopeController input[type='range']",this.$el).trigger("change");
            $(".slopeController #detectAid",this.$el).trigger("change");
        },
        changeRange: function(e){
            var that = this;
            var target = $(e.currentTarget);
            target.parent().find("span").text(target.val());
            if (that.lastAid != null) {
                that.reDraw();
            }
        },
        changeDetectAid: function(e){
            var that = this;
            var detectAid = this.$el.find("#detectAid").val();
            if (that.lastAid!=detectAid) {
                if(!isNaN(detectAid)){
                    that.drawControl.trigger("setLog","讀取檔案中....");
                    var jqxhr = $.getJSON( "getGpsData.php?aid="+detectAid, function(data) {
                        that.lastAid = detectAid;
                        that.model.set(data);
                        that.reDraw();
                    });
                }
            }
        },
        reDraw: function(){
            var target = $(".slopeController",this.$el);
            var data = {'detectRang': target.find("#detectRang").val(),
                        'changeTimeWeight': target.find("#changeTimeWeight").val(),
                        'elevationWeight': target.find("#elevationWeight").val(),
                        'optimization': target.find("#optimization").val(),
                        'mergeSameArea': target.find("#mergeSameArea").val(),
                        'userWeight': target.find("#userWeight").val(),
                        'showSlopeRate': target.find("#showSlopeRate").val(),
                    };
            this.drawControl.set(data);
            this.drawControl.trigger("reCal");
        },
        setLog: function(log){
            console.log(log);
            this.$el.find(".statusLog").text(log);
        }

    });

    return SlopeAnalysisControllerView;
});
