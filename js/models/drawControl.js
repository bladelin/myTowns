define([
    'jquery',
    'underscore',
    'backbone'
], function( $, _, Backbone) {
    var DrawControlModel = Backbone.Model.extend({
        defaults: {
            changeTimeWeight: 20,
            detectRang: 10,
            elevationWeight: 0.01,
            optimization: 1,
            mergeSameArea: 1,
            userWeight: 60,
            showSlopeRate: 1,
        }
    });
    return DrawControlModel;
});
