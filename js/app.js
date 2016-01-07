require.config({
    baseUrl: 'js/',
    shim: {
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: [
                'underscore',
                'jquery'
            ],
            exports: 'Backbone'
        },
        highcharts: {
            deps: [
                'jquery'
            ],
            exports: 'highcharts'
        }
    },
    paths: {
        jquery: "https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min",
        underscore: "https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min",
        backbone: "https://cdnjs.cloudflare.com/ajax/libs/backbone.js/1.2.3/backbone-min",
        async: "https://cdnjs.cloudflare.com/ajax/libs/requirejs-async/0.1.1/async",
        text: "https://cdnjs.cloudflare.com/ajax/libs/require-text/2.0.12/text.min",
        i18n: "https://cdnjs.cloudflare.com/ajax/libs/require-i18n/2.0.4/i18n",
        highcharts: "lib/highcharts-custom",

    }
});

require([
    'jquery',
    'highcharts',
    'backbone',
    'models/district',
    'views/drawView',

    ],function($,highcharts, Backbone, DistrictModel, DrawView) {
        var district = new DistrictModel();
        var drawView = new DrawView({model : district});
});
