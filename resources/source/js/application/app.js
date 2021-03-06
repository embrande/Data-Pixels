//Imports
import { SharedStates as S } from "../support/sharedStates.js";
import * as C from "../support/constants.js";
import * as Content from "./content.js";
import * as Examples from "../dataPixels/examples.js";
import * as Layout from "./layout.js";
import * as Main from "../main.js";
import * as Popups from "./popups.js";
import * as Utils from "../support/utils.js";
import DataPixelsCodeFactory from "../dataPixels/DataPixelsCodeFactory.js";

/**
 * @description The <strong>app.js</strong> module contains properties and functions pertaining to the initialization and control of the application.
 * @requires constants
 * @requires content
 * @requires dataPixelsCodeFactory
 * @requires layout
 * @requires popups
 * @requires sharedStates
 * @requires utils
 * @module
 * 
 */
export {//
    
    checkExecuteButton,
    displayAboutDialog,
    displayExampleCode,
    executeCode,
    imageSizeCancelHandler,
    imageSizeOKHandler,
    init,
    loadDataPixelsClassCode,
    readImageFile,
    setErrorMessage,
    setMode,
    setTheme,
    settingsButtonClickHandler,
    toggleLayout,
    updateAutoCode
};

/**
 * @description An object containing the following members with module scope:
 * <ul>
 *     <li> ControlButtons </li>
 *     <li> DataPixelsClassCode </li>
 *     <li> DataPixelsClassCodeInternal </li>
 *     <li> File </li>
 *     <li> Image </li>
 *     <li> IsExecutable </li>
 *     <li> IsExecuting </li>
 * </ul>
 * 
 * @private
 * @constant
 * 
 */
const M = {

    ControlButtons: undefined,
    DataPixelsClassCode: undefined,
    DataPixelsClassCodeInternal: undefined,
    File: undefined,
    Image: undefined,  
    IsExecutable: undefined,
    IsExecuting: undefined
};

/**
 * @description Initializes the application.
 * @public
 * @function
 * 
 */
function init() {

    readStates();
    initControls(); 
    initFileManagement();
    Content.init();
}

/**
 * @description Gets the saved or default values from the localStorage object and distributes them via sharedStates.
 * @private
 * @function
 * 
 */
function readStates() {

    S.Alignment = (localStorage.length) ? JSON.parse(localStorage.getItem(C.Persistence.ALIGNMENT)) : true;
    S.AutoCode = DataPixelsCodeFactory.fromJSON(localStorage.getItem(C.Persistence.AUTO_CODE)) || null;
    S.Code = (localStorage.length) ? localStorage.getItem(C.Persistence.CODE) : Examples.basic;
    S.CodeEditorFlexGrow = localStorage.getItem(C.Persistence.CODE_EDITOR_FLEX_GROW) || 0.65;
    S.Description = (localStorage.length) ? JSON.parse(localStorage.getItem(C.Persistence.DESCRIPTION)) : false;
    S.FrameViewFlexGrow = localStorage.getItem(C.Persistence.FRAME_VIEW_FLEX_GROW) || 0.35;
    S.Mode = localStorage.getItem(C.Persistence.MODE) || C.Mode.MANUAL;
    S.Indentation = localStorage.getItem(C.Persistence.INDENTATION) || C.Indentation.INDENT_4;
    S.Orientation = localStorage.getItem(C.Persistence.ORIENTATION) || C.Orientation.VERTICAL;
    S.Theme = localStorage.getItem(C.Persistence.THEME) || C.Theme.DARK;

    window.addEventListener(C.Event.BEFORE_UNLOAD, writeStates);

    setMode(S.Mode);
    setTheme(S.Theme);
}

/**
 * @description Sets the localStorage object with values from sharedStates to facilitate application persistence.
 * @public
 * @function
 * 
 */
function writeStates() {

    window.removeEventListener(C.Event.BEFORE_UNLOAD, writeStates);

    try {

        localStorage.setItem(C.Persistence.ALIGNMENT, S.Alignment);
        localStorage.setItem(C.Persistence.AUTO_CODE, (S.Mode === C.Mode.AUTO) ? JSON.stringify(S.AutoCode) : null);
        localStorage.setItem(C.Persistence.CODE_EDITOR_FLEX_GROW, S.CodeEditorFlexGrow);
        localStorage.setItem(C.Persistence.CODE, C.HTMLElement.TEXT_AREA.value);
        localStorage.setItem(C.Persistence.DESCRIPTION, S.Description);
        localStorage.setItem(C.Persistence.FRAME_VIEW_FLEX_GROW, S.FrameViewFlexGrow);
        localStorage.setItem(C.Persistence.MODE, S.Mode);
        localStorage.setItem(C.Persistence.INDENTATION, S.Indentation);
        localStorage.setItem(C.Persistence.ORIENTATION, S.Orientation);
        localStorage.setItem(C.Persistence.THEME, S.Theme);
    }
    catch (error) {

        setErrorMessage(error);
    }
}

