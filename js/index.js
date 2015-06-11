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

                        var data = JSON.parse(attrs.uiImageUploader);
                        
                        $scope[data.callback]({
                            url      : e.target.result,
                            filename : theFile.name,
                            param  : data.param 
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
                        "img/domino5.svg","img/domino6.svg","img/domino7.svg","img/domino8.svg","img/domino9.svg"];

        var tiles = [];
        for (var tileIndex = 0; tileIndex <= 9; tileIndex++) {
            tiles.push({
                num         : tileIndex,
                url         : domino_urls[tileIndex], /* the data URL of the tile image after cropping 
				                                        (or the original URL if not cropped) */
                originalUrl : domino_urls[tileIndex], /* the original URL of the tile image */ 
                title       : domino_urls[tileIndex], /* the name of the image file */
                canvasData  : null, /* crop information about the tile */
                cropBoxData : null  /* crop information about the tile */
            });
        }
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
                        { num: 0, url : null, canvasData : null, cropBoxData : null},
                        { num: 1, ...},
                        ...
                        { num: 6, ... }
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

    /**
     * Opens the browser-specific dialog for printing. 
     */
    $scope.handleClickOnPrintButton = function(num){ print(); };

    $scope.editImage = function(tile) {

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
    
    $scope.changeImage = function(newImage) {
        $scope.model.tiles[newImage.param] = {
            num         : newImage.param,
            url         : newImage.url,
            originalUrl : newImage.url,
            title       : newImage.filename,
            canvasData  : null, 
            cropBoxData : null  
        };
    }
    
    // watch expressions ======================================================================================

    $scope.$watch("model", function(newValue, oldValue, scope) {
        $scope.dominoes = createDominoes($scope.model.tiles, $scope.model.numTiles);  
    }, true);
    
});