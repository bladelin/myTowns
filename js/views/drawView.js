define([
    'jquery',
    'underscore',
    'backbone',
    'views/util',
    'text!templates/map.html'
    //'text!templates/data.json'
], function( $, _, Backbone, Util, mapTemplate) {

    var DrawChart = Backbone.View.extend({
        el: 'body',
        template: _.template( mapTemplate ),
        minLong : 999,
        maxLong : -999,
        minLat : 999,
        maxLat : -999,
        cityCoords : [],
        map : {},
        that : {},
        data : null,
        model : null,
        markersArray   :[],
        events: {
            'click .item': 'draw',
        },

        initialize: function(data)
        {
            that = this;
            this.$el.append( this.template());
            this.model = data.model;
            //this.loadData(dataJson);
            this.firstLoad();
        },

        loadData: function (dataJson)
        {
            console.log('c');
            var that = this;
            that.data = dataJson;
            that.model.set({"data": that.data});
            $.data( document.body, "data", that.data);
            console.log('first load data');
            that.firstProcess();
        },

        firstLoad : function()
        {
            var that = this;
            $.get('./1.php', function(raw){
                that.data = $.parseJSON(raw);//raw.split("\n");
                that.model.set({"data": that.data});
                $.data( document.body, "data", that.data);
                console.log('first load data');
                that.firstProcess();
            });
            // that.data = data;
            //that.set(data);

        },

        firstProcess : function() {
            console.log('first process');
            var sidebar =$('#sidebar');
            var html = '';
            var data = that.data;

            for (var country in data) {
                html += '<div class="main-item">'+country+'</div>';
                for (var key in data[country]) {
                    var item = data[country][key]['location'].split('-');
                    //console.log(item);
                    if (typeof item[0]!=undefined) {
                        html += '<div class="item" data="'+key+'">'+item[1]+'</div>';
                    }
                }
            }
            sidebar.html(html);

            var cityCoords = this.getCityCoords('嘉義縣-太保市');
            //console.log(cityCoords);
            map = new google.maps.Map(document.getElementById('map'), {
                zoom: 11,
                center: cityCoords[0] ,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            });

            that.drawPolygon(cityCoords);
        },

        getCityCoords : function(cityId)
        {
            var gpsPoint = {};
            var cityCoords = [];

            var arr = cityId.split('-');
            var country = arr[0];
            var city = arr[1];
            var data = $.data( document.body, "data");
            var gpsPointArray = data[country][cityId].gps;
            for (var key in gpsPointArray) {
                gpsPoint = {};
                gpsPoint.lng = parseFloat(gpsPointArray[key][1]);
                gpsPoint.lat = parseFloat(gpsPointArray[key][0]);
                cityCoords.push(gpsPoint);
            }
            return cityCoords;
        },

        draw : function(e)
        {
            var cityId = $(e.currentTarget).attr('data');
            console.log(cityId);
            var cityCoords = that.getCityCoords(cityId);
            that.drawPolygon(cityCoords);
        },

        setMapFitBounds : function(cityCoords)
        {

            var minLong = 999;
            var maxLong = -999;
            var minLat = 999;
            var maxLat = -999;

            for (var key  in cityCoords) {
                if ( cityCoords[key].lng < minLong ) minLong = cityCoords[key].lng;
                if ( cityCoords[key].lng > maxLong ) maxLong = cityCoords[key].lng;
                if ( cityCoords[key].lat < minLat ) minLat = cityCoords[key].lat;
                if ( cityCoords[key].lat > maxLat ) maxLat = cityCoords[key].lat;
            }

            var fitBounds = new google.maps.LatLngBounds(
                            new google.maps.LatLng(minLat, minLong ),
                             new google.maps.LatLng(maxLat, maxLong )
                             );

            if(typeof(fitBounds) == "object") {
                map.fitBounds(fitBounds);
                map.panTo(fitBounds.getCenter());
            }

            if(map.getZoom() > 16)
                map.setZoom(16);
        },

        // Deletes all markers in the array by removing references to them
        deleteOverlays : function () {
          if (this.markersArray) {
            for (i in this.markersArray) {
              this.markersArray[i].setMap(null);
            }
            this.markersArray.length = 0;
          }
        },

        drawPolygon : function(cityCoords)
        {
            this.deleteOverlays();
            //console.log(cityCoords);
            var bermudaTriangle = new google.maps.Polygon({
                paths: cityCoords,
                strokeColor: '#FF0000',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#FF0000',
                fillOpacity: 0.35
            });
            that.setMapFitBounds(cityCoords);
            console.log('draw Polygon');
            bermudaTriangle.setMap(map);
            this.markersArray.push(bermudaTriangle);
        },

    });
    return DrawChart;
});