/**
 * @description The mode determines which formatting options are available to the automatically generated program code written in the Code Editor.
 * @param {number} mode - The mode value is either 0 (Automatic) or 1 (Manual).
 * @private
 * @function
 * 
 */
function setMode(mode) {

    S.Mode = mode;

    if (S.Mode === C.Mode.MANUAL) {

        C.HTMLElement.TEXT_AREA.removeEventListener(C.Event.INPUT, textInputManualModeHandler);

        return;
    }

    if (S.Mode === C.Mode.AUTO) {

        C.HTMLElement.TEXT_AREA.addEventListener(C.Event.INPUT, textInputManualModeHandler);
    }
}

/**
 * @description Event handler called when text is manually entered in the Code Editor. 
 * @public
 * @function
 * 
 */
function textInputManualModeHandler() {

    setMode(C.Mode.MANUAL);
}

/**
 * @description The set theme applies a cohesive visual style throughout the application.  
 * @param {string} theme - The theme value is either "Dark" or "Light".
 * @private
 * @function
 * 
 */
function setTheme(theme) {

    if (theme === C.Theme.DARK || theme === C.Theme.LIGHT) {
        
        S.Theme = theme;

        document.body.classList.remove((S.Theme === C.Theme.DARK) ? C.CSSClass.THEME_LIGHT : C.CSSClass.THEME_DARK);
        document.body.classList.add((S.Theme === C.Theme.DARK) ? C.CSSClass.THEME_DARK : C.CSSClass.THEME_LIGHT);

        if (M.ControlButtons) {

            for (const button of M.ControlButtons) {

                button.classList.remove((S.Theme === C.Theme.DARK) ? C.CSSClass.CONTROL_BUTTON_THEME_DARK : C.CSSClass.CONTROL_BUTTON_THEME_LIGHT);
                button.classList.add((S.Theme === C.Theme.DARK) ? C.CSSClass.CONTROL_BUTTON_THEME_LIGHT : C.CSSClass.CONTROL_BUTTON_THEME_DARK);
            }
        }

        Popups.updateTheme();
    }
}

/**
 * @description Initializes the UI elements with applicable event handlers.
 * @private
 * @function
 * 
 */
function initControls() {

    const executeButton = buildControlButton(C.HTMLElement.BUTTON_EXECUTE,
                                             C.ImageSource.RUN,
                                             C.Label.EXECUTE_CODE,
                                             executeCode);

    const settingsButton = buildControlButton(C.HTMLElement.BUTTON_SETTINGS,
                                              C.ImageSource.SETTINGS,
                                              C.Label.SETTINGS,
                                              settingsButtonClickHandler);

    const layoutHorizontalButton = buildControlButton(C.HTMLElement.BUTTON_LAYOUT_HORIZONTAL,
                                                      C.ImageSource.DOCK,
                                                      C.Label.LAYOUT_HORIZONTAL,
                                                      layoutButtonClickHandler);

    const layoutVerticalButton = buildControlButton(C.HTMLElement.BUTTON_LAYOUT_VERTICAL,
                                                    C.ImageSource.DOCK,
                                                    C.Label.LAYOUT_VERTICAL,
                                                    layoutButtonClickHandler);

    M.ControlButtons = [executeButton, settingsButton, layoutHorizontalButton, layoutVerticalButton];

    M.IsExecutable = true;

    checkExecuteButton();
    toggleLayout();
}

/**
 * @description Assigns attributes and event handling to an HTMLInputElement object that is of type "image".
 * @param {Object} button - The target HTMLInputElement object that is of type "image".
 * @param {string} src - The URL of the button's image.
 * @param {string} title - The label assigned as the button's tooltip.
 * @param {function} clickHandler - The callback function for the button's click event.
 * @private
 * @function
 * 
 */
