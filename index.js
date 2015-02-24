
/**
 * Handle URL of image typed in by the user.
 * 
 * @param evt
 */
function handleUrl(evt) {
    updateThumbnail(evt.target, evt.target.value, evt.target.value);
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

/**
 * Uploads the thumbnail image.
 * 
 * @param input_elem
 * @param img_src
 * @param img_title
 */
function updateThumbnail(input_elem, img_src, img_title) {
    // navigate to the image element
    var img_elem = input_elem.parentElement.querySelector(".thumb");
    img_elem.src = img_src;
    img_elem.title = img_title;
    
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
    
    // update URL and title of all dominoes
    var domino_imgs = document.querySelectorAll(".domino_div img");
    for (var i = 0; i < domino_imgs.length; i++) {
        var img_elem = domino_imgs[i];
        var img_num = img_elem.getAttribute("data-num");
        var img_ref = img_map[img_num];
        img_elem.src = img_ref.src;
    }
}

/**
 * Creates the upload area for images.
 */
function onDocumentLoad() {

    // insert upload area
    var template = document.querySelector('.dominoUploadTemplate');
    var model = createModel(6);
    console.log("model", model);
    var content = Mustache.render(template.innerHTML, model);
    document.body.insertAdjacentHTML( 'beforeend', content );

    // add event handlers
    var upload_divs = document.querySelectorAll(".upload_div");
    for (var i = 0; i < upload_divs.length; i++) {
        upload_divs[i].querySelector("input[type=file]").addEventListener('change', handleFileSelect, false);
        upload_divs[i].querySelector("input[type=text]").addEventListener('change', handleUrl, false);
    }
    
    updateDominoes();
}

/**
 * EXAMPLE: { 
            nums : [0,1,2,3,4,5,6],
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
    var nums = [];
    var dominoes = [];
    
    for (var lower = 0; lower <= num; lower++) {
        
        nums.push(lower);
        
        for (var upper = 0; upper <= lower; upper++) {
            dominoes.push({
                lower : lower,
                upper : upper,
                optionalBreak : upper == lower
            });
        }
    }
    
    return {
        nums : nums,
        dominoes: dominoes
    }
}

onDocumentLoad();

