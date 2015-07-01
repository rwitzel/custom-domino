var ddApp = angular.module('ddApp', []);

ddApp.service('Deferred', function() { return $.Deferred; });

ddApp.service('ImageCropper', function(Deferred) {

    var cropper = false; /* cropper: the object provided by directive uiImageCropper */
    
    return {
        use: function(c) { cropper = c; },
        
        request: function(tile) {
            
            cropper.setOriginalImage(tile);

            var dfd = Deferred();
            cropper.onCrop(function(evt) {
                dfd.resolve(cropper.getCroppedImage());
            });
            
            return dfd.promise();
        }
    };
});

ddApp.directive('uiImageCropper', function(ImageCropper) {
    return function($scope, elem, attrs) {

        var $cropper = $(elem).find("img");
        
        $cropper.cropper({ aspectRatio: 1 / 1 });

        /* this cropper object wraps DOM APIs */
        var cropper = {
                setOriginalImage : function(image) {
                    $cropper.cropper('replace', image.originalUrl);

                    // set previous crop state if available (after the container got its correct dimension)
                    window.setTimeout(function() {
                        if (image.canvasData) {
                            $cropper.cropper('setCanvasData', image.canvasData);
                            $cropper.cropper('setCropBoxData', image.cropBoxData);
                        };
                    },0);
                },
                getCroppedImage : function() {
                    var cropCanvas = $cropper.cropper('getCroppedCanvas', { width: 300, height: 300 }); // crop
                    return {
                        url         : cropCanvas.toDataURL("image/png"),
                        canvasData  : $cropper.cropper('getCanvasData'),
                        cropBoxData : $cropper.cropper('getCropBoxData'),
                    };
                },
                onCrop : function(eventHandler) {
                    $(elem).find("button").click(eventHandler); 
                }
        };
        
        ImageCropper.use(cropper);
    };
});

ddApp.directive('uiImageUploader', function() {
    return {
        scope : {
            "onUploadCallback" : "&onUpload"
        },
        link: function($scope, element, attrs) {

            element.on('change', function(evt) {

                var files = element[0].files; // FileList object

                // only process image files
                if (!files[0] || !files[0].type.match('image.*')) {
                    return;
                }

                var reader = new FileReader();
                var theFile = files[0];

                // closure to capture the file content
                reader.onload = function(e) {
                    $scope.$apply(function() {

                        $scope.onUploadCallback({
                            url      : e.target.result,
                            filename : theFile.name
                        });
                    });
                };

                // Read in the image file as a data URL.
                reader.readAsDataURL(theFile);
            });
        }
   }
});
    
ddApp.controller('DdCtrl', function($scope, ImageCropper) {

    // initialize model ======================================================================================


    function initTiles() {

        var domino_urls = [ "img/domino0.svg", "img/domino1.svg","img/domino2.svg","img/domino3.svg","img/domino4.svg",
                            "img/domino5.svg", "img/domino6.svg","img/domino7.svg","img/domino8.svg","img/domino9.svg"];

        var tiles = domino_urls.map(function(domino_url, tileIndex) {
            var tile = {
                tileIndex   : tileIndex,
                url         : domino_url, /* the data URL of the tile image after cropping 
				                             (or the original URL if not cropped) */
                originalUrl : domino_url, /* the original URL of the tile image */ 
                title       : domino_url, /* the name of the image file */
                canvasData  : null, /* crop information about the tile */
                cropBoxData : null  /* crop information about the tile */
            };
            return tile;
        });
        return tiles;
    }

    function createDominoes(tiles, numTiles) {

        var dominoes = [];
        for (var lower = 0; lower < numTiles; lower++) {
            for (var upper = 0; upper <= lower; upper++) {
                dominoes.push({
                    lower : lower,
                    upper : upper,
                    lowerUrl : tiles[lower].url,
                    upperUrl : tiles[upper].url,
                    optionalBreak : upper == lower
                });
            }
        }
        return dominoes;
    }
    
    /**
     * EXAMPLE: { 
                model : {
                    numTiles : 7,
                    tiles : [
                        { tileIndex: 0, url : null, canvasData : null, cropBoxData : null},
                        { tileIndex: 1, ...},
                        ...
                        { tileIndex: 6, ... }
                    ]
                    ...
                }
                dominoes : [
                    {
                      upper: 0,
                      lower: 0
                    },
                    {
                      upper: 0,
                      lower: 1
                    },
                    ...
                ]
        };
     */
    $scope.model = {
            numTiles : 7, /* number of tiles */
            tiles : initTiles(), /* tiles */
            width: 10, /* print width of a single domino (in mm) */
            withFrame : false /* true if the dominoes are to be printed with a frame */
        }
    $scope.dominoes = createDominoes($scope.model.tiles, $scope.model.numTiles); /* dominoes, i.e. combinations of two tiles */
    $scope.showCropper = false; /* True if the cropper for any tile is shown */
        

    
    // event handlers ======================================================================================

    $scope.setNumTiles = function(numTiles){ 
        
        dataLayer.push({
            'numTiles'  : numTiles,
            'event'     : 'setNumTiles'
        });
        
        $scope.model.numTiles = numTiles;
    };

    /**
     * Opens the browser-specific dialog for printing. 
     */
    $scope.handleClickOnPrintButton = function(){ 
        
        dataLayer.push({
            'numTiles'  : $scope.model.numTiles,
            'width'     : $scope.model.width,
            'withFrame' : $scope.model.withFrame,
            'event'     : 'print'
        });
        
        print(); 
    };

    $scope.editImage = function(tile) {

        dataLayer.push({
            'tileIndex' : tile.num,
            'event'     : 'editImage'
        });

        $scope.showCropper = true;

        ImageCropper.request(tile).then(function(croppedTile) {

            $scope.$apply(function() {
                tile.url = croppedTile.url;
                tile.canvasData = croppedTile.canvasData;
                tile.cropBoxData = croppedTile.cropBoxData;
                $scope.showCropper = false;
            });
        });
    };
    
    $scope.changeImage = function(newImageUrl, newImageFilename, tileIndex) {

        dataLayer.push({
            'tileIndex' : tileIndex,
            'event'     : 'changeImage'
        });

        $scope.model.tiles[tileIndex] = {
            tileIndex   : tileIndex,
            url         : newImageUrl,
            originalUrl : newImageUrl,
            title       : newImageFilename,
            canvasData  : null, 
            cropBoxData : null  
        };
    }

    $scope.loadExamples = function() {

        dataLayer.push({ 'event'     : 'loadExamples' });
        
        $scope.numTiles = 5;

        var example_urls = [ "img/example0_clown_fish.jpg", "img/example1_tux.png", "img/example2_hedgehog.jpg", 
              "img/example3_fly.svg", "img/example4_elephant.jpg", "img/example5_flower.jpg", "img/example6_cow.jpg" ];
        
        example_urls.forEach(function(example_url, tileIndex) {
        
            $scope.model.tiles[tileIndex] = {
                tileIndex   : tileIndex,
                url         : example_url,
                originalUrl : example_url, 
                title       : example_url,
                canvasData  : null,
                cropBoxData : null 
            };
            
        });
        
    }

    // watch expressions ======================================================================================

    $scope.$watch("model", function(newValue, oldValue, scope) {
        $scope.dominoes = createDominoes($scope.model.tiles, $scope.model.numTiles);  
    }, true);
    
});