function buildControlButton(button, src, title, clickHandler) {

    button.src = src;
    button.title = title;
    button.classList.add(C.CSSClass.CONTROL_BUTTON);
    button.classList.add(S.Theme === C.Theme.LIGHT ? C.CSSClass.CONTROL_BUTTON_THEME_DARK : C.CSSClass.CONTROL_BUTTON_THEME_LIGHT);
    button.addEventListener(C.Event.CLICK, clickHandler);

    return button;
}

/**
 * @description Event handler called when settings control button is clicked.
 * @public
 * @function
 * 
 */
function settingsButtonClickHandler() {

    Popups.display(C.Dialog.SETTINGS);
}

/**
 * @description Event handler called when either of the layout control buttons are clicked.
 * @param {Object} event - The event object.
 * @private
 * @function
 * 
 */
function layoutButtonClickHandler(event) {

    const clickedVertical = (event.target === C.HTMLElement.BUTTON_LAYOUT_VERTICAL);
    S.Orientation = (clickedVertical) ? C.Orientation.VERTICAL : C.Orientation.HORIZONTAL;

    toggleLayout();
}

/**
 * @description Alters the visual appearance of the layout control buttons according to the current orientation.
 * @public
 * @function
 * 
 */
function toggleLayout() {

    const isVertical = (S.Orientation === C.Orientation.VERTICAL);

    C.HTMLElement.BUTTON_LAYOUT_HORIZONTAL.disabled = (isVertical) ? false : true;
    C.HTMLElement.BUTTON_LAYOUT_VERTICAL.disabled   = (isVertical) ? true  : false;

    Layout.toggleLayout();

    Main.updateElectronOrientationMenuItems();
}

/**
 * @description Displays either manual or automatically generated program code in the Code Editor.
 * @param {string} code - The code to display in the Code Editor.
 * @param {boolean} [autoMode = true] - Sets the application mode based on how the supplied code was produced.
 * @private
 * @function
 * 
 */
function displayCode(code, autoMode = true) {

    const textArea = C.HTMLElement.TEXT_AREA;
    textArea.focus();
    textArea.setSelectionRange(0, textArea.value.length);

    document.execCommand(C.TextArea.COMMAND_INSERT, false, code);

    if (autoMode) {
        
        setMode(C.Mode.AUTO);
    }

    Content.updateLineNumbers();
    checkExecuteButton();
}

/**
 * @description Determines whether or not to disable or enable the Execute button.
 * @public
 * @function
 * 
 */
function checkExecuteButton() {

    const textArea = C.HTMLElement.TEXT_AREA;

    if (textArea.value === "" && M.IsExecutable) {

        disableExecuteButton(true);

        return;
    }

    if (textArea.value !== "" && !M.IsExecutable) {

        disableExecuteButton(false);
    }
}

/**
 * @description Disables or enables the Execute button.
 * @param {boolean} disable - The disable value is either true (to disable) or false (to enable).
 * @private
 * @function
 * 
 */
function disableExecuteButton(disable) {

    C.HTMLElement.BUTTON_EXECUTE.disabled = disable;
    M.IsExecutable = !disable;

    Main.updateElectronRunMenuItem();
}

/**
 * @description Executes the program code that is written in the Code Editor.
 * @public
 * @function
 * 
 */
function executeCode() {

    const frameViewDocument = C.HTMLElement.FRAME_VIEW.contentDocument;
    const frameViewBody = frameViewDocument.body;
    const headTag = frameViewDocument.getElementsByTagName("head")[0];

    if (!M.DataPixelsClassCodeInternal) {

        window.setErrorMessageDelegate = function(error) {

            setErrorMessage(error);
        };

        M.IsExecuting = true;

        loadDataPixelsClassCode();

        const compileScript = document.createElement(C.HTML.SCRIPT);
        compileScript.type = C.HTML.SCRIPT_TYPE;
        compileScript.text = `window.addEventListener("error", (error) => { parent.setErrorMessageDelegate(error.message); })`;

        headTag.appendChild(compileScript);

        return;
    }

    while (frameViewBody.firstChild) {

        frameViewBody.removeChild(frameViewBody.firstChild);
    }

    setErrorMessage(null);

    let code = C.HTMLElement.TEXT_AREA.value;
    code = code.replace(/import .*?[;|\n]/gmi, "");

    const runtimeScript = document.createElement(C.HTML.SCRIPT);
    runtimeScript.type = C.HTML.SCRIPT_TYPE;
    runtimeScript.text = `try{ (function(){ ${M.DataPixelsClassCodeInternal}${code} })(); }catch(error){ parent.setErrorMessageDelegate(error); }`;

    headTag.appendChild(runtimeScript);
    headTag.removeChild(runtimeScript);
}

