define([
    'jquery',
    'underscore',
    'backbone'
], function( $, _, Backbone) {

    var DistrictModel = Backbone.Model.extend({
        urlRoot: './town_all_20160104105547.txt',
        data : null,
        defaults: {
        },

        initialize: function()
        {
            that = this;

        },

    });

    return DistrictModel;
});
