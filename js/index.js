
/**
 * @param elem an element
 * @param selector Example: ".foo input"
 * @returns {Boolean} Returns the closest ancestor that matches the given selector.
 */
function closest(elem, selector) {
    while (elem) {
        if (elem.matches(selector)) {
            return elem;
        } else {
            elem = elem.parentNode;
        }
    }
    return null;
}

/**
 * Handle image uploaded by the user.
 * 
 * @param evt
 */
function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // only process image files.
    if (!files[0] || !files[0].type.match('image.*')) {
        return;
    }

    var reader = new FileReader();
    var theFile = files[0];

    // Closure to capture the file information.
    reader.onload = function(e) {
        updateThumbnail(evt.target, e.target.result, theFile.name); // escape(theFile.name)
    };

    // Read in the image file as a data URL.
    reader.readAsDataURL(theFile);

}


function removeImageEditor() {
    if (document.querySelector(".cropContainer") != null) {
        var container = document.querySelector(".cropContainer");
        container.parentNode.removeChild(container);
    }    
}

function editImage(evt) {
    
    removeImageEditor();
    
    // insert image editor
    document.querySelector(".placeholder_for_crop_container").insertAdjacentHTML( 'afterbegin', document.querySelector(".dominoResizeCropTemplate").innerHTML );
    
    var upload_div = closest(evt.target, ".upload_div")
    
    // set image in component 
    var img_elem = upload_div.querySelector(".original");
    document.querySelector(".resize-image").src = img_elem.src;
    
    // provide information for the callback
    domino_symbol = upload_div.getAttribute("data-num");

    // initialise the crop component
    var img = $('.cropContainer .container > img');
    
    img.cropper({
        aspectRatio: 1 / 1
    });
    
    
    // load crop state (after the container got its correct dimension)
    window.setTimeout(function() {
        if (domino_crop_states[domino_symbol]) {
            img.cropper('setCanvasData', domino_crop_states[domino_symbol].canvasData);
            img.cropper('setCropBoxData', domino_crop_states[domino_symbol].cropBoxData);
        };
    },0);
    
    document.querySelector(".btn-crop").addEventListener('click', crop, false);
}

/**
 * Crops the image and closes the edit dialog.
 */
function crop() {
    
    var img = $('.container > img');
    
    // save crop state
    domino_crop_states[domino_symbol] = {
        canvasData : img.cropper('getCanvasData'),
        cropBoxData : img.cropper('getCropBoxData'),
        imageData : img.cropper('getImageData'),
        containerData : img.cropper('getContainerData'),
    };

    // crop
    var cropCanvas = img.cropper('getCroppedCanvas', {
        width: 300,
        height: 300
    });
    
    var cropUrl = cropCanvas.toDataURL("image/png");
    
    var upload_divs = document.querySelectorAll(".upload_div");
    upload_divs[domino_symbol].querySelector(".thumb").src = cropUrl;
    
    // update UI
    updateDominoes();
    removeImageEditor();
}

/**
 * Updates the thumbnail image.
 * 
 * @param input_elem
 * @param img_src
 * @param img_title
 */
function updateThumbnail(input_elem, img_src, img_title) {

    var img_elem = input_elem.parentElement.querySelector(".thumb");
    img_elem.src = img_src;
    img_elem.title = img_title;

    var orig_elem = input_elem.parentElement.querySelector(".original");
    orig_elem.src = img_src;
    
    var index = closest(orig_elem, ".upload_div").getAttribute("data-num");
    domino_urls[index] = img_elem.src; 
    
    updateDominoes();
}

/**
 * Updates all dominoes. 
 */
function updateDominoes() {
    
    // read in existing images
    var upload_divs = document.querySelectorAll(".upload_div");
    var img_map = {};
    for (var i = 0; i < upload_divs.length; i++) {
        var img_elem = upload_divs[i].querySelector(".thumb");
        var div_num = upload_divs[i].getAttribute("data-num");
        img_map[div_num] = img_elem;
    }
    
    // update URL and title of all dominoes, update the width
    var domino_imgs = document.querySelectorAll(".domino_div img");
    for (var i = 0; i < domino_imgs.length; i++) {
        var img_elem = domino_imgs[i];
        var img_num = img_elem.getAttribute("data-num");
        var img_ref = img_map[img_num];
        img_elem.src = img_ref.src;
    }
}

/**
 * Opens the browser-specific dialog for printing. 
 */
function handleClickOnPrintButton() {
    print();
}