/**
 * @description Sets and displays an error message when the the application encounters an error.
 * @param {string} [errorMessage = null] - The error message to display.
 * @public
 * @function
 * 
 */
function setErrorMessage(errorMessage = null) {

    const errorElement = C.HTMLElement.ERROR;
    errorElement.textContent = (errorMessage === null) ? "" : `${C.Unicode.X} ${errorMessage}`;
    errorElement.title = errorMessage;
}

/**
 * @description Instantiates an XMLHttpRequest to load the DataPixels.js file for both in-app code execution and exporting the DataPixels.js class file.
 * @public
 * @function
 * 
 */
function loadDataPixelsClassCode() {

    if (!M.DataPixelsClassCode) {

        const xhr = new XMLHttpRequest();
        xhr.addEventListener(C.Event.LOAD, XHRLoadHandler);
        xhr.addEventListener(C.Event.ERROR, XHRErrorHandler);
        xhr.open("GET", C.Code.SCRIPT_URL);
        xhr.send();
    }
    else {

        Main.exportClassFile(M.DataPixelsClassCode);
    }
}

/**
 * @description Event handler called when the XMLHttpRequest has finished loading the DataPixels class code.
 * @param {Object} event - The event object.
 * @private
 * @function
 * 
 */
function XHRLoadHandler(event) {

    const xhr = event.target;
    xhr.removeEventListener(C.Event.LOAD, XHRLoadHandler);
    xhr.removeEventListener(C.Event.LOAD, XHRErrorHandler);

    if (xhr.status === 404) {

        setErrorMessage(`${C.Label.ERROR} ${C.Label.FILE_NOT_FOUND}`);

        return;
    }

    M.DataPixelsClassCode = xhr.responseText;
    M.DataPixelsClassCodeInternal = xhr.responseText.replace(/(export default DataPixels;)/gi, "");

    if (M.IsExecuting) {

        M.IsExecuting = false;

        executeCode();
    }
    else {

        Main.exportClassFile(M.DataPixelsClassCode);
    }
}

/**
 * @description Event handler called when the XMLHttpRequest has encountered an error.
 * @param {Object} event - The event object.
 * @private
 * @function
 * 
 */
function XHRErrorHandler(event) {

    const xhr = event.target;
    xhr.removeEventListener(C.Event.LOAD, XHRLoadHandler);
    xhr.removeEventListener(C.Event.LOAD, XHRErrorHandler);

    setErrorMessage(`${C.Label.ERROR} ${C.Label.FILE_READ}`);
}

/**
 * @description Initializes input file control and file drop functionality with applicable event handlers.
 * @private
 * @function
 * 
 */
function initFileManagement() {

    const dropTarget = document.body;

    dropTarget.addEventListener(C.Event.DRAG_ENTER, (event) => {

        event.stopPropagation();
        event.preventDefault();

        event.dataTransfer.effectAllowed = C.HTML.COPY;
    });

    dropTarget.addEventListener(C.Event.DRAG_OVER, (event) => {

        event.stopPropagation();
        event.preventDefault();
        
        event.dataTransfer.dropEffect = C.HTML.COPY;
    });

    dropTarget.addEventListener(C.Event.DROP, (event) => {

        event.stopPropagation();
        event.preventDefault();

        validateDroppedFileType(event.dataTransfer.files[0]);
    });
}

/**
 * @description Validates the file type of the dropped file as one of the application's supported image file types.
 * @param {Object} file - The dropped file.
 * @private
 * @function
 * 
 */
function validateDroppedFileType(file) {

    if (file) {

        setMode(C.Mode.MANUAL);

        M.File = file;
        const fileType = M.File.type;

        if (fileType !== C.Type.MIME_IMAGE_GIF && fileType !== C.Type.MIME_IMAGE_JPG && fileType !== C.Type.MIME_IMAGE_PNG) {

            Popups.display(C.Dialog.FILE_TYPE_ERROR);

            return;
        }

        setMode(C.Mode.AUTO);
        readImageFile(file);
    }
}

/**
 * @description Instantiates a FireReader object to read a dropped or opened image file
 * @param {Object} blob - The Blob object read by the FileReader.  
 * @param {string} [fileName = null] - Name of the opened image file assigned to the name property of the M.File object.
 * @public
 * @function
 * 
 */
function readImageFile(blob, fileName = null) {

    if (fileName) {

        M.File = {name: fileName};
    }

    const fileReader = new FileReader();
    fileReader.readAsDataURL(blob);
    fileReader.addEventListener(C.Event.LOAD, fileReaderLoadHandler);
    fileReader.addEventListener(C.Event.ERROR, fileReaderErrorHandler);
}

/**
 * @description Event handler called when the FileReader has finished loading the image file's contents.
 * @param {Object} event - The event object.
 * @private
 * @function
 * 
 */
function fileReaderLoadHandler(event) {

    const fileReader = event.target;
    fileReader.removeEventListener(C.Event.LOAD, fileReaderLoadHandler);
    fileReader.removeEventListener(C.Event.ERROR, fileReaderErrorHandler);
    
    const image = new Image();
    image.src = fileReader.result;
    image.addEventListener(C.Event.LOAD, imageLoadHandler);
    image.addEventListener(C.Event.ERROR, imageErrorHandler);
}

/**
 * @description Event handler called when the FileReader has encountered an error.
 * @param {Object} event - The event object.
 * @private
 * @function
 * 
 */
function fileReaderErrorHandler(event) {

    const fileReader = event.target;
    fileReader.removeEventListener(C.Event.LOAD, fileReaderLoadHandler);
    fileReader.removeEventListener(C.Event.ERROR, fileReaderErrorHandler);

    setErrorMessage(`${C.Label.ERROR} ${C.Label.FILE_READ}`);
    setMode(C.Mode.MANUAL);
}

/**
 * @description Event handler called when the HTMLImageElement with dimension attributes has finished loading.
 * @param {Object} event - The event object.
 * @private
 * @function
 * 
 */
function imageLoadHandler(event) {

    const image = event.target;
    image.removeEventListener(C.Event.LOAD, imageLoadHandler);
    image.removeEventListener(C.Event.ERROR, imageErrorHandler);

    if (image.width * image.height > C.Measurement.IMAGE_MAX_AREA) {

        M.Image = image;

        Popups.display(C.Dialog.IMAGE_SIZE_WARNING);
    }
    else {
    
        createAutoCode(image);
    }
}

/**
 * @description Event handler called when the OK button of the Image Size Dialog is clicked.
 * @public
 * @function
 * 
 */
function imageSizeOKHandler() {

    createAutoCode(M.Image);

    M.Image = null;
}

/**
 * @description Event handler called when the Cancel button of the Image Size Dialog is clicked.
 * @public
 * @function
 * 
 */
function imageSizeCancelHandler() {

    setMode(C.Mode.MANUAL);
    
    M.Image = null;
}

/**
 * @description Automatically generates program code by parsing an image file.
 * @param {Object} image - The image file to be parsed.
 * @private
 * @function
 * 
 */
function createAutoCode(image) {

    setErrorMessage(null);

    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;

    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);

    const variableName = Utils.cleanFileName(M.File.name, "pixelData");                          
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    S.AutoCode = new DataPixelsCodeFactory(variableName, imageData);
    S.AutoCode.formatCode(S.Alignment, S.Description);
    S.AutoCode.updateIndentation(S.Indentation);

    displayCode(S.AutoCode.output);
}

/**
 * @description Event handler called when the HTMLImageElement has encountered an error.
 * @param {Object} event - The event object.
 * @private
 * @function
 * 
 */
function imageErrorHandler(event) {

    const image = event.target;
    image.removeEventListener(C.Event.LOAD, imageLoadHandler);
    image.removeEventListener(C.Event.ERROR, imageErrorHandler);

    setErrorMessage(`${C.Label.ERROR} ${C.Label.FILE_CORRUPT}`);
    setMode(C.Mode.MANUAL);
}

/**
 * @description Updates the format and indentation of the automatically generates program code.
 * @public
 * @function
 * 
 */
function updateAutoCode() {

    if (S.Mode === C.Mode.AUTO && S.AutoCode) {

        S.AutoCode.formatCode(S.Alignment, S.Description);
        S.AutoCode.updateIndentation(S.Indentation);

        displayCode(S.AutoCode.output);
    }
}

/**
 * @description Displays the application's About dialog.
 * @public
 * @function
 * 
 */
function displayAboutDialog() {

    Popups.display(C.Dialog.ABOUT);
}

/**
 * @description Displays code from examples.js in the HTMLTextAreaElement.
 * @param {string} example - the name of the example object constant in examples.js.
 * @public
 * @function
 * 
 */
function displayExampleCode(example) {

    displayCode(Examples[example], false);
}