/**
 * Changes the CSS that sets the print dimensions of the dominoes.
 */
function handleChangeOnDominoWidthInput() {
    var newWidth = document.querySelector(".inp_width").value;
    var css = " .domino_div img { height: DOMINO_WIDTHmm; width: DOMINO_WIDTHmm; } ";
    css = css.replace(/DOMINO_WIDTH/g, "" + newWidth);
    document.querySelector("#domino_width").textContent = css; 
}

/**
 * Adds or removes a frame around the generated dominoes. 
 */
function handleChangeOnWithFrameCheckbox() {
    var withFrame = document.querySelector(".inp_with_frame").checked;
    if (withFrame) {
        document.querySelector("body").classList.add("with_frame");
    }
    else {
        document.querySelector("body").classList.remove("with_frame");
    }
}

/**
 * Replaces the current page content with a new page that contains the given number of domino symbols.
 */
function handleChangeOnNumSymbolsInput(evt) {
    
    // validate entered number of symbols (the browser restrict the value only when a form is submitted)
    var numSymbols = parseInt(evt.target.value);
    //console.log("numSymbols", numSymbols, evt);
    if (! (numSymbols >= 5 && numSymbols <=9 )) {
        numSymbols = 6;
    } 
    
    // remove old contents from the page
    var oldTemplate = document.querySelector('.template_content');
    oldTemplate.parentNode.removeChild(oldTemplate);
    
    onDocumentLoad(numSymbols);
}

/**
 * Creates the upload area for images.
 * <p>
 * @param numSymbols If null, the default (6) is applied.
 */
function onDocumentLoad(numSymbols) {

    // +++ insert upload area
    var template = document.querySelector('.dominoUploadTemplate');
    var model = createModel(numSymbols != null ? numSymbols : 7);

    var content = Mustache.render(template.innerHTML, model);
    //console.log(content);
    document.querySelector(".dynamic").insertAdjacentHTML( 'beforeend', content );

    // +++ add event handlers
    
    // for upload area
    var upload_divs = document.querySelectorAll(".upload_div");
    for (var i = 0; i < upload_divs.length; i++) {
        
        upload_divs[i].querySelector(".thumb").addEventListener('click', function(evt) {
            // delegate to upload file input
            evt.target.parentNode.parentNode.querySelector("input[type=file]").click();
        }, false);
        
        upload_divs[i].querySelector("input[type=file]").addEventListener('change', handleFileSelect, false);
        upload_divs[i].querySelector(".btn_edit_image").addEventListener('click', editImage, false);
    }
    
    // ... for print area
    document.querySelector(".btn_print").addEventListener('click', handleClickOnPrintButton, false);
    document.querySelector(".inp_width").addEventListener('change', handleChangeOnDominoWidthInput, false);
    document.querySelector(".inp_with_frame").addEventListener('change', handleChangeOnWithFrameCheckbox, false);

    // ... for general setting
    var num_buttons = document.querySelectorAll(".div_num_symbols button");
    for (var i = 0; i < num_buttons.length; i++) {
        num_buttons[i].addEventListener('click', handleChangeOnNumSymbolsInput, false);
    }

    updateDominoes();
}

/**
 * EXAMPLE: { 
            nums : [
			    { num: 0, url : null },
				{ num: 1, url : "..." },
				...
				{ num: 6, url : null }
		    ],
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
 * @param num
 * @returns A model for the page that has to show all dominoes and upload areas for the images.
 */
function createModel(num) {
    
    num = num - 1;
    
    var nums = [];
    var dominoes = [];
    
    for (var lower = 0; lower <= num; lower++) {
        
        nums.push({
            num : lower,
            url : domino_urls[lower]
        });
        
        for (var upper = 0; upper <= lower; upper++) {
            dominoes.push({
                lower : lower,
                upper : upper,
                optionalBreak : upper == lower
            });
        }
    }
    
    var result = {
        numSymbols : num + 1,
        width: 10,
        nums : nums,
        dominoes: dominoes
    }
    
    result["btnActive" + (num + 1)] = " active ";
    
    return result;
}

var domino_symbol = -1; // the index of the currently selected domino (needed by the resize/crop component)
var domino_crop_states = []; // (needed by the resize/crop component)
// this is used to save the URLs
var domino_urls = [ "img/domino0.svg", "img/domino1.svg","img/domino2.svg","img/domino3.svg","img/domino4.svg",
                    "img/domino5.svg","img/domino6.svg","img/domino7.svg","img/domino8.svg","img/domino9.svg"];

onDocumentLoad